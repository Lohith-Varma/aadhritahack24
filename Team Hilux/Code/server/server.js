require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const webPush  = require('web-push');
const { GoogleGenAI } = require('@google/genai');

const DailyLog = require('./models/DailyLog');
const User     = require('./models/User');

let authRoutes;
try   { authRoutes = require('./routes/auth'); }
catch { authRoutes = null; console.warn('⚠️  routes/auth.js not found.'); }

const app  = express();
const PORT = process.env.PORT || 5000;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:loom@wellness.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/loom')
  .then(() => console.log('✅  MongoDB connected'))
  .catch((err) => console.error('❌  MongoDB error:', err));

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;


const MODEL_CHAIN = [
  'gemini-2.5-flash-lite', 
  'gemini-2.0-flash-lite', 
  'gemini-2.0-flash', 
];


const callLog = [];
const RPM_CAP = 8;

function acquireSlot() {
  const now    = Date.now();
  const cutoff = now - 60_000;

  while (callLog.length && callLog[0] < cutoff) callLog.shift();
  if (callLog.length >= RPM_CAP) return false;
  callLog.push(now);
  return true;
}


const insightCache = new Map();

function getInsightCache(userId) {
  const key   = userId.toString();
  const entry = insightCache.get(key);
  if (!entry) return null;
  if (entry.dateStr !== new Date().toDateString()) {
    insightCache.delete(key);
    return null;
  }
  return entry.insight;
}

function setInsightCache(userId, insight) {
  insightCache.set(userId.toString(), {
    insight,
    dateStr: new Date().toDateString(),
  });
}


const sleep       = (ms)  => new Promise((r) => setTimeout(r, ms));
const isRateLimit = (msg) => msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Too Many');
const isAuthError = (msg) => msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('leaked') || msg.includes('API key not valid');
const isNotFound  = (msg) => msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('not found');

const FALLBACK_INSIGHT = {
  pattern_detected: 'Chronic Late-Night Screen Exposure',
  severity:         'High',
  the_why:
    'Blue light from screens suppresses melatonin secretion, delaying sleep onset and fragmenting REM cycles. Reduced REM sleep directly impairs hippocampal memory consolidation and prefrontal cortex function — the two systems driving sustained focus.',
  action_step:
    'Set a hard "screens off" alarm 90 minutes before bedtime and enable Night Shift on all devices after 9 PM.',
  weekly_trend: 'Declining',
  _source:      'fallback',
};


async function callGemini(prompt, options = {}) {
  if (!ai) return null;

  if (!acquireSlot()) {
    console.warn(`⚠️  Server RPM cap (${RPM_CAP}/min) reached — skipping Gemini call`);
    return null;
  }

  const models = options.models || MODEL_CHAIN;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      console.log(`⏳  Trying: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      const text = response.text.trim().replace(/```json\n?|```\n?/g, '');
      console.log(`✅  Success: ${model}`);
      return text;
    } catch (err) {
      const msg = err?.message || String(err);

      if (isAuthError(msg)) {
        console.error('❌  Auth/key error — regenerate at https://aistudio.google.com/apikey');
        return null; 
      }

      if (isNotFound(msg)) {
        console.warn(`⚠️  ${model} — wrong name or unavailable, skipping…`);
        continue;
      }

      if (isRateLimit(msg)) {
        const waitMs = Math.pow(2, i) * 2000; 
        console.warn(`⚠️  ${model} — rate limited, waiting ${waitMs / 1000}s…`);
        await sleep(waitMs);
        continue;
      }

      console.warn(`⚠️  ${model} — ${msg.slice(0, 80)}, skipping…`);
    }
  }

  console.warn('⚠️  All models exhausted — fallback will be used');
  return null;
}


const GUEST_ID = new mongoose.Types.ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa');

const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = { _id: GUEST_ID }; req.userId = GUEST_ID;
    return next();
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'loom_dev_secret');
    try {
      const user = await User.findById(decoded.id).select('-password').lean();
      req.user   = user || { _id: decoded.id };
      req.userId = user ? user._id : decoded.id;
    } catch {
      req.user = { _id: decoded.id }; req.userId = decoded.id;
    }
  } catch {
    req.user = { _id: GUEST_ID }; req.userId = GUEST_ID;
  }
  next();
};

const strictAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided.' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'loom_dev_secret');
    const user    = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found.' });
    req.user = user; req.userId = user._id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('✅  Auth routes mounted at /api/auth');
}


app.get('/api/health', (req, res) => {
  const callsNow = callLog.filter((t) => Date.now() - t < 60_000).length;
  res.json({
    status:        'ok',
    mongodb:       mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    gemini:        ai ? 'configured' : 'missing',
    models:        MODEL_CHAIN,
    rpmUsed:       `${callsNow} / ${RPM_CAP}`,
    insightsCached: insightCache.size,
    time:           new Date().toISOString(),
  });
});


app.get('/api/seed', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    await DailyLog.deleteMany({ userId });
    insightCache.delete(userId.toString()); 

    const logs  = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const lateNightScreenTimeMins = Math.floor(Math.random() * 190) + 15;
      let sleepHours = 8.5 - (lateNightScreenTimeMins / 60) * 0.9 + (Math.random() * 1.4 - 0.7);
      sleepHours = parseFloat(Math.max(3.5, Math.min(9.5, sleepHours)).toFixed(1));
      const phonePickups = Math.floor(lateNightScreenTimeMins / 8 + Math.random() * 25 + 25);
      let focusScore = 7 + (sleepHours - 7) * 0.8 - (lateNightScreenTimeMins / 60) * 0.6 + (Math.random() * 2 - 1);
      focusScore = parseFloat(Math.max(1, Math.min(10, Math.round(focusScore * 10) / 10)).toFixed(1));
      const mood = Math.max(1, Math.min(5, Math.round(focusScore / 2)));

      logs.push({ userId, date, sleepHours, lateNightScreenTimeMins, phonePickups, focusScore, mood });
    }

    await DailyLog.insertMany(logs);
    res.json({ message: '✅  30 days seeded.', count: logs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/logs', optionalAuth, async (req, res) => {
  try {
    const logs = await DailyLog.find({ userId: req.userId }).sort({ date: 1 }).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/logs', optionalAuth, async (req, res) => {
  try {
    const { date, sleepHours, lateNightScreenTimeMins, phonePickups, mood = 3, notes = '' } = req.body;
    if (sleepHours == null || lateNightScreenTimeMins == null || phonePickups == null)
      return res.status(400).json({ error: 'sleepHours, lateNightScreenTimeMins, and phonePickups are required.' });

    const raw = 7 + (sleepHours - 7) * 0.8
              - (lateNightScreenTimeMins / 60) * 0.6
              - (phonePickups / 50) * 0.3
              + (mood - 3) * 0.2;
    const focusScore = parseFloat(Math.max(1, Math.min(10, raw)).toFixed(1));
    const logDate    = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    insightCache.delete(req.userId.toString()); 

    const log = await DailyLog.findOneAndUpdate(
      { userId: req.userId, date: logDate },
      { sleepHours, lateNightScreenTimeMins, phonePickups, focusScore, mood, notes },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/analyze', optionalAuth, async (req, res) => {
  try {
    const { logs, force = false } = req.body;
    if (!logs?.length) return res.status(400).json({ error: 'No logs provided.' });

    if (!force) {
      const cached = getInsightCache(req.userId);
      if (cached) {
        console.log(`📦  Serving cached insight for user …${req.userId.toString().slice(-6)}`);
        return res.json({ ...cached, _source: 'cache' });
      }
    }

    const dataStr = JSON.stringify(
      logs.slice(-7).map((l) => ({
        date:                    new Date(l.date).toLocaleDateString(),
        sleepHours:              l.sleepHours,
        lateNightScreenTimeMins: l.lateNightScreenTimeMins,
        phonePickups:            l.phonePickups,
        focusScore:              l.focusScore,
        mood:                    l.mood,
      }))
    );

    const prompt = `
      You are a student cognitive performance analyst.
      Analyse this data: ${dataStr}.
      Return ONLY valid JSON with no markdown or extra text:
      {
        "pattern_detected": "<concise name of the dominant pattern>",
        "severity": "<Low | Moderate | High | Critical>",
        "the_why": "<exactly 2-sentence biological explanation>",
        "action_step": "<exactly 1-sentence actionable rule for tonight>",
        "weekly_trend": "<Improving | Stable | Declining>"
      }
    `;

    let parsed = null;
    try {
      const raw = await callGemini(prompt);
      if (raw) parsed = JSON.parse(raw);
    } catch (e) {
      console.warn('⚠️  JSON parse failed:', e.message);
    }

    const result = parsed || FALLBACK_INSIGHT;
    if (parsed) setInsightCache(req.userId, result); 
    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err.message);
    res.json(FALLBACK_INSIGHT);
  }
});


app.post('/api/chat', optionalAuth, async (req, res) => {
  try {
    const { message, history = [], context = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    if (!ai)
      return res.json({ reply: 'Gemini API key not configured. Add GEMINI_API_KEY to server/.env' });

    if (!acquireSlot())
      return res.json({
        reply: "I'm briefly paused to respect API rate limits. Please wait 60 seconds and try again.",
      });

    const systemPrompt = `You are Loom Coach, a warm and empathetic AI wellness coach for students.
      Student's recent data: ${JSON.stringify(context.slice(-5))}.
      Give concise, science-backed advice under 150 words.
      Use bullet points when listing steps. Reference their actual data.`;


    const historyText = history
      .slice(-6) 
      .map((h) => `${h.role === 'user' ? 'Student' : 'Coach'}: ${h.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${historyText}\n\nStudent: ${message}\nCoach:`;

    const raw = await callGemini(fullPrompt);

    if (!raw) {
      return res.json({
        reply:
          "I'm at capacity right now (free tier: 250–1000 req/day). " +
          "Try the Simulator page — it works fully offline and shows your predicted focus score!",
      });
    }

    res.json({ reply: raw.trim() });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.json({ reply: 'Something went wrong. Please try again in a moment.' });
  }
});


app.post('/api/notifications/subscribe', optionalAuth, async (req, res) => {
  try {
    const { subscription, reminderTime } = req.body;
    if (req.userId.toString() !== GUEST_ID.toString()) {
      await User.findByIdAndUpdate(req.userId, {
        notificationSubscription: subscription,
        reminderTime: reminderTime || '21:00',
      });
    }
    res.json({ message: '✅  Push subscription saved.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/notifications/test', optionalAuth, async (req, res) => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY)
      return res.status(400).json({ error: 'VAPID keys not configured.' });
    const user = await User.findById(req.userId);
    if (!user?.notificationSubscription)
      return res.status(400).json({ error: 'No push subscription found.' });
    await webPush.sendNotification(
      user.notificationSubscription,
      JSON.stringify({ title: '🧵 Loom Reminder', body: "Time to log today's wellness data!", icon: '/icons/icon-192.png' })
    );
    res.json({ message: '✅  Test notification sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


process.on('unhandledRejection', (r) => console.error('⚠️  Unhandled Rejection:', r?.message || r));
process.on('uncaughtException',  (e) => console.error('⚠️  Uncaught Exception:',  e.message));

app.listen(PORT, () => {
  console.log(`\n🚀  Loom backend  →  http://localhost:${PORT}`);
  console.log(`🔍  Health check  →  http://localhost:${PORT}/api/health`);
  console.log(`🌱  Seed data     →  http://localhost:${PORT}/api/seed\n`);
});

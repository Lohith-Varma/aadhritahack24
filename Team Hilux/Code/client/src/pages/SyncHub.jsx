import { useState, useEffect } from 'react';
import {
  Heart, Calendar, Watch, Music2, Dumbbell, Moon,
  CheckCircle2, Loader2, Link2Off, Bell, Send,
  Shield, Zap, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const INTEGRATIONS = [
  {
    id: 'apple-health',
    name: 'Apple Health',
    description: 'Sync sleep stages, HRV, step count, and activity rings automatically.',
    icon: Heart,
    color: 'rose',
    badge: 'Recommended',
    category: 'Health',
    metrics: ['Sleep Stages', 'HRV', 'Steps', 'Active Calories'],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Detect academic deadlines, exam blocks, and predict stress-load spikes.',
    icon: Calendar,
    color: 'blue',
    badge: 'Popular',
    category: 'Productivity',
    metrics: ['Deadlines', 'Meeting Density', 'Free Blocks'],
  },
  {
    id: 'apple-watch',
    name: 'Apple Watch / Wear OS',
    description: 'Capture real-time wrist data: resting heart rate, SpO₂, and sleep patterns.',
    icon: Watch,
    color: 'indigo',
    badge: null,
    category: 'Wearable',
    metrics: ['Heart Rate', 'SpO₂', 'Wrist Temp'],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Correlate late-night listening habits and stimulating playlists with sleep latency.',
    icon: Music2,
    color: 'emerald',
    badge: 'Beta',
    category: 'Lifestyle',
    metrics: ['Listening Time', 'Genre Mood', 'Late-Night Sessions'],
  },
  {
    id: 'gymkit',
    name: 'GymKit / Fitness',
    description: 'Track workout timing and intensity to understand your energy-recovery cycles.',
    icon: Dumbbell,
    color: 'amber',
    badge: null,
    category: 'Fitness',
    metrics: ['Workout Duration', 'Intensity', 'Recovery Score'],
  },
  {
    id: 'sleep-cycle',
    name: 'Sleep Cycle',
    description: 'Import granular sleep-stage data and morning quality scores directly into Loom.',
    icon: Moon,
    color: 'purple',
    badge: null,
    category: 'Sleep',
    metrics: ['Sleep Quality', 'REM %', 'Deep Sleep %'],
  },
];

const COLOR_MAP = {
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400',    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/20',    connected: 'border-rose-500/30 shadow-rose-500/10' },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400',    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',    connected: 'border-blue-500/30 shadow-blue-500/10' },
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  text: 'text-indigo-400',  badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',  connected: 'border-indigo-500/30 shadow-indigo-500/10' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', connected: 'border-emerald-500/30 shadow-emerald-500/10' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',   connected: 'border-amber-500/30 shadow-amber-500/10' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400',  badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20',  connected: 'border-purple-500/30 shadow-purple-500/10' },
};

function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array();
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function SyncHub() {
  const { authFetch } = useAuth();

  const [cardStates, setCardStates] = useState(
    () => Object.fromEntries(INTEGRATIONS.map((i) => [i.id, 'idle']))
  );

  const [notifState,    setNotifState]    = useState('idle');
  const [reminderTime,  setReminderTime]  = useState('21:00');
  const [testSending,   setTestSending]   = useState(false);
  const [testSent,      setTestSent]      = useState(false);
  const [notifSupported, setNotifSupported] = useState(true);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifSupported(false);
    }
    if (Notification.permission === 'granted') {
      setNotifState('granted');
    } else if (Notification.permission === 'denied') {
      setNotifState('denied');
    }
  }, []);

  const connectedCount = Object.values(cardStates).filter((s) => s === 'connected').length;

  const handleConnect = (id) => {
    if (cardStates[id] === 'connected') {
      setCardStates((p) => ({ ...p, [id]: 'idle' }));
      return;
    }
    setCardStates((p) => ({ ...p, [id]: 'syncing' }));
    setTimeout(() => {
      setCardStates((p) => ({ ...p, [id]: 'connected' }));
    }, 2000);
  };

  const requestNotifications = async () => {
    setNotifState('requesting');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotifState('denied');
        return;
      }

      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          if (vapidKey) {
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
            await authFetch(`${API}/notifications/subscribe`, {
              method: 'POST',
              body: JSON.stringify({ subscription: sub, reminderTime }),
            });
          }
        } catch (swErr) {
          console.warn('SW subscription failed (VAPID key may be missing):', swErr.message);
        }
      }
      setNotifState('granted');
    } catch (err) {
      console.error('Notification error:', err);
      setNotifState('denied');
    }
  };

  const sendTestNotification = async () => {
    setTestSending(true);
    try {
      const res = await authFetch(`${API}/notifications/test`, { method: 'POST' });
      if (!res.ok) throw new Error('Server push failed');
    } catch {
      if (Notification.permission === 'granted') {
        new Notification('🧵 Loom Reminder', {
          body: "Time to log today's wellness data and protect your focus score!",
          icon: '/icons/icon-192.png',
        });
      }
    } finally {
      setTestSending(false);
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  const disconnectNotifications = () => {
    setNotifState('idle');
    setTestSent(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

      <div>
        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mb-1">
          Data Sources
        </p>
        <h1 className="text-3xl font-bold text-white">Sync Hub</h1>
        <p className="text-slate-400 mt-2 max-w-2xl text-sm">
          Connect your health apps to give Loom richer behavioural signals for more
          accurate, personalised AI predictions.
        </p>
      </div>

      <div className={`rounded-2xl p-5 border flex items-center justify-between gap-4 transition-all duration-500 ${
        connectedCount > 0
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-slate-800 border-slate-700'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            connectedCount > 0 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700 border border-slate-600'
          }`}>
            <Zap className={`w-5 h-5 ${connectedCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
          </div>
          <div>
            <p className={`font-semibold text-sm ${connectedCount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
              {connectedCount > 0
                ? `${connectedCount} source${connectedCount > 1 ? 's' : ''} connected — Loom AI is learning`
                : 'No sources connected yet'}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {connectedCount > 0
                ? 'AI insights now factor in real behavioural data from your connected apps.'
                : 'Connect at least one source to enhance your AI-powered wellness insights.'}
            </p>
          </div>
        </div>
        {connectedCount > 0 && (
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Available Integrations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INTEGRATIONS.map(({ id, name, description, icon: Icon, color, badge, category, metrics }) => {
            const state = cardStates[id];
            const c     = COLOR_MAP[color];

            return (
              <div
                key={id}
                className={`bg-slate-800 border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 ${
                  state === 'connected'
                    ? `border-emerald-500/30 shadow-lg ${c.connected}`
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${c.bg} border ${c.border}`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {badge && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c.badge}`}>
                        {badge}
                      </span>
                    )}
                    <span className="text-xs text-slate-600 bg-slate-700/60 px-2 py-0.5 rounded-full">
                      {category}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm">{name}</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{description}</p>
                </div>

                {/* Metric Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {metrics.map((m) => (
                    <span key={m} className="text-xs text-slate-600 bg-slate-700/50 px-2 py-0.5 rounded-lg">
                      {m}
                    </span>
                  ))}
                </div>

                {/* Connect Button */}
                <button
                  onClick={() => handleConnect(id)}
                  disabled={state === 'syncing'}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 border ${
                    state === 'connected'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                      : state === 'syncing'
                      ? 'bg-slate-700/50 text-slate-400 border-slate-600 cursor-not-allowed'
                      : `${c.bg} ${c.text} ${c.border} hover:opacity-80`
                  }`}
                >
                  {state === 'syncing'   && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {state === 'connected' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {state === 'idle'      && <Link2Off className="w-3.5 h-3.5" />}
                  {state === 'idle'      && 'Connect'}
                  {state === 'syncing'   && 'Syncing…'}
                  {state === 'connected' && 'Connected — Disconnect'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Smart Notifications
        </h2>
        <div className="bg-slate-800 border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${
                notifState === 'granted'
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-indigo-500/10 border border-indigo-500/20'
              }`}>
                <Bell className={`w-5 h-5 ${notifState === 'granted' ? 'text-emerald-400' : 'text-indigo-400'}`} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Daily Wellness Reminders</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm leading-relaxed">
                  Get a personalised push notification each evening reminding you to log your data. Research shows daily tracking reminders improve habit adherence by 47%.
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 ${
              notifState === 'granted' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
              notifState === 'denied'  ? 'bg-rose-500/15 text-rose-400 border-rose-500/25' :
              notifState === 'requesting' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
              'bg-slate-700/50 text-slate-400 border-slate-600'
            }`}>
              {notifState === 'granted'    ? '✅ Active' :
               notifState === 'denied'     ? '🚫 Blocked' :
               notifState === 'requesting' ? '⏳ Requesting…' : '○ Inactive'}
            </span>
          </div>

          {/* Controls */}
          <div className="mt-5 flex flex-wrap items-end gap-4">
            {/* Time Picker */}
            <div>
              <label className="block text-slate-500 text-xs font-medium mb-1.5">
                Reminder Time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                disabled={notifState === 'granted'}
                className="bg-slate-700 border border-slate-600 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              {notifState !== 'granted' ? (
                <button
                  onClick={requestNotifications}
                  disabled={notifState === 'requesting' || notifState === 'denied' || !notifSupported}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    notifState === 'denied' || !notifSupported
                      ? 'bg-slate-700/50 text-slate-500 border-slate-600 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                  }`}
                >
                  {notifState === 'requesting'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Bell className="w-4 h-4" />}
                  {!notifSupported       ? 'Not Supported'       :
                   notifState === 'denied'     ? 'Blocked in Browser'  :
                   notifState === 'requesting' ? 'Requesting…'         : 'Enable Reminders'}
                </button>
              ) : (
                <>
                  {/* Test Button */}
                  <button
                    onClick={sendTestNotification}
                    disabled={testSending}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                      testSent
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600'
                    }`}
                  >
                    {testSending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : testSent
                      ? <CheckCircle2 className="w-4 h-4" />
                      : <Send className="w-4 h-4" />}
                    {testSending ? 'Sending…' : testSent ? 'Sent!' : 'Send Test'}
                  </button>

                  {/* Update Time */}
                  <button
                    onClick={requestNotifications}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-700 hover:bg-slate-600 border border-slate-600 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Update Time
                  </button>

                  {/* Disconnect */}
                  <button
                    onClick={disconnectNotifications}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 transition-all"
                  >
                    Disable
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Active confirmation */}
          {notifState === 'granted' && (
            <div className="mt-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-emerald-300 text-xs">
                You'll receive a daily reminder at <strong>{reminderTime}</strong> to log your wellness data.
              </p>
            </div>
          )}

          {/* Denied help */}
          {notifState === 'denied' && (
            <div className="mt-4 bg-rose-500/8 border border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-rose-300 text-xs leading-relaxed">
                Notifications are blocked. Go to <strong>Browser Settings → Site Settings → Notifications</strong> and allow <code className="bg-slate-700 px-1 rounded">localhost:3000</code> to enable reminders.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard value={connectedCount} label="Sources Connected" color="text-emerald-400" />
        <StatCard value={notifState === 'granted' ? '✓' : '✗'} label="Reminders Active" color={notifState === 'granted' ? 'text-emerald-400' : 'text-slate-500'} />
        <StatCard value="Read-Only" label="Access Mode" color="text-indigo-400" />
        <StatCard value="0 ms" label="Data Retained" color="text-purple-400" />
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex gap-4 items-start">
        <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-slate-300 font-semibold text-sm">Privacy-First Architecture</p>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            All integrations are <strong className="text-slate-400">read-only</strong>. Loom never writes to your health sources, stores raw health records on external servers, or shares your data with third parties. All AI analysis runs ephemerally — no personal data is retained after your session ends.
          </p>
        </div>
      </div>
    </div>
  );
}


function StatCard({ value, label, color }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-slate-500 text-xs mt-1">{label}</p>
    </div>
  );
}

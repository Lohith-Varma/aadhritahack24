import { useState, useEffect } from 'react';
import {
  Sun, Cloud, CloudLightning, Brain,
  Zap, Moon, Eye, Phone, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

export default function Dashboard() {
  const { authFetch, user } = useAuth();

  const [logs,        setLogs]        = useState([]);
  const [insight,     setInsight]     = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [seeding,     setSeeding]     = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    setError('');
    try {
      const res  = await authFetch(`${API}/logs`);
      // 401 = not logged in
      if (res.status === 401) {
        setError('Session expired. Please log in again.');
        setLoadingLogs(false);
        return;
      }
      const data = await res.json();
      setLogs(data);
      if (data.length >= 3) {
        await analyzeData(data.slice(-7));
      }
    } catch (e) {
      setError('Cannot connect to server. Make sure the backend is running on port 5000.');
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const analyzeData = async (recent) => {
    setAnalyzing(true);
    try {
      const res = await authFetch(`${API}/analyze`, {
        method: 'POST',
        body: JSON.stringify({ logs: recent }),
      });
      const data = await res.json();
      setInsight(data);
    } catch (e) {
      console.error('Analyze error:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setInsight(null);
    try {
      const res = await authFetch(`${API}/seed`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Seed failed');
      await fetchLogs();
    } catch (e) {
      setError(e.message);
    } finally {
      setSeeding(false);
    }
  };

  const yesterday = logs[logs.length - 2];
  const today     = logs[logs.length - 1];

  const getWeather = () => {
    if (!yesterday) return {
      Icon: Sun,
      label: 'Awaiting Data',
      color: 'text-slate-400',
      desc: 'Click "Seed 30-Day Mock Data" below to populate your dashboard.',
    };
    const { sleepHours: s, lateNightScreenTimeMins: sc } = yesterday;
    if (s >= 7 && sc <= 60)  return {
      Icon: Sun,
      label: 'Sunny Focus Day',
      color: 'text-yellow-400',
      desc: 'Excellent sleep and minimal screen exposure — your prefrontal cortex is primed for deep, sustained work today.',
    };
    if (s >= 6 && sc <= 120) return {
      Icon: Cloud,
      label: 'Partly Cloudy Focus',
      color: 'text-blue-300',
      desc: 'Moderate signals suggest average cognitive performance. Prioritise breaks and stay hydrated.',
    };
    return {
      Icon: CloudLightning,
      label: 'Storm Warning ⚡',
      color: 'text-rose-400',
      desc: 'High screen exposure and insufficient sleep will significantly impair focus, memory recall, and reaction time today.',
    };
  };

  const { Icon: WeatherIcon, label, color, desc } = getWeather();

  if (loadingLogs) return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      <p className="text-slate-400 text-sm">Loading your wellness data…</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-bold text-white">
            Your Wellness Dashboard
          </h1>
          {user && (
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, <span className="text-indigo-400 font-medium">{user.name}</span>
            </p>
          )}
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border ${
          logs.length > 0
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-slate-800 border-slate-700 text-slate-500'
        }`}>
          <span className={`w-2 h-2 rounded-full ${logs.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          {logs.length > 0 ? `${logs.length} logs in DB` : 'No data in DB'}
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="font-semibold">Connection Error</p>
            <p className="text-rose-300/80 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {logs.length === 0 && !error && (
        <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-400 font-semibold">No data found for your account</p>
            <p className="text-slate-400 text-sm mt-1">
              Seed 30 days of correlated mock data to see your dashboard come alive.
            </p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition shadow-lg shadow-indigo-500/25"
          >
            <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Generating data…' : 'Seed 30-Day Mock Data'}
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-5">
          ☁️ Focus Weather Forecast
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className={`p-5 rounded-2xl bg-slate-700/60 ${color} shrink-0`}>
            <WeatherIcon className="w-14 h-14" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${color}`}>{label}</h2>
            <p className="text-slate-300 leading-relaxed max-w-2xl">{desc}</p>
            {yesterday && (
              <div className="flex gap-3 mt-4 flex-wrap">
                <span className="text-xs text-slate-500 bg-slate-700/50 px-3 py-1.5 rounded-lg">
                  😴 {yesterday.sleepHours}h sleep
                </span>
                <span className="text-xs text-slate-500 bg-slate-700/50 px-3 py-1.5 rounded-lg">
                  📱 {yesterday.lateNightScreenTimeMins}m screen
                </span>
                <span className="text-xs text-slate-500 bg-slate-700/50 px-3 py-1.5 rounded-lg">
                  🎯 Focus: {yesterday.focusScore}/10
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Today's Inputs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Moon} label="Sleep Last Night"
            value={today ? `${today.sleepHours}h` : '--'}
            sub="hours"
            color="text-indigo-400"
            ringColor="border-indigo-500/30"
            glow="bg-indigo-500/10"
          />
          <StatCard
            icon={Eye} label="Late Screen Time"
            value={today ? `${today.lateNightScreenTimeMins}m` : '--'}
            sub="mins after 10 PM"
            color="text-rose-400"
            ringColor="border-rose-500/30"
            glow="bg-rose-500/10"
          />
          <StatCard
            icon={Phone} label="Phone Pickups"
            value={today ? `${today.phonePickups}×` : '--'}
            sub="times today"
            color="text-amber-400"
            ringColor="border-amber-500/30"
            glow="bg-amber-500/10"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          AI Insight Feed — Powered by Gemini
        </h2>

        {analyzing ? (
          <div className="bg-slate-800 border border-indigo-500/20 rounded-2xl p-8 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
            <div>
              <p className="text-slate-300 text-sm font-medium">Gemini 2.5 Flash is analysing your patterns…</p>
              <p className="text-slate-500 text-xs mt-1">Scanning last 7 days of behavioural data</p>
            </div>
          </div>
        ) : insight ? (
          <InsightCard insight={insight} />
        ) : logs.length >= 3 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-sm">
              Data loaded but no insight yet.{' '}
              <button
                onClick={() => analyzeData(logs.slice(-7))}
                className="text-indigo-400 underline hover:text-indigo-300"
              >
                Run AI analysis now
              </button>
            </p>
          </div>
        ) : null}
      </div>

      {logs.length > 0 && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 text-sm font-medium transition border border-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Generating…' : 'Re-seed 30-Day Mock Data'}
          </button>
        </div>
      )}
    </div>
  );
}


function StatCard({ icon: Icon, label, value, sub, color, ringColor, glow }) {
  return (
    <div className={`bg-slate-800 border ${ringColor} rounded-2xl p-5 flex items-center gap-4`}>
      <div className={`p-3 rounded-xl ${glow} border ${ringColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-slate-600 text-xs">{sub}</p>
      </div>
    </div>
  );
}

function InsightCard({ insight }) {
  return (
    <div className="relative bg-slate-800 border border-indigo-500/30 rounded-2xl p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 rounded-2xl pointer-events-none" />
      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-transparent rounded-l-2xl" />

      <div className="pl-4 space-y-5">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
            Gemini AI · Behavioural Pattern Analysis
          </span>
          {insight.severity && (
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ml-auto ${
              insight.severity === 'Critical' ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' :
              insight.severity === 'High'     ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
              insight.severity === 'Moderate' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' :
                                                'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
            }`}>
              {insight.severity} severity
            </span>
          )}
        </div>

        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Pattern Detected</p>
          <p className="text-white text-lg font-semibold leading-snug">{insight.pattern_detected}</p>
          {insight.weekly_trend && (
            <span className={`inline-block text-xs mt-2 px-2.5 py-0.5 rounded-full border ${
              insight.weekly_trend === 'Improving' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
              insight.weekly_trend === 'Declining' ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' :
                                                     'bg-slate-700 text-slate-400 border-slate-600'
            }`}>
              {insight.weekly_trend === 'Improving' ? '📈' : insight.weekly_trend === 'Declining' ? '📉' : '➡️'} {insight.weekly_trend} trend
            </span>
          )}
        </div>

        <div className="bg-slate-700/50 rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">🧠 The Science Behind It</p>
          <p className="text-slate-300 text-sm leading-relaxed">{insight.the_why}</p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-500 text-xs uppercase tracking-widest mb-2">⚡ Tonight's Action Step</p>
          <p className="text-emerald-300 text-sm font-medium leading-relaxed">{insight.action_step}</p>
        </div>
      </div>
    </div>
  );
}

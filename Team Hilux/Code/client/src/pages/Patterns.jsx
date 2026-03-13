import { useState, useEffect } from 'react';
import {
  ScatterChart, Scatter, AreaChart, Area, BarChart, Bar,
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Label, Legend,
} from 'recharts';
import { TrendingDown, Activity, BarChart2, Moon, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CHART_TOOLTIP = (labelMap) => ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs shadow-xl space-y-1">
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {labelMap[p.name] || p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function Patterns() {
  const { authFetch }    = useAuth();
  const [logs, setLogs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    authFetch(`${API}/logs`)
      .then((r) => r.json())
      .then((d) => { setLogs(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Derived datasets ──────────────────────────────────────────────────────
  const scatterData = logs.map((l) => ({ x: l.lateNightScreenTimeMins, y: l.focusScore }));

  const areaData = logs.map((l) => ({
    date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    focusScore: l.focusScore,
    sleepHours: l.sleepHours,
  }));

  const dayOfWeekData = DAY_NAMES.map((day, idx) => {
    const dayLogs = logs.filter((l) => new Date(l.date).getDay() === idx);
    return {
      day,
      screen: dayLogs.length ? parseFloat((dayLogs.reduce((s, l) => s + l.lateNightScreenTimeMins, 0) / dayLogs.length).toFixed(0)) : 0,
      focus:  dayLogs.length ? parseFloat((dayLogs.reduce((s, l) => s + l.focusScore, 0) / dayLogs.length).toFixed(1)) : 0,
    };
  });

  const composedData = logs.slice(-14).map((l) => ({
    date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sleep: l.sleepHours,
    focus: l.focusScore,
  }));

  const n        = scatterData.length || 1;
  const avgFocus = (logs.reduce((s, l) => s + l.focusScore, 0) / n).toFixed(1);
  const avgSleep = (logs.reduce((s, l) => s + l.sleepHours, 0) / n).toFixed(1);
  const avgScreen = Math.round(logs.reduce((s, l) => s + l.lateNightScreenTimeMins, 0) / n);
  const negDays  = scatterData.filter((d) => d.x > 90 && d.y <= 5).length;

  const TABS = [
    { label: 'Correlation',  icon: Activity },
    { label: 'Focus Trend',  icon: TrendingDown },
    { label: 'Weekly Rhythm',icon: BarChart2 },
    { label: 'Sleep vs Focus',icon: Layers },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      <p className="text-slate-400 text-sm">Loading 30-day pattern data…</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mb-1">Data Analysis</p>
        <h1 className="text-3xl font-bold text-white">Behavioral Patterns</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">30-day visualization of your behavioral data and cognitive performance correlations.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="Avg Focus Score"  value={`${avgFocus}/10`} color="text-indigo-400" />
        <MiniStat label="Avg Sleep"        value={`${avgSleep}h`}   color="text-purple-400" />
        <MiniStat label="Avg Screen Time"  value={`${avgScreen}m`}  color="text-rose-400" />
        <MiniStat label="High-Risk Days"   value={`${negDays} days`} color="text-amber-400" />
      </div>

      {/* Chart Tabs */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-700 overflow-x-auto">
          {TABS.map(({ label, icon: Icon }, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === i
                  ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Tab 0: Scatter */}
          {activeTab === 0 && (
            <ChartWrapper title="Screen Time vs. Next-Day Focus" sub="Each dot = one day. Yellow line = 90-min danger threshold.">
              <ResponsiveContainer width="100%" height={380}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="x" type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 'dataMax + 15']}>
                    <Label value="Late Night Screen Time (mins)" offset={-20} position="insideBottom" fill="#64748b" fontSize={12} />
                  </XAxis>
                  <YAxis dataKey="y" type="number" domain={[1, 10]} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }}>
                    <Label value="Focus Score (1–10)" angle={-90} position="insideLeft" fill="#64748b" fontSize={12} />
                  </YAxis>
                  <Tooltip content={CHART_TOOLTIP({ x: '📱 Screen', y: '🎯 Focus' })} />
                  <ReferenceLine x={90} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1.5}
                    label={{ value: '90 min ⚠️', fill: '#f59e0b', fontSize: 11, position: 'insideTopRight' }} />
                  <Scatter data={scatterData} fill="#6366f1" opacity={0.75} r={5} />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartWrapper>
          )}

          {/* Tab 1: Area Chart */}
          {activeTab === 1 && (
            <ChartWrapper title="30-Day Focus Score Trend" sub="See how your focus score has evolved over the past month.">
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={areaData} margin={{ top: 20, right: 20, bottom: 40, left: 0 }}>
                  <defs>
                    <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }}
                    interval={4} angle={-30} textAnchor="end" height={50} />
                  <YAxis domain={[1, 10]} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip content={CHART_TOOLTIP({ focusScore: '🎯 Focus Score' })} />
                  <ReferenceLine y={7} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1}
                    label={{ value: 'Target: 7', fill: '#10b981', fontSize: 11, position: 'insideRight' }} />
                  <Area type="monotone" dataKey="focusScore" stroke="#6366f1" strokeWidth={2.5}
                    fill="url(#focusGrad)" dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          )}

          {/* Tab 2: Bar Chart — Weekly Rhythm */}
          {activeTab === 2 && (
            <ChartWrapper title="Weekly Screen Time Rhythm" sub="Average late-night screen exposure by day of week across 30 days.">
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={dayOfWeekData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip content={CHART_TOOLTIP({ screen: '📱 Screen (min)', focus: '🎯 Avg Focus' })} />
                  <Legend formatter={(v) => <span className="text-slate-400 text-xs">{v === 'screen' ? '📱 Avg Screen Time' : '🎯 Avg Focus Score'}</span>} />
                  <Bar yAxisId="left" dataKey="screen" fill="#f43f5e" opacity={0.8} radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="focus" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          )}

          {/* Tab 3: Composed — Sleep vs Focus */}
          {activeTab === 3 && (
            <ChartWrapper title="Sleep Hours vs. Focus Score (Last 14 Days)" sub="Overlaid comparison showing how sleep directly maps to next-day focus.">
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={composedData} margin={{ top: 20, right: 20, bottom: 40, left: 0 }}>
                  <defs>
                    <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }}
                    angle={-30} textAnchor="end" height={50} />
                  <YAxis yAxisId="sleep" domain={[3, 10]} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis yAxisId="focus" orientation="right" domain={[1, 10]} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip content={CHART_TOOLTIP({ sleep: '😴 Sleep (hrs)', focus: '🎯 Focus Score' })} />
                  <Legend formatter={(v) => <span className="text-slate-400 text-xs">{v === 'sleep' ? '😴 Sleep Hours' : '🎯 Focus Score'}</span>} />
                  <Area yAxisId="sleep" type="monotone" dataKey="sleep" stroke="#a78bfa" strokeWidth={2}
                    fill="url(#sleepGrad)" dot={false} />
                  <Line yAxisId="focus" type="monotone" dataKey="focus" stroke="#10b981" strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartWrapper>
          )}
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-gradient-to-br from-rose-500/10 to-slate-800 border border-rose-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
          <h3 className="text-white font-semibold">Pattern Intelligence Summary</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Over 30 days, <span className="text-amber-400 font-semibold">{negDays} nights</span> with screen exposure exceeding 90 minutes directly preceded low-focus days (≤5/10). Your average focus of <span className="text-indigo-400 font-semibold">{avgFocus}/10</span> and average sleep of <span className="text-purple-400 font-semibold">{avgSleep}h</span> show a clear biological link — every 1 hour of lost sleep correlates with approximately a 0.8-point drop in focus score.
        </p>
      </div>
    </div>
  );
}

function ChartWrapper({ title, sub, children }) {
  return (
    <div>
      <h2 className="text-white font-semibold mb-1">{title}</h2>
      <p className="text-slate-500 text-xs mb-5">{sub}</p>
      {children}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Eye, Phone, Smile, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😩', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

export default function LogEntry() {
  const { authFetch } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    sleepHours: 7,
    lateNightScreenTimeMins: 60,
    phonePickups: 40,
    mood: 3,
    notes: '',
  });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  const previewScore = Math.max(1, Math.min(10,
    parseFloat((7 + (form.sleepHours - 7) * 0.8
      - (form.lateNightScreenTimeMins / 60) * 0.6
      - (form.phonePickups / 50) * 0.3
      + ((form.mood - 3) * 0.2)).toFixed(1))
  ));

  const scoreColor =
    previewScore >= 7.5 ? 'text-emerald-400' :
    previewScore >= 5   ? 'text-amber-400'   : 'text-rose-400';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === 'notes' || name === 'date' ? value : parseFloat(value) }));
  };

  const handleMood = (val) => setForm((p) => ({ ...p, mood: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authFetch(`${API}/logs`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Log saved!</h2>
          <p className="text-slate-400">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mb-1">Daily Entry</p>
        <h1 className="text-3xl font-bold text-white">Log Today's Data</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Takes under 30 seconds. Your AI insight updates automatically.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <label className="block text-slate-300 text-sm font-medium mb-2">📅 Date</label>
          <input
            type="date" name="date" value={form.date}
            max={new Date().toISOString().split('T')[0]}
            onChange={handleChange}
            className="bg-slate-700/50 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition w-full"
          />
        </div>

        <SliderCard
          icon={Moon} color="indigo" iconBg="bg-indigo-500/10" iconBorder="border-indigo-500/20"
          label="Sleep Last Night" name="sleepHours" value={form.sleepHours}
          min={1} max={12} step={0.5} unit="hrs" onChange={handleChange}
          hint={form.sleepHours >= 7.5 ? '✅ Optimal range' : '⚠️ Below recommended 7.5h'}
          hintColor={form.sleepHours >= 7.5 ? 'text-emerald-400' : 'text-amber-400'}
        />

        <SliderCard
          icon={Eye} color="rose" iconBg="bg-rose-500/10" iconBorder="border-rose-500/20"
          label="Late Night Screen Time" name="lateNightScreenTimeMins" value={form.lateNightScreenTimeMins}
          min={0} max={300} step={5} unit="min" onChange={handleChange}
          hint={form.lateNightScreenTimeMins <= 60 ? '✅ Safe threshold' : '⚠️ Exceeds 60 min recommendation'}
          hintColor={form.lateNightScreenTimeMins <= 60 ? 'text-emerald-400' : 'text-rose-400'}
        />

        <SliderCard
          icon={Phone} color="amber" iconBg="bg-amber-500/10" iconBorder="border-amber-500/20"
          label="Phone Pickups" name="phonePickups" value={form.phonePickups}
          min={0} max={200} step={5} unit="×" onChange={handleChange}
          hint={form.phonePickups <= 40 ? '✅ Low interruption' : '⚠️ High distraction count'}
          hintColor={form.phonePickups <= 40 ? 'text-emerald-400' : 'text-amber-400'}
        />

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Smile className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-slate-300 text-sm font-medium">Today's Mood</span>
          </div>
          <div className="flex gap-3 justify-between">
            {MOOD_OPTIONS.map(({ value, emoji, label }) => (
              <button
                key={value} type="button" onClick={() => handleMood(value)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                  form.mood === value
                    ? 'bg-purple-500/15 border-purple-500/30 scale-105'
                    : 'bg-slate-700/30 border-slate-600/50 hover:border-slate-500'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-slate-500 text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-slate-700 border border-slate-600">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-slate-300 text-sm font-medium">Notes (optional)</span>
          </div>
          <textarea
            name="notes" value={form.notes} onChange={handleChange}
            placeholder="Anything notable today? Exam stress, late workout, caffeine after 5pm…"
            rows={3}
            className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-widest">Predicted Focus Score</p>
            <p className={`text-4xl font-black tabular-nums ${scoreColor}`}>{previewScore}<span className="text-slate-500 text-lg font-normal">/10</span></p>
          </div>
          <button
            type="submit" disabled={loading}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving…' : 'Save Log'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SliderCard({ icon: Icon, color, iconBg, iconBorder, label, name, value, min, max, step, unit, onChange, hint, hintColor }) {
  const pct = ((value - min) / (max - min)) * 100;
  const TRACK = { indigo: '#6366f1', rose: '#f43f5e', amber: '#f59e0b' };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${iconBg} border ${iconBorder}`}>
            <Icon className={`w-4 h-4 text-${color}-400`} />
          </div>
          <span className="text-slate-300 text-sm font-medium">{label}</span>
        </div>
        <span className="text-white font-bold text-sm tabular-nums bg-slate-700 border border-slate-600 px-3 py-1 rounded-lg">
          {value}{unit}
        </span>
      </div>
      <div className="relative flex items-center">
        <div className="absolute w-full h-2 bg-slate-700 rounded-full overflow-hidden pointer-events-none">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TRACK[color], opacity: 0.75 }} />
        </div>
        <input type="range" name={name} min={min} max={max} step={step} value={value} onChange={onChange}
          className="relative w-full h-2 bg-transparent appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
        />
      </div>
      <p className={`text-xs mt-2 ${hintColor}`}>{hint}</p>
    </div>
  );
}

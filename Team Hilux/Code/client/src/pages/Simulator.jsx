import { useState, useEffect } from 'react';
import {
  Moon, Eye, Phone, Smile,
  CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

// ── Scoring Model v2 (non-linear, science-backed) ─────────────────────────────
function calcScore({ sleep, screen, pickups, mood }) {
  const sleepComponent =
    sleep >= 6
      ? (sleep - 7) * 0.9
      : (sleep - 7) * 1.8; 

  const screenPenalty =
    (screen / 60) * 0.65 +
    (screen > 120 ? 0.5 : 0); 

  const pickupPenalty = Math.log1p(pickups) * 0.25;
  const moodBonus = (mood - 3) * 0.25;

  const raw = 7 + sleepComponent - screenPenalty - pickupPenalty + moodBonus;
  return parseFloat(Math.max(1, Math.min(10, raw)).toFixed(1));
}

function getTheme(score) {
  if (score >= 8.5) return {
    label: 'Peak Performance 🚀',
    scoreColor: 'text-emerald-400',
    ringClass: 'border-emerald-400/50',
    glowClass: 'bg-emerald-500/10',
    barClass: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    advice: 'Exceptional conditions. This is your best window for exams or deep work sessions.',
    pillActive: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  if (score >= 7.5) return {
    label: 'Excellent Focus 🌟',
    scoreColor: 'text-emerald-400',
    ringClass: 'border-emerald-400/40',
    glowClass: 'bg-emerald-500/8',
    barClass: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    advice: 'Strong cognitive conditions. Tackle your hardest tasks and prioritise deep focus blocks.',
    pillActive: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  if (score >= 6) return {
    label: 'Moderate Focus 😐',
    scoreColor: 'text-amber-400',
    ringClass: 'border-amber-400/40',
    glowClass: 'bg-amber-500/8',
    barClass: 'bg-gradient-to-r from-amber-600 to-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    advice: 'Functional but not optimal. Use the Pomodoro technique — 25-min work, 5-min break.',
    pillActive: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  if (score >= 4) return {
    label: 'Below Average 😓',
    scoreColor: 'text-amber-400',
    ringClass: 'border-amber-400/30',
    glowClass: 'bg-amber-500/5',
    barClass: 'bg-gradient-to-r from-amber-700 to-amber-500',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    advice: 'Cognitive performance impaired. Avoid high-stakes decisions and plan recovery rest.',
    pillActive: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  return {
    label: 'Critical Impairment 😵',
    scoreColor: 'text-rose-400',
    ringClass: 'border-rose-400/40',
    glowClass: 'bg-rose-500/8',
    barClass: 'bg-gradient-to-r from-rose-700 to-rose-500',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    advice: 'Severe cognitive deficit. Rest and recovery must be your absolute top priority today.',
    pillActive: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
}

const MOOD_OPTIONS = [
  { value: 1, emoji: '😩', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

const SCORE_BANDS = [
  { range: '1–4',    desc: 'Poor',      active: (s) => s < 5 },
  { range: '4–6',    desc: 'Moderate',  active: (s) => s >= 4 && s < 6 },
  { range: '6–7.5',  desc: 'Good',      active: (s) => s >= 6 && s < 7.5 },
  { range: '7.5–10', desc: 'Excellent', active: (s) => s >= 7.5 },
];

export default function Simulator() {
  const [sleep,   setSleep]   = useState(7);
  const [screen,  setScreen]  = useState(90);
  const [pickups, setPickups] = useState(60);
  const [mood,    setMood]    = useState(3);
  const [score,   setScore]   = useState(null);
  const [prev,    setPrev]    = useState(null);

  useEffect(() => {
    const next = calcScore({ sleep, screen, pickups, mood });
    setScore((cur) => { setPrev(cur); return next; });
  }, [sleep, screen, pickups, mood]);

  if (score === null) return null;

  const theme      = getTheme(score);
  const barWidthPct = `${((score - 1) / 9) * 100}%`;
  const delta      = prev !== null ? parseFloat((score - prev).toFixed(1)) : 0;

  // Breakdown values
  const sleepImpact   = sleep >= 6 ? (sleep - 7) * 0.9 : (sleep - 7) * 1.8;
  const screenImpact  = (screen / 60) * 0.65 + (screen > 120 ? 0.5 : 0);
  const pickupImpact  = Math.log1p(pickups) * 0.25;
  const moodImpact    = (mood - 3) * 0.25;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

      <div>
        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mb-1">
          Interactive Model
        </p>
        <h1 className="text-3xl font-bold text-white">What-If Wellness Engine</h1>
        <p className="text-slate-400 mt-2 max-w-2xl text-sm">
          Adjust tonight's behaviours and watch your projected focus score recalculate
          in real time using a science-backed multi-factor model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        <div className="space-y-5">

          {/* Sliders Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-8">
            <h2 className="text-white font-semibold text-base flex items-center gap-2">
              <span className="text-lg">🎛️</span> Adjust Tonight's Behaviours
            </h2>

            <SliderInput
              icon={Moon}
              label="Target Sleep"
              value={sleep}
              min={2} max={12} step={0.5} unit="hrs"
              trackColor="#6366f1"
              onChange={setSleep}
              hint={sleep >= 7.5 ? '✅ Optimal range (7.5–9h)' : `⚠️ ${(7.5 - sleep).toFixed(1)}h below the 7.5h threshold`}
              hintPositive={sleep >= 7.5}
            />

            <SliderInput
              icon={Eye}
              label="Late Night Screen Time"
              value={screen}
              min={0} max={300} step={5} unit="min"
              trackColor="#f43f5e"
              onChange={setScreen}
              hint={screen <= 60 ? '✅ Safe — melatonin onset preserved' : screen > 120 ? '🚨 Critical — hard penalty applied' : '⚠️ Exceeds 60 min recommendation'}
              hintPositive={screen <= 60}
            />

            <SliderInput
              icon={Phone}
              label="Phone Pickups"
              value={pickups}
              min={0} max={150} step={5} unit="×"
              trackColor="#f59e0b"
              onChange={setPickups}
              hint={pickups <= 40 ? '✅ Low interruption — attention stable' : '⚠️ High — dopamine cycle fragmenting focus'}
              hintPositive={pickups <= 40}
            />
          </div>

          {/* Mood Selector Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Smile className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 text-sm font-medium">Expected Mood Tomorrow</span>
            </div>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  onClick={() => setMood(value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200 ${
                    mood === value
                      ? 'bg-purple-500/15 border-purple-500/30 scale-105 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-700/30 border-slate-600/50 hover:border-slate-500 hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-slate-500 text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Tips Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2.5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span>⚡</span> Live Optimisation Tips
            </p>
            <Tip
              active={sleep >= 7.5}
              good={`${sleep}h sleep — hippocampal restoration and REM consolidation fully maximised.`}
              bad={`Add ${(7.5 - sleep).toFixed(1)}h more sleep to reach the 7.5h performance threshold.`}
            />
            <Tip
              active={screen <= 60}
              good="Under 60 min screen — natural melatonin onset fully preserved."
              bad={
                screen > 120
                  ? `🚨 ${screen} min causes a critical hard penalty (-0.5). Reduce below 120 min immediately.`
                  : `Reduce screen by ${screen - 60} min to cross the safe 60-min threshold.`
              }
            />
            <Tip
              active={pickups <= 40}
              good="Low pickups — dopamine reward cycle remains stable and undisrupted."
              bad="High pickups fragment attention. Try app timers, greyscale mode, or Do Not Disturb."
            />
            <Tip
              active={mood >= 4}
              good="Positive expected mood adds a small but meaningful (+0.25/pt) focus bonus."
              bad="Low mood slightly reduces projected score. Prioritise a short wind-down routine tonight."
            />
          </div>
        </div>

        {/* ── RIGHT: Score Display ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Big Score Card */}
          <div className={`relative bg-slate-800 border-2 ${theme.ringClass} rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl transition-all duration-300 overflow-hidden`}>
            {/* Background glow */}
            <div className={`absolute inset-0 rounded-2xl pointer-events-none blur-2xl opacity-20 ${theme.glowClass}`} />

            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-4 relative">
              Projected Focus Score — Tomorrow
            </p>

            {/* Score Number */}
            <div className="relative flex items-start justify-center">
              <span className={`text-[108px] font-black leading-none tabular-nums transition-all duration-300 ${theme.scoreColor}`}>
                {score}
              </span>

              {/* Delta badge */}
              {delta !== 0 && (
                <span className={`absolute -top-1 -right-12 text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-0.5 ${
                  delta > 0
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                }`}>
                  {delta > 0
                    ? <TrendingUp className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />}
                  {delta > 0 ? '+' : ''}{delta}
                </span>
              )}
              {delta === 0 && prev !== null && (
                <span className="absolute -top-1 -right-10 text-xs font-bold px-2 py-0.5 rounded-full border bg-slate-700 text-slate-400 border-slate-600 flex items-center gap-0.5">
                  <Minus className="w-3 h-3" /> 0
                </span>
              )}
            </div>

            <p className="text-slate-500 text-lg font-medium mt-0.5 relative">/ 10</p>

            {/* Label Badge */}
            <span className={`mt-4 text-sm font-semibold px-4 py-1.5 rounded-full border transition-all duration-300 relative ${theme.badgeClass}`}>
              {theme.label}
            </span>

            {/* Advice */}
            <p className="text-slate-400 text-xs mt-4 leading-relaxed max-w-xs relative">
              {theme.advice}
            </p>

            {/* Progress Bar */}
            <div className="w-full mt-6 relative">
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-600 text-xs">1</span>
                <span className="text-slate-500 text-xs">Score Range</span>
                <span className="text-slate-600 text-xs">10</span>
              </div>
              <div className="w-full h-3.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${theme.barClass}`}
                  style={{ width: barWidthPct }}
                />
              </div>
            </div>

            {/* Score Band Pills */}
            <div className="flex gap-2 flex-wrap justify-center mt-5 relative">
              {SCORE_BANDS.map(({ range, desc, active }) => (
                <span
                  key={range}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${
                    active(score)
                      ? theme.pillActive
                      : 'text-slate-600 border-slate-700 opacity-40'
                  }`}
                >
                  {range} <span className="opacity-70">{desc}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-5">
              📐 Score Breakdown
            </p>
            <div className="space-y-3.5">
              <BreakdownRow
                label="Base Score"
                formula="constant"
                impact="+7.00"
                color="text-slate-300"
                barPct={70}
                barColor="bg-slate-500"
              />
              <BreakdownRow
                label={`Sleep (${sleep}h)`}
                formula={sleep >= 6 ? `(${sleep} − 7) × 0.9` : `(${sleep} − 7) × 1.8 ⚠️`}
                impact={`${sleepImpact >= 0 ? '+' : ''}${sleepImpact.toFixed(2)}`}
                color={sleepImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                barPct={Math.abs(sleepImpact) * 30}
                barColor={sleepImpact >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}
              />
              <BreakdownRow
                label={`Screen (${screen} min)${screen > 120 ? ' 🚨' : ''}`}
                formula={`(${screen} ÷ 60) × 0.65${screen > 120 ? ' + 0.5' : ''}`}
                impact={`−${screenImpact.toFixed(2)}`}
                color="text-rose-400"
                barPct={Math.min(screenImpact * 25, 100)}
                barColor="bg-rose-500"
              />
              <BreakdownRow
                label={`Pickups (${pickups}×)`}
                formula={`ln(1 + ${pickups}) × 0.25`}
                impact={`−${pickupImpact.toFixed(2)}`}
                color="text-amber-400"
                barPct={Math.min(pickupImpact * 35, 100)}
                barColor="bg-amber-500"
              />
              <BreakdownRow
                label={`Mood (${MOOD_OPTIONS.find(m => m.value === mood)?.emoji})`}
                formula={`(${mood} − 3) × 0.25`}
                impact={`${moodImpact >= 0 ? '+' : ''}${moodImpact.toFixed(2)}`}
                color={moodImpact >= 0 ? 'text-purple-400' : 'text-rose-400'}
                barPct={Math.abs(moodImpact) * 60}
                barColor={moodImpact >= 0 ? 'bg-purple-500' : 'bg-rose-500'}
              />

              <div className="border-t border-slate-700 pt-3.5 flex justify-between items-center">
                <span className="text-slate-200 font-bold">Final Score</span>
                <span className={`text-2xl font-black tabular-nums ${theme.scoreColor}`}>
                  {score} <span className="text-slate-500 text-sm font-normal">/ 10</span>
                </span>
              </div>
            </div>
          </div>

          {/* Ideal Target Reference */}
          <div className="bg-slate-800 border border-emerald-500/15 rounded-2xl p-5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">
              🎯 Ideal Target Behaviours
            </p>
            <div className="grid grid-cols-4 gap-3 text-center">
              <IdealTarget emoji="😴" metric="Sleep" value="≥ 7.5h"  color="text-indigo-400" bg="bg-indigo-500/10" current={sleep >= 7.5} />
              <IdealTarget emoji="📵" metric="Screen" value="≤ 60m"  color="text-rose-400"   bg="bg-rose-500/10"   current={screen <= 60} />
              <IdealTarget emoji="📱" metric="Pickups" value="≤ 40×" color="text-amber-400"  bg="bg-amber-500/10"  current={pickups <= 40} />
              <IdealTarget emoji="😄" metric="Mood" value="≥ Good"   color="text-purple-400" bg="bg-purple-500/10" current={mood >= 4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function SliderInput({ icon: Icon, label, value, min, max, step, unit, trackColor, onChange, hint, hintPositive }) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300 text-sm font-medium">{label}</span>
        </div>
        <span className="text-white font-bold text-sm tabular-nums bg-slate-700 border border-slate-600 px-3 py-1 rounded-lg">
          {value}{unit}
        </span>
      </div>

      {/* Track + Thumb */}
      <div className="relative flex items-center h-6">
        {/* Background track */}
        <div className="absolute w-full h-2 bg-slate-700 rounded-full overflow-hidden pointer-events-none">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{ width: `${pct}%`, backgroundColor: trackColor, opacity: 0.75 }}
          />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative w-full h-2 bg-transparent appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100
            [&::-webkit-slider-thumb]:hover:scale-125
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-slate-700 text-xs">{min}{unit}</span>
        <span className={`text-xs transition-colors ${hintPositive ? 'text-emerald-500' : 'text-rose-400/80'}`}>
          {hint}
        </span>
        <span className="text-slate-700 text-xs">{max}{unit}</span>
      </div>
    </div>
  );
}

function Tip({ active, good, bad }) {
  return (
    <div className={`flex items-start gap-2.5 text-xs p-3 rounded-xl border transition-colors ${
      active
        ? 'bg-emerald-500/8 border-emerald-500/20'
        : 'bg-rose-500/8 border-rose-500/20'
    }`}>
      {active
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        : <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
      <span className={`leading-relaxed ${active ? 'text-emerald-300' : 'text-rose-300'}`}>
        {active ? good : bad}
      </span>
    </div>
  );
}

function BreakdownRow({ label, formula, impact, color, barPct, barColor }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-slate-300 text-sm">{label}</span>
          <span className="ml-2 text-slate-600 text-xs font-mono">{formula}</span>
        </div>
        <span className={`font-bold tabular-nums text-sm shrink-0 ${color}`}>{impact}</span>
      </div>
      <div className="w-full h-1 bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor} opacity-60`}
          style={{ width: `${Math.min(barPct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function IdealTarget({ emoji, metric, value, color, bg, current }) {
  return (
    <div className={`rounded-xl p-3 border transition-all duration-200 ${
      current
        ? `${bg} border-current ${color} shadow-sm`
        : 'bg-slate-700/30 border-slate-700'
    }`}>
      <div className="text-xl mb-1">{emoji}</div>
      <p className={`text-xs mb-0.5 ${current ? 'text-slate-400' : 'text-slate-600'}`}>{metric}</p>
      <p className={`font-bold text-xs ${current ? color : 'text-slate-500'}`}>{value}</p>
      {current && <span className="text-emerald-400 text-xs">✓</span>}
    </div>
  );
}

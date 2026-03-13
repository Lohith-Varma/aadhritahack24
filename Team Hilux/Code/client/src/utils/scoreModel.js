
const sigmoid = (x) => 1 / (1 + Math.exp(-x));

export function calcFocusScore({ sleepHours, lateNightScreenTimeMins, phonePickups, mood = 3 }) {
 
  const sleepBase = sleepHours >= 6
    ? (sleepHours - 7) * 0.9
    : (sleepHours - 7) * 1.8; 

  const screenPenalty = (lateNightScreenTimeMins / 60) * 0.65
    + (lateNightScreenTimeMins > 120 ? 0.5 : 0);

  const pickupPenalty = Math.log1p(phonePickups) * 0.25;

  const moodBonus = (mood - 3) * 0.25;

  const dayOfWeek    = new Date().getDay();
  const weekendBonus = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.3 : 0;

  const raw = 7 + sleepBase - screenPenalty - pickupPenalty + moodBonus + weekendBonus;

  return parseFloat(Math.max(1, Math.min(10, raw)).toFixed(1));
}

export function getScoreInterpretation(score) {
  if (score >= 9)   return { label: 'Peak State 🚀',       color: 'emerald', advice: 'Exceptional conditions. Perfect day for deep work or exams.' };
  if (score >= 7.5) return { label: 'Excellent Focus 🌟',  color: 'emerald', advice: 'Strong cognitive conditions. Prioritize your hardest tasks.' };
  if (score >= 6)   return { label: 'Moderate Focus 😐',   color: 'amber',   advice: 'Functional but not optimal. Take breaks every 45 minutes.' };
  if (score >= 4)   return { label: 'Below Average 😓',    color: 'amber',   advice: 'Performance impaired. Avoid high-stakes decisions today.' };
  return               { label: 'Critical Impairment 😵', color: 'rose',    advice: 'Severe cognitive deficit. Rest and recovery should be top priority.' };
}

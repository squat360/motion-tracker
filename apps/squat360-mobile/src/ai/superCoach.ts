/**
 * Squat 360 Super Coach — on-device phase / load / calorie engine.
 * Port of comfy_extras/nodes_squat360.py (_decide_coach). Cloud copy never
 * changes phase, loadBiasKg, or calorieBias.
 */

export type TrainingGoal = 'strength' | 'hypertrophy' | 'conditioning';
export type CoachPhase = 'accumulate' | 'intensify' | 'rebuild' | 'deload';
export type Recovery = 'fresh' | 'normal' | 'fatigued';
export type FormTrend = 'improving' | 'flat' | 'declining';

export type CoachSession = {
  reps: number;
  loadKg: number | null;
  formScore: number | null;
  cueCodes: string[];
};

export type CoachFinding = {
  code: string;
  severity: string;
};

export type CoachDecision = {
  phase: CoachPhase;
  recovery: Recovery;
  trend: FormTrend;
  priorityCue: string;
  loadBiasKg: number;
  calorieBias: number;
  briefing: string;
  reasoning: string[];
  answer: string;
};

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function mapCue(code: string): string {
  if (code === 'DEPTH_INSUFFICIENT' || code === 'DEPTH_CHECK') return 'DEPTH_CHECK';
  if (code === 'KNEE_VALGUS' || code === 'KNEE_TRACK') return 'KNEE_TRACK';
  if (code === 'TORSO_LEAN') return 'TORSO_LEAN';
  return code;
}

export function parseSessions(historyJson: string | unknown): CoachSession[] {
  let data: unknown = historyJson;
  if (typeof historyJson === 'string') {
    if (!historyJson.trim()) return [];
    try {
      data = JSON.parse(historyJson);
    } catch {
      return [];
    }
  }
  let sessions: unknown[] = [];
  if (Array.isArray(data)) sessions = data;
  else if (data && typeof data === 'object' && Array.isArray((data as { sessions?: unknown[] }).sessions)) {
    sessions = (data as { sessions: unknown[] }).sessions;
  } else {
    return [];
  }
  const out: CoachSession[] = [];
  for (const item of sessions) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    let cues = row.cueCodes ?? row.cues ?? [];
    if (typeof cues === 'string') cues = [cues];
    if (!Array.isArray(cues)) cues = [];
    const score = row.formScore;
    let load = row.loadKg;
    if (load == null) load = row.load_kg;
    out.push({
      reps: Number(row.reps || 0),
      loadKg: load == null || load === '' ? null : Number(load),
      formScore: score == null || score === '' ? null : Number(score),
      cueCodes: (cues as unknown[]).map((c) => mapCue(String(c))).slice(0, 8),
    });
  }
  return out.slice(-12);
}

export function parseFindings(findingsJson: string | CoachFinding[] | unknown): CoachFinding[] {
  let data: unknown = findingsJson;
  if (typeof findingsJson === 'string') {
    if (!findingsJson.trim()) return [];
    try {
      data = JSON.parse(findingsJson);
    } catch {
      return [];
    }
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    data = (data as { findings?: unknown }).findings ?? [];
  }
  if (!Array.isArray(data)) return [];
  const out: CoachFinding[] = [];
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    out.push({
      code: mapCue(String(row.code || '')),
      severity: String(row.severity || 'info'),
    });
  }
  return out;
}

export function decideCoach(
  goal: TrainingGoal,
  daysPerWeek: number,
  findings: CoachFinding[],
  history: CoachSession[],
  question = '',
): CoachDecision {
  const hist = history.slice(-12);
  const scores = hist.map((h) => h.formScore).filter((s): s is number => s != null);
  const recent = scores.slice(-3);
  const prior = scores.slice(-6, -3);
  const recentMean = mean(recent);
  const priorMean = mean(prior);

  let trend: FormTrend = 'flat';
  if (recentMean != null && priorMean != null) {
    if (recentMean - priorMean >= 4) trend = 'improving';
    else if (priorMean - recentMean >= 4) trend = 'declining';
  } else if (recentMean != null && recentMean < 70) {
    trend = 'declining';
  } else if (recentMean != null && recentMean >= 88) {
    trend = 'improving';
  }

  const liveCues = findings
    .filter((f) => f.severity === 'cue' || f.severity === 'flag' || f.severity === 'warning')
    .map((f) => f.code);

  const cueHits: Record<string, number> = {};
  for (const row of hist) {
    for (const code of row.cueCodes || []) {
      cueHits[code] = (cueHits[code] || 0) + 1;
    }
  }
  for (const code of liveCues) {
    cueHits[code] = (cueHits[code] || 0) + 2;
  }
  const persistent = Object.entries(cueHits)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([code]) => code);
  const priorityCue = persistent[0] ?? liveCues[0] ?? '';

  const lastTwo = hist.slice(-2);
  const vols = lastTwo.map((row) => row.reps * (row.loadKg || 0));
  const volDrop = vols.length === 2 && vols[0] > 0 && vols[1] < vols[0] * 0.8;
  const scoreDrop =
    lastTwo.length === 2 &&
    lastTwo[0].formScore != null &&
    lastTwo[1].formScore != null &&
    lastTwo[1].formScore < lastTwo[0].formScore - 8;
  const highFrequency = hist.length >= Math.max(5, Math.trunc(daysPerWeek) + 2);

  let recovery: Recovery = 'normal';
  if (volDrop && scoreDrop) recovery = 'fatigued';
  else if (highFrequency && trend === 'declining') recovery = 'fatigued';
  else if (trend === 'improving' && (recentMean || 0) >= 88) recovery = 'fresh';

  let phase: CoachPhase = 'accumulate';
  if (recovery === 'fatigued' || (trend === 'declining' && hist.length >= 4)) {
    phase = 'deload';
  } else if (priorityCue === 'DEPTH_CHECK' || priorityCue === 'KNEE_TRACK' || priorityCue === 'TORSO_LEAN') {
    phase = 'rebuild';
  } else if (recovery === 'fresh' && trend === 'improving' && goal === 'strength') {
    phase = 'intensify';
  } else if (recovery === 'fresh' && goal === 'hypertrophy') {
    phase = 'accumulate';
  }

  let loadBiasKg = 0;
  let calorieBias = 0;
  if (phase === 'intensify') {
    loadBiasKg = 5.0;
    calorieBias = 80;
  } else if (phase === 'deload') {
    loadBiasKg = -10.0;
    calorieBias = -120;
  } else if (phase === 'rebuild') {
    loadBiasKg = -5.0;
    calorieBias = 0;
  } else if (trend === 'improving') {
    loadBiasKg = 2.5;
    calorieBias = 40;
  }

  const reasoning: string[] = [];
  if (scores.length) {
    const extra = recentMean != null ? ` (recent ${recentMean.toFixed(0)})` : '';
    reasoning.push(`Form trend ${trend} across ${scores.length} scored sessions${extra}.`);
  } else {
    reasoning.push('No scored history yet — opening week uses live camera cues only.');
  }
  reasoning.push(`Recovery looks ${recovery}${volDrop ? ' (volume dropped last session)' : ''}.`);
  if (priorityCue) {
    reasoning.push(`Persistent cue: ${priorityCue.replace(/_/g, ' ').toLowerCase()}.`);
  }
  reasoning.push(`Selected ${phase} for ${goal} at ${daysPerWeek} days/week.`);

  let closer = 'Build clean volume. Keep depth honest on camera.';
  if (phase === 'deload') closer = 'Cut load and protect sleep this week.';
  else if (phase === 'rebuild') closer = 'Technique before kilos until the cue clears.';
  else if (phase === 'intensify') closer = 'Add a little load. Film one work set.';

  const briefing = `${goal} plan: ${phase} block, recovery ${recovery}, form ${trend}. ${closer}`;
  const decision: CoachDecision = {
    phase,
    recovery,
    trend,
    priorityCue,
    loadBiasKg,
    calorieBias,
    briefing,
    reasoning,
    answer: '',
  };
  decision.answer = question.trim() ? answerCoachQuestion(question, decision, goal) : '';
  return decision;
}

export function answerCoachQuestion(
  question: string,
  decision: CoachDecision,
  goal: TrainingGoal,
): string {
  const q = question.trim().toLowerCase();
  if (!q) return decision.briefing;
  if (['depth', 'hole', 'parallel', 'box'].some((w) => q.includes(w))) {
    if (decision.priorityCue === 'DEPTH_CHECK') {
      return 'Depth is the limiter. Keep the box or tape until hip crease is repeatable, then add load.';
    }
    return 'Depth is not the main flag. Film a side set and keep the same stance markers.';
  }
  if (['knee', 'valgus', 'cave'].some((w) => q.includes(w))) {
    if (decision.priorityCue === 'KNEE_TRACK') {
      return 'Knees need a front-camera week: banded walks, slow step-downs, then squat.';
    }
    return 'Knee tracking looks secondary. Still cue knees over second toe on the ascent.';
  }
  if (['eat', 'food', 'calorie', 'protein', 'diet'].some((w) => q.includes(w))) {
    const bias = decision.calorieBias;
    const sign = bias >= 0 ? '+' : '';
    return `Eat for ${goal}. This block biases ${sign}${bias} kcal around the current target.`;
  }
  if (['deload', 'tired', 'fatigue', 'sore', 'sleep'].some((w) => q.includes(w))) {
    if (decision.phase === 'deload' || decision.recovery === 'fatigued') {
      return 'Yes — treat this as a deload. Drop load, keep some movement, sleep more.';
    }
    return `Recovery is ${decision.recovery}. Train as written unless sleep tanks two nights in a row.`;
  }
  if (['weight', 'kilo', 'load', 'pr', 'progress'].some((w) => q.includes(w))) {
    const load = decision.loadBiasKg;
    if (load > 0) return `Add about ${load} kg only if the last filmed work set was clean.`;
    if (load < 0) return `Take ${Math.abs(load)} kg off until form trend stops declining.`;
    return 'Hold load. Collect one more clean session before changing the bar.';
  }
  return `${decision.briefing} Ask about depth, knees, food, fatigue, or load for a tighter call.`;
}

export function workoutWithCoach(summary: string, decision: CoachDecision): string {
  const phase = decision.phase;
  const load = decision.loadBiasKg;
  let suffix = '';
  if (phase === 'deload') suffix = ` Deload: leave ${Math.abs(load)} kg on the bar and stop at RPE 6.`;
  else if (phase === 'rebuild') suffix = ' Rebuild: pause reps and a target. Load is a tool, not the point.';
  else if (phase === 'intensify') suffix = ` Intensify: add ~${load} kg if last work set was clean.`;
  else if (load > 0) suffix = ` Progression: +${load} kg if depth held.`;
  return `=== Super Coach: ${phase.toUpperCase()} ===\n${decision.briefing}\n\n${summary}${suffix}`;
}

export function foodWithCoach(summary: string, oldCalories: number, decision: CoachDecision): string {
  const newCalories = Math.max(1400, Math.trunc(oldCalories + decision.calorieBias));
  let text = summary.replace(`${oldCalories} kcal`, `${newCalories} kcal`);
  if (decision.phase === 'deload') text += '\n  Super Coach: earlier dinner, 8h sleep target.';
  else if (decision.phase === 'intensify') text += '\n  Super Coach: extra carb serving on squat day.';
  return text;
}

export const CLOUD_LLM_SYSTEM =
  'You are Squat 360 Super Coach. You augment a human coach. Not medical advice. ' +
  'Stay inside the provided JSON. Do not change phase, loadBiasKg, or calorieBias. ' +
  'Reply with JSON only: {"briefing":"...","answer":"..."}';

export function buildCloudLlmPayload(
  goal: TrainingGoal,
  decision: CoachDecision,
  question: string,
  history: CoachSession[],
): { system: string; user: string } {
  return {
    system: CLOUD_LLM_SYSTEM,
    user: JSON.stringify(
      {
        goal,
        question: question.trim(),
        decision: {
          phase: decision.phase,
          recovery: decision.recovery,
          trend: decision.trend,
          priorityCue: decision.priorityCue,
          loadBiasKg: decision.loadBiasKg,
          calorieBias: decision.calorieBias,
          briefing: decision.briefing,
          reasoning: decision.reasoning.join(' '),
        },
        history,
      },
      null,
      2,
    ),
  };
}

/**
 * Squat 360 AI Assistant — custom workouts, food plans, form advice, motivational avatars.
 * Text plans run on-device (rules + FitWave cues). Avatar art uses ComfyUI when online.
 */
import type { TechniqueFinding } from '../types';
import { summarizeFitWaveSession, type FitWaveExercise } from '../fitwaveFormChecks';
import type { PoseFrame } from '../types';
import { buildMotivationalAvatarWorkflow, pingComfyUi, queueComfyPrompt } from './client';

export type WorkoutBlock = {
  id: string;
  day: string;
  title: string;
  detail: string;
};

export type FoodPlanItem = {
  id: string;
  meal: string;
  title: string;
  detail: string;
};

export type AssistantBundle = {
  workouts: WorkoutBlock[];
  food: FoodPlanItem[];
  formAdvice: TechniqueFinding[];
  avatarPrompt: string;
  comfyQueued: boolean;
  comfyDetail: string;
};

const GOALS = ['strength', 'hypertrophy', 'conditioning'] as const;
export type TrainingGoal = (typeof GOALS)[number];

export function buildCustomWorkout(goal: TrainingGoal, findings: TechniqueFinding[]): WorkoutBlock[] {
  const depthCue = findings.some((f) => f.code === 'DEPTH_CHECK' && f.severity === 'cue');
  const kneeCue = findings.some((f) => f.code === 'KNEE_TRACK' && f.severity === 'cue');
  const base: WorkoutBlock[] = [
    {
      id: 'w1',
      day: 'Day A',
      title: goal === 'conditioning' ? 'Goblet squat + bike' : 'Back squat focus',
      detail:
        goal === 'strength'
          ? '3–5 sets × 3–5 @ RPE 7–8. Long rests. Coach spots depth.'
          : goal === 'hypertrophy'
            ? '4×8–12 controlled tempo. 2s eccentric.'
            : 'EMOM 12: 8 goblet squats + 30s easy bike.',
    },
    {
      id: 'w2',
      day: 'Day B',
      title: 'Posterior chain',
      detail: 'Romanian deadlift 3×6–8 + hip hinge drills. Brace before every pull.',
    },
    {
      id: 'w3',
      day: 'Day C',
      title: 'Unilateral + core',
      detail: 'Split squat 3×8/side + dead bug 3×8. Keep ribs stacked.',
    },
  ];
  if (depthCue) {
    base[0].detail += ' Add box-squat target this week until depth is consistent on camera.';
  }
  if (kneeCue) {
    base.push({
      id: 'w4',
      day: 'Accessory',
      title: 'Knee tracking drill',
      detail: 'Banded lateral walks + slow step-downs 2×10. Front-camera check next session.',
    });
  }
  return base;
}

export function buildCustomFoodPlan(goal: TrainingGoal): FoodPlanItem[] {
  const protein = goal === 'hypertrophy' ? '2.0 g/kg' : '1.6–1.8 g/kg';
  return [
    {
      id: 'f1',
      meal: 'Breakfast',
      title: 'High-protein start',
      detail: `Eggs or Greek yogurt + fruit. Target ~${protein} protein across the day.`,
    },
    {
      id: 'f2',
      meal: 'Pre-lift',
      title: 'Carb top-up',
      detail: 'Banana + rice cakes or oats 60–90 min before squat day.',
    },
    {
      id: 'f3',
      meal: 'Post-lift',
      title: 'Recovery plate',
      detail: 'Chicken/fish/tofu + rice + veg. Fluids to thirst; salt if sweat was heavy.',
    },
    {
      id: 'f4',
      meal: 'Evening',
      title: 'Light finish',
      detail: goal === 'conditioning' ? 'Keep dinner moderate; prioritize sleep.' : 'Cottage cheese or casein-style snack if hungry.',
    },
  ];
}

export function buildFormAdvice(
  frames: PoseFrame[],
  exercise: FitWaveExercise = 'squat'
): TechniqueFinding[] {
  const fitwave = summarizeFitWaveSession(exercise === 'squat' ? 'plank' : exercise, frames);
  return [
    {
      code: 'AI_FORM_INTRO',
      severity: 'info',
      message: 'AI form advice blends FitWave angle heuristics with coach review — not a medical score.',
      coachHint: 'Approve cues before athletes treat them as prescriptions.',
    },
    ...fitwave,
  ];
}

export function motivationalAvatarPrompt(name: string, goal: TrainingGoal): string {
  return `motivational gym portrait avatar of athlete named ${name}, ${goal} training vibe, clean modern fitness illustration, confident posture, high quality, no text`;
}

export async function runAssistant(options: {
  athleteName: string;
  goal: TrainingGoal;
  findings: TechniqueFinding[];
  frames: PoseFrame[];
  queueAvatar: boolean;
}): Promise<AssistantBundle> {
  const workouts = buildCustomWorkout(options.goal, options.findings);
  const food = buildCustomFoodPlan(options.goal);
  const formAdvice = buildFormAdvice(options.frames);
  const avatarPrompt = motivationalAvatarPrompt(options.athleteName, options.goal);
  const status = await pingComfyUi();
  let comfyQueued = false;
  if (options.queueAvatar && status.ok) {
    try {
      const id = await queueComfyPrompt(buildMotivationalAvatarWorkflow(avatarPrompt));
      comfyQueued = Boolean(id);
    } catch {
      comfyQueued = false;
    }
  }
  return {
    workouts,
    food,
    formAdvice,
    avatarPrompt,
    comfyQueued,
    comfyDetail: status.detail,
  };
}

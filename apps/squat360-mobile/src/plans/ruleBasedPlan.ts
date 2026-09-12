import type { TechniqueFinding } from '../ai/types';

export type PlanItem = {
  id: string;
  title: string;
  detail: string;
  focus: 'mobility' | 'strength' | 'technique' | 'recovery';
};

/**
 * Rule-based plan stub — maps technique cues to simple coach follow-ups.
 * Not personalized programming; coaches remain in charge.
 */
export function buildRuleBasedPlan(findings: TechniqueFinding[]): PlanItem[] {
  const items: PlanItem[] = [
    {
      id: 'warmup-hips',
      title: 'Hip opener warm-up',
      detail: '2–3 minutes openers before working sets (coach-led).',
      focus: 'mobility',
    },
  ];

  for (const f of findings) {
    if (f.code === 'DEPTH_CHECK') {
      items.push({
        id: 'depth-box',
        title: 'Box squat depth check',
        detail: 'Use a box/target so depth is consistent; coach sets height.',
        focus: 'technique',
      });
    }
    if (f.code === 'KNEE_TRACK') {
      items.push({
        id: 'band-knees',
        title: 'Light band knee tracking drill',
        detail: 'Optional cue drill — only if the coach wants it this session.',
        focus: 'technique',
      });
    }
    if (f.code === 'TORSO_LEAN') {
      items.push({
        id: 'brace-pause',
        title: 'Brace + pause squat',
        detail: 'Coach-led pauses to talk through torso position — not an automatic programming change.',
        focus: 'technique',
      });
    }
  }

  items.push({
    id: 'deload-note',
    title: 'Recovery note',
    detail: 'If fatigue flags appear, reduce load next session — coach decision.',
    focus: 'recovery',
  });

  return items;
}

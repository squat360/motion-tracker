/**
 * FitWave-inspired live form heuristics (from VedankPande/FitWave PoseReact monitoring
 * + experimentation/pose_rules), adapted to MediaPipe 33-landmark PoseFrame.
 * Coach cues only — not pass/fail scores.
 */
import { getLandmark, isLandmarkVisible } from './landmarks';
import type { PoseFrame, TechniqueFinding } from './types';

export type FitWaveExercise = 'biceps' | 'plank' | 'press' | 'squat';

type Pt = { x: number; y: number };

function angleDeg(a: Pt, b: Pt, c: Pt): number {
  const ab = Math.hypot(b.x - a.x, b.y - a.y);
  const bc = Math.hypot(b.x - c.x, b.y - c.y);
  const ac = Math.hypot(c.x - a.x, c.y - a.y);
  if (ab === 0 || bc === 0) return 0;
  const cos = (ab * ab + bc * bc - ac * ac) / (2 * ab * bc);
  const clamped = Math.min(1, Math.max(-1, cos));
  return (Math.acos(clamped) * 180) / Math.PI;
}

function mid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function xy(frame: PoseFrame, name: Parameters<typeof getLandmark>[1]): Pt | null {
  const lm = getLandmark(frame.landmarks, name);
  if (!lm || !isLandmarkVisible(lm)) return null;
  return { x: lm.x, y: lm.y };
}

function checkBiceps(frame: PoseFrame): TechniqueFinding | null {
  const hip = xy(frame, 'left_hip');
  const shoulder = xy(frame, 'left_shoulder');
  const elbow = xy(frame, 'left_elbow');
  const knee = xy(frame, 'left_knee');
  if (!hip || !shoulder || !elbow || !knee) return null;
  const elbowAngle = angleDeg(hip, shoulder, elbow);
  const backAngle = angleDeg(knee, hip, shoulder);
  if (elbowAngle > 15 || backAngle < 170) {
    return {
      code: 'FITWAVE_BICEPS',
      severity: 'cue',
      message: `Biceps cue — elbow≈${elbowAngle.toFixed(0)}° back≈${backAngle.toFixed(0)}° (FitWave heuristic).`,
      coachHint: 'Keep elbows tucked and torso tall; avoid swinging the back.',
    };
  }
  return {
    code: 'FITWAVE_BICEPS',
    severity: 'info',
    message: 'Biceps path looks controlled this frame (FitWave heuristic).',
    coachHint: 'Confirm tempo and full ROM with the athlete.',
  };
}

function checkPlank(frame: PoseFrame): TechniqueFinding | null {
  const ls = xy(frame, 'left_shoulder');
  const rs = xy(frame, 'right_shoulder');
  const lh = xy(frame, 'left_hip');
  const rh = xy(frame, 'right_hip');
  const lk = xy(frame, 'left_knee');
  const rk = xy(frame, 'right_knee');
  const le = xy(frame, 'left_eye');
  const re = xy(frame, 'right_eye');
  if (!ls || !rs || !lh || !rh || !lk || !rk) return null;
  const forehead = le && re ? mid(le, re) : mid(ls, rs);
  const upper = mid(ls, rs);
  const waist = mid(lh, rh);
  const knees = mid(lk, rk);
  const upperAngle = angleDeg(forehead, upper, waist);
  const lowerAngle = angleDeg(upper, waist, knees);
  if (upperAngle < 150 || lowerAngle < 150) {
    return {
      code: 'FITWAVE_PLANK',
      severity: 'cue',
      message: `Plank line soft — upper≈${upperAngle.toFixed(0)}° lower≈${lowerAngle.toFixed(0)}°.`,
      coachHint: 'Cue ribs down and glutes on; avoid hips sagging or piking.',
    };
  }
  return {
    code: 'FITWAVE_PLANK',
    severity: 'info',
    message: 'Plank line looks stacked this frame (FitWave heuristic).',
    coachHint: 'Watch breath and time-under-tension next.',
  };
}

function checkPress(frame: PoseFrame): TechniqueFinding | null {
  const le = xy(frame, 'left_elbow');
  const re = xy(frame, 'right_elbow');
  const ls = xy(frame, 'left_shoulder');
  const rs = xy(frame, 'right_shoulder');
  const lh = xy(frame, 'left_hip');
  const rh = xy(frame, 'right_hip');
  if (!le || !re || !ls || !rs || !lh || !rh) return null;
  const leftArm = angleDeg(lh, ls, le);
  const rightArm = angleDeg(rh, rs, re);
  const leftBad = leftArm > 170 || leftArm < 150;
  const rightBad = rightArm > 170 || rightArm < 150;
  if (leftBad && rightBad) {
    return {
      code: 'FITWAVE_PRESS',
      severity: 'cue',
      message: `Press path wide — L≈${leftArm.toFixed(0)}° R≈${rightArm.toFixed(0)}°.`,
      coachHint: 'Stack wrists over elbows; avoid flaring at the bottom.',
    };
  }
  return {
    code: 'FITWAVE_PRESS',
    severity: 'info',
    message: 'Press arm path looks stacked this frame (FitWave heuristic).',
    coachHint: 'Check lockout and rib flare on the next reps.',
  };
}

/** Evaluate one frame with FitWave-style rules for the selected exercise. */
export function evaluateFitWaveForm(
  exercise: FitWaveExercise,
  frame: PoseFrame
): TechniqueFinding | null {
  switch (exercise) {
    case 'biceps':
      return checkBiceps(frame);
    case 'plank':
      return checkPlank(frame);
    case 'press':
      return checkPress(frame);
    case 'squat':
      return null; // squat depth/track stays in LandmarkTechniqueAnalyzer
    default:
      return null;
  }
}

/** Summarize FitWave cues over a recorded landmark sequence (sample every Nth frame). */
export function summarizeFitWaveSession(
  exercise: FitWaveExercise,
  frames: PoseFrame[],
  sampleEvery = 5
): TechniqueFinding[] {
  if (exercise === 'squat') return [];
  const cues: TechniqueFinding[] = [];
  let cueHits = 0;
  let samples = 0;
  for (let i = 0; i < frames.length; i += sampleEvery) {
    const finding = evaluateFitWaveForm(exercise, frames[i]);
    if (!finding) continue;
    samples += 1;
    if (finding.severity === 'cue') cueHits += 1;
  }
  if (samples === 0) return [];
  const ratio = cueHits / samples;
  if (ratio >= 0.35) {
    cues.push({
      code: `FITWAVE_${exercise.toUpperCase()}_SESSION`,
      severity: 'cue',
      message: `FitWave ${exercise} cues fired on ~${Math.round(ratio * 100)}% of sampled frames.`,
      coachHint: 'Use as a discussion prompt — camera angle and clothing change the heuristic.',
    });
  } else {
    cues.push({
      code: `FITWAVE_${exercise.toUpperCase()}_SESSION`,
      severity: 'info',
      message: `FitWave ${exercise} path mostly clean across the set (~${Math.round((1 - ratio) * 100)}% ok).`,
      coachHint: 'Still verify with eyes-on coaching for this athlete.',
    });
  }
  return cues;
}

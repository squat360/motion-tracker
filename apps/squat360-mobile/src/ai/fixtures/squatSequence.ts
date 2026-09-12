import { POSE_LANDMARK_NAMES } from '../landmarks';
import type { Landmark, PoseFrame } from '../types';

/**
 * Build a front-view-ish 33-point skeleton whose knee angle is exact.
 * Used for unit tests and Review overlay when no live MediaPipe frames exist.
 */
export function landmarksForKneeAngle(kneeDeg: number, extras?: { leanDeg?: number; t?: number }): Landmark[] {
  const t = extras?.t ?? 0;
  const lean = ((extras?.leanDeg ?? 0) * Math.PI) / 180;
  const rad = (kneeDeg * Math.PI) / 180;
  const delta = Math.PI - rad;
  const shin = 0.2;
  const thigh = 0.2;

  function leg(side: 'left' | 'right'): Pick<Landmark, 'name' | 'x' | 'y'>[] {
    const ox = side === 'left' ? -0.08 : 0.08;
    const ankle = { name: `${side}_ankle` as const, x: 0.5 + ox, y: 0.9 };
    const knee = { name: `${side}_knee` as const, x: 0.5 + ox, y: 0.7 };
    const hip = {
      name: `${side}_hip` as const,
      x: knee.x + thigh * Math.sin(delta) * (side === 'left' ? 1 : 1),
      y: knee.y - thigh * Math.cos(delta),
    };
    const heel = { name: `${side}_heel` as const, x: ankle.x, y: ankle.y + 0.02 };
    const foot = { name: `${side}_foot_index` as const, x: ankle.x + 0.03, y: ankle.y + 0.01 };
    return [hip, knee, ankle, heel, foot];
  }

  const left = leg('left');
  const right = leg('right');
  const lh = left[0];
  const rh = right[0];
  const midHipX = (lh.x + rh.x) / 2;
  const midHipY = (lh.y + rh.y) / 2;

  const torso = 0.22;
  const midShoulderX = midHipX + Math.sin(lean) * torso;
  const midShoulderY = midHipY - Math.cos(lean) * torso;

  const byName: Record<string, { x: number; y: number; z?: number; visibility?: number }> = {};
  for (const p of [...left, ...right]) {
    byName[p.name] = { x: p.x, y: p.y, z: 0, visibility: 0.95 };
  }

  byName.left_shoulder = { x: midShoulderX - 0.1, y: midShoulderY, z: 0, visibility: 0.95 };
  byName.right_shoulder = { x: midShoulderX + 0.1, y: midShoulderY, z: 0, visibility: 0.95 };
  byName.left_elbow = { x: midShoulderX - 0.14, y: midShoulderY + 0.1, z: 0, visibility: 0.9 };
  byName.right_elbow = { x: midShoulderX + 0.14, y: midShoulderY + 0.1, z: 0, visibility: 0.9 };
  byName.left_wrist = { x: midShoulderX - 0.12, y: midShoulderY + 0.18, z: 0, visibility: 0.85 };
  byName.right_wrist = { x: midShoulderX + 0.12, y: midShoulderY + 0.18, z: 0, visibility: 0.85 };
  byName.left_pinky = { x: byName.left_wrist.x - 0.01, y: byName.left_wrist.y + 0.01, visibility: 0.7 };
  byName.right_pinky = { x: byName.right_wrist.x + 0.01, y: byName.right_wrist.y + 0.01, visibility: 0.7 };
  byName.left_index = { x: byName.left_wrist.x, y: byName.left_wrist.y + 0.015, visibility: 0.7 };
  byName.right_index = { x: byName.right_wrist.x, y: byName.right_wrist.y + 0.015, visibility: 0.7 };
  byName.left_thumb = { x: byName.left_wrist.x + 0.01, y: byName.left_wrist.y, visibility: 0.7 };
  byName.right_thumb = { x: byName.right_wrist.x - 0.01, y: byName.right_wrist.y, visibility: 0.7 };
  byName.nose = { x: midShoulderX, y: midShoulderY - 0.08, visibility: 0.9 };
  byName.left_eye = { x: midShoulderX - 0.02, y: midShoulderY - 0.085, visibility: 0.85 };
  byName.right_eye = { x: midShoulderX + 0.02, y: midShoulderY - 0.085, visibility: 0.85 };
  byName.left_eye_inner = { x: midShoulderX - 0.015, y: midShoulderY - 0.085, visibility: 0.8 };
  byName.left_eye_outer = { x: midShoulderX - 0.03, y: midShoulderY - 0.085, visibility: 0.8 };
  byName.right_eye_inner = { x: midShoulderX + 0.015, y: midShoulderY - 0.085, visibility: 0.8 };
  byName.right_eye_outer = { x: midShoulderX + 0.03, y: midShoulderY - 0.085, visibility: 0.8 };
  byName.left_ear = { x: midShoulderX - 0.045, y: midShoulderY - 0.08, visibility: 0.8 };
  byName.right_ear = { x: midShoulderX + 0.045, y: midShoulderY - 0.08, visibility: 0.8 };
  byName.mouth_left = { x: midShoulderX - 0.015, y: midShoulderY - 0.06, visibility: 0.8 };
  byName.mouth_right = { x: midShoulderX + 0.015, y: midShoulderY - 0.06, visibility: 0.8 };

  void t;
  void shin;

  return POSE_LANDMARK_NAMES.map((name) => {
    const p = byName[name] ?? { x: 0.5, y: 0.5, visibility: 0.2 };
    return { name, x: p.x, y: p.y, z: p.z ?? 0, visibility: p.visibility ?? 0.8 };
  });
}

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

function hold(angle: number, n: number, lean = 0): number[][] {
  return Array.from({ length: n }, () => [angle, lean]);
}

function ramp(from: number, to: number, n: number, leanFrom = 0, leanTo = 0): number[][] {
  return Array.from({ length: n }, (_, i) => {
    const u = n <= 1 ? 1 : i / (n - 1);
    return [lerp(from, to, u), lerp(leanFrom, leanTo, u)];
  });
}

/** Three complete squat reps: stand → descend → bottom → ascend → stand. */
export function buildSquatFixture(reps = 3, startMs = 0, dtMs = 33): PoseFrame[] {
  const samples: number[][] = [];
  for (let r = 0; r < reps; r += 1) {
    samples.push(...hold(168, 10, 4));
    samples.push(...ramp(168, 86, 16, 4, 18));
    samples.push(...hold(84, 6, 20));
    samples.push(...ramp(86, 168, 16, 18, 4));
    samples.push(...hold(168, 8, 4));
  }

  return samples.map(([knee, lean], i) => ({
    timestampMs: startMs + i * dtMs,
    landmarks: landmarksForKneeAngle(knee, { leanDeg: lean, t: i }),
  }));
}

/** Shallow / high-squat fixture — should cue DEPTH_CHECK. */
export function buildShallowSquatFixture(reps = 2, startMs = 0, dtMs = 33): PoseFrame[] {
  const samples: number[][] = [];
  for (let r = 0; r < reps; r += 1) {
    samples.push(...hold(168, 8, 6));
    samples.push(...ramp(168, 130, 12, 6, 12));
    samples.push(...hold(128, 5, 12));
    samples.push(...ramp(130, 168, 12, 12, 6));
    samples.push(...hold(168, 6, 6));
  }
  return samples.map(([knee, lean], i) => ({
    timestampMs: startMs + i * dtMs,
    landmarks: landmarksForKneeAngle(knee, { leanDeg: lean }),
  }));
}

export const SAMPLE_SQUAT_FRAMES: PoseFrame[] = buildSquatFixture(3);

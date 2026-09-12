/** MediaPipe Pose Landmarker — 33 keypoints (same names as Python MediaPipeBackend). */

import type { Landmark } from './types';

export const POSE_LANDMARK_NAMES = [
  'nose',
  'left_eye_inner',
  'left_eye',
  'left_eye_outer',
  'right_eye_inner',
  'right_eye',
  'right_eye_outer',
  'left_ear',
  'right_ear',
  'mouth_left',
  'mouth_right',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_pinky',
  'right_pinky',
  'left_index',
  'right_index',
  'left_thumb',
  'right_thumb',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_heel',
  'right_heel',
  'left_foot_index',
  'right_foot_index',
] as const;

export type PoseLandmarkName = (typeof POSE_LANDMARK_NAMES)[number];

/** Skeleton edges for overlay (subset of MediaPipe pose connections). */
export const SKELETON_EDGES: ReadonlyArray<readonly [PoseLandmarkName, PoseLandmarkName]> = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['left_ankle', 'left_heel'],
  ['left_ankle', 'left_foot_index'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['right_ankle', 'right_heel'],
  ['right_ankle', 'right_foot_index'],
  ['left_shoulder', 'left_ear'],
  ['right_shoulder', 'right_ear'],
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_ear', 'left_eye'],
  ['right_ear', 'right_eye'],
];

export function getLandmark(landmarks: Landmark[], name: string): Landmark | undefined {
  return landmarks.find((l) => l.name === name);
}

export function isLandmarkVisible(lm: Landmark | undefined, min = 0.35): boolean {
  if (!lm) return false;
  if (lm.visibility == null) return true;
  return lm.visibility >= min;
}

/** Interior angle at point `b` (degrees), using image-space x/y. */
export function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const bax = a.x - b.x;
  const bay = a.y - b.y;
  const bcx = c.x - b.x;
  const bcy = c.y - b.y;
  const mag = Math.hypot(bax, bay) * Math.hypot(bcx, bcy);
  if (mag < 1e-8) return 180;
  const cos = Math.min(1, Math.max(-1, (bax * bcx + bay * bcy) / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function meanKneeAngle(landmarks: Landmark[]): number | null {
  const left = kneeAngle(landmarks, 'left');
  const right = kneeAngle(landmarks, 'right');
  if (left != null && right != null) return (left + right) / 2;
  return left ?? right;
}

export function kneeAngle(landmarks: Landmark[], side: 'left' | 'right'): number | null {
  const hip = getLandmark(landmarks, `${side}_hip`);
  const knee = getLandmark(landmarks, `${side}_knee`);
  const ankle = getLandmark(landmarks, `${side}_ankle`);
  if (!hip || !knee || !ankle) return null;
  if (!isLandmarkVisible(hip) || !isLandmarkVisible(knee) || !isLandmarkVisible(ankle)) return null;
  return angleDeg(hip, knee, ankle);
}

/** Shoulder–hip–knee; smaller ≈ more torso/hip fold. */
export function meanHipAngle(landmarks: Landmark[]): number | null {
  const left = hipAngle(landmarks, 'left');
  const right = hipAngle(landmarks, 'right');
  if (left != null && right != null) return (left + right) / 2;
  return left ?? right;
}

export function hipAngle(landmarks: Landmark[], side: 'left' | 'right'): number | null {
  const shoulder = getLandmark(landmarks, `${side}_shoulder`);
  const hip = getLandmark(landmarks, `${side}_hip`);
  const knee = getLandmark(landmarks, `${side}_knee`);
  if (!shoulder || !hip || !knee) return null;
  if (!isLandmarkVisible(shoulder) || !isLandmarkVisible(hip) || !isLandmarkVisible(knee)) {
    return null;
  }
  return angleDeg(shoulder, hip, knee);
}

/** Torso lean from vertical (0 = upright). Uses mid-shoulder vs mid-hip. */
export function torsoLeanDeg(landmarks: Landmark[]): number | null {
  const ls = getLandmark(landmarks, 'left_shoulder');
  const rs = getLandmark(landmarks, 'right_shoulder');
  const lh = getLandmark(landmarks, 'left_hip');
  const rh = getLandmark(landmarks, 'right_hip');
  if (!ls || !rs || !lh || !rh) return null;
  const sx = (ls.x + rs.x) / 2;
  const sy = (ls.y + rs.y) / 2;
  const hx = (lh.x + rh.x) / 2;
  const hy = (lh.y + rh.y) / 2;
  const dx = sx - hx;
  const dy = sy - hy;
  if (Math.hypot(dx, dy) < 1e-8) return 0;
  // vertical in image space is (0, -1) if y grows downward — use (0, 1) down from hip to...
  // hip to shoulder: (dx, dy). Vertical up is (0, -1).
  const mag = Math.hypot(dx, dy);
  const cos = Math.min(1, Math.max(-1, -dy / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function midHipY(landmarks: Landmark[]): number | null {
  const lh = getLandmark(landmarks, 'left_hip');
  const rh = getLandmark(landmarks, 'right_hip');
  if (!lh || !rh) return null;
  return (lh.y + rh.y) / 2;
}

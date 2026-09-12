import { POSE_LANDMARK_NAMES } from './landmarks';
import type { Landmark, PoseFrame } from './types';

type LoosePoint = {
  name?: string;
  x?: number;
  y?: number;
  z?: number;
  X?: number;
  Y?: number;
  visibility?: number;
  presence?: number;
};

function asPoint(value: unknown): LoosePoint | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as LoosePoint;
  if (p.x == null && p.X == null) return null;
  if (p.y == null && p.Y == null) return null;
  return p;
}

function unwrapPayload(raw: unknown): unknown {
  if (raw == null || typeof raw !== 'object') return raw;
  const obj = raw as Record<string, unknown>;
  if (obj.nativeEvent != null) return unwrapPayload(obj.nativeEvent);
  return raw;
}

function collectPoints(raw: unknown): LoosePoint[] | null {
  const data = unwrapPayload(raw);
  if (data == null) return null;

  if (Array.isArray(data)) {
    const pts = data.map(asPoint).filter((p): p is LoosePoint => p != null);
    return pts.length ? pts : null;
  }

  if (typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;

  for (const key of ['landmarks', 'poseLandmarks', 'pose_landmarks', 'pose', 'points']) {
    const v = obj[key];
    if (Array.isArray(v)) {
      const pts = v.map(asPoint).filter((p): p is LoosePoint => p != null);
      if (pts.length) return pts;
    }
  }

  // Named map: { left_hip: {x,y}, ... } or { 0: {x,y}, ... }
  const named: LoosePoint[] = [];
  for (const name of POSE_LANDMARK_NAMES) {
    const p = asPoint(obj[name]);
    if (p) named.push({ ...p, name });
  }
  if (named.length >= 8) return named;

  const values = Object.values(obj);
  const pts = values.map(asPoint).filter((p): p is LoosePoint => p != null);
  if (pts.length >= 8) return pts;

  return null;
}

/**
 * Normalize ThinkSys / MediaPipe / fixture payloads into a PoseFrame.
 * Accepts arrays, {landmarks}, {poseLandmarks}, nativeEvent wrappers, or named maps.
 */
export function normalizeNativeLandmarkPayload(
  raw: unknown,
  timestampMs: number = Date.now()
): PoseFrame | null {
  const points = collectPoints(raw);
  if (!points) return null;

  const landmarks: Landmark[] = points.map((p, i) => {
    const name =
      typeof p.name === 'string' && p.name.length > 0
        ? p.name
        : (POSE_LANDMARK_NAMES[i] ?? `kp_${i}`);
    const x = Number(p.x ?? p.X ?? 0);
    const y = Number(p.y ?? p.Y ?? 0);
    const z = p.z != null ? Number(p.z) : undefined;
    const visibility =
      p.visibility != null
        ? Number(p.visibility)
        : p.presence != null
          ? Number(p.presence)
          : undefined;
    return { name, x, y, z, visibility };
  });

  return { timestampMs, landmarks };
}

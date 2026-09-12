import type { PoseFrame, SetCountResult, TechniqueAnalysis } from './types';

export type CapturedPoseSession = {
  frames: PoseFrame[];
  count: SetCountResult;
  analysis: TechniqueAnalysis | null;
  source: 'native-mediapipe' | 'fixture' | 'mock';
  capturedAt: number;
};

let last: CapturedPoseSession | null = null;

export function publishPoseSession(session: CapturedPoseSession): void {
  last = session;
}

export function getLastPoseSession(): CapturedPoseSession | null {
  return last;
}

export function clearPoseSession(): void {
  last = null;
}

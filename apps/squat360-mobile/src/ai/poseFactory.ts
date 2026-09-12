import { LandmarkSetCounter } from './LandmarkSetCounter';
import { LandmarkTechniqueAnalyzer } from './LandmarkTechniqueAnalyzer';
import { MockSetCounter, type SetCounter } from './SetCounter';
import { MockTechniqueAnalyzer, type TechniqueAnalyzer } from './TechniqueAnalyzer';

export type PoseEngineMode = 'auto' | 'landmark' | 'mock';

export function createSetCounter(mode: PoseEngineMode, nativeLinked: boolean): SetCounter {
  if (mode === 'mock') return new MockSetCounter();
  if (mode === 'landmark') return new LandmarkSetCounter();
  return nativeLinked ? new LandmarkSetCounter() : new MockSetCounter();
}

export function createTechniqueAnalyzer(mode: PoseEngineMode, nativeLinked: boolean): TechniqueAnalyzer {
  if (mode === 'mock') return new MockTechniqueAnalyzer();
  if (mode === 'landmark') return new LandmarkTechniqueAnalyzer();
  return nativeLinked ? new LandmarkTechniqueAnalyzer() : new MockTechniqueAnalyzer();
}

export function describePoseBackend(nativeLinked: boolean): {
  id: 'mediapipe-native' | 'mock-fallback';
  label: string;
  detail: string;
} {
  if (nativeLinked) {
    return {
      id: 'mediapipe-native',
      label: 'MediaPipe Pose (on-device, ThinkSys)',
      detail: 'Native @thinksys/react-native-mediapipe linked. Live landmarks feed LandmarkSetCounter.',
    };
  }
  return {
    id: 'mock-fallback',
    label: 'Mock / fixture fallback',
    detail:
      'Camera + fixture path (Fold7-safe preview omits native MediaPipe). Landmark heuristics and FitWave cues still run offline.',
  };
}

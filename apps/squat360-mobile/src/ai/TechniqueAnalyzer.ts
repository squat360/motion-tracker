import type { PoseFrame, TechniqueAnalysis } from './types';

export interface TechniqueAnalyzer {
  analyze(frames: PoseFrame[]): TechniqueAnalysis;
}

/**
 * Mock technique analyzer when no landmarks are available.
 * Prefer LandmarkTechniqueAnalyzer once MediaPipe frames (or fixtures) exist.
 */
export class MockTechniqueAnalyzer implements TechniqueAnalyzer {
  analyze(frames: PoseFrame[]): TechniqueAnalysis {
    const n = frames.length;
    return {
      summary:
        n === 0
          ? 'No frames yet — record a set for coach review.'
          : `Reviewed ${n} mock frame(s). Flags are placeholders for coach discussion.`,
      findings: [
        {
          code: 'DEPTH_CHECK',
          severity: 'cue',
          message: 'Check squat depth consistency across reps (mock — no landmarks).',
          coachHint: 'Ask the athlete how the bottom position felt; adjust stance if needed.',
        },
        {
          code: 'KNEE_TRACK',
          severity: 'info',
          message: 'Knee tracking relative to toes not verified (mock).',
          coachHint: 'Use floor markers or a side view on Fold unfolded when possible.',
        },
      ],
    };
  }
}

import {
  getLandmark,
  isLandmarkVisible,
  meanHipAngle,
  meanKneeAngle,
  torsoLeanDeg,
} from './landmarks';
import type { TechniqueAnalyzer } from './TechniqueAnalyzer';
import type { PoseFrame, TechniqueAnalysis, TechniqueFinding } from './types';
import { summarizeFitWaveSession } from './fitwaveFormChecks';

const DEPTH_SHALLOW_DEG = 115;
const TORSO_LEAN_FLAG_DEG = 38;
const KNEE_TRACK_OFFSET = 0.06;

/**
 * Rule heuristics over a recorded landmark sequence.
 * Flags are discussion prompts for a coach, not pass/fail scores.
 */
export class LandmarkTechniqueAnalyzer implements TechniqueAnalyzer {
  analyze(frames: PoseFrame[]): TechniqueAnalysis {
    const usable = frames.filter((f) => f.landmarks.length > 0);
    if (usable.length === 0) {
      return {
        summary: 'No pose landmarks yet — record a set on a development build (Fold7) or load fixtures.',
        findings: [
          {
            code: 'NO_LANDMARKS',
            severity: 'info',
            message: 'Pose frames were empty. Native MediaPipe is required for live landmarks.',
            coachHint: 'Use npx expo run:android on a device with USB debugging; Expo Go cannot load the native module.',
          },
        ],
      };
    }

    const kneeSeries = usable
      .map((f) => meanKneeAngle(f.landmarks))
      .filter((v): v is number => v != null);
    const hipSeries = usable
      .map((f) => meanHipAngle(f.landmarks))
      .filter((v): v is number => v != null);
    const leanSeries = usable
      .map((f) => torsoLeanDeg(f.landmarks))
      .filter((v): v is number => v != null);

    const minKnee = kneeSeries.length ? Math.min(...kneeSeries) : null;
    const maxLean = leanSeries.length ? Math.max(...leanSeries) : null;
    const minHip = hipSeries.length ? Math.min(...hipSeries) : null;

    const findings: TechniqueFinding[] = [];

    if (minKnee == null) {
      findings.push({
        code: 'LOW_VISIBILITY',
        severity: 'info',
        message: 'Hips/knees/ankles were not consistently visible — depth was not estimated.',
        coachHint: 'Unfold the Fold7, step back 2–3 m, and keep the full body in frame. Avoid mirrors and backlight.',
      });
    } else if (minKnee > DEPTH_SHALLOW_DEG) {
      findings.push({
        code: 'DEPTH_CHECK',
        severity: 'cue',
        message: `Deepest mean knee angle ≈ ${minKnee.toFixed(0)}° — depth may be high this set.`,
        coachHint: 'Ask how the bottom felt; use a box/target if the coach wants consistent depth. Not a pass/fail score.',
      });
    } else {
      findings.push({
        code: 'DEPTH_CHECK',
        severity: 'info',
        message: `Deepest mean knee angle ≈ ${minKnee.toFixed(0)}° (heuristic only).`,
        coachHint: 'Compare to the athlete’s usual depth; camera angle changes the number.',
      });
    }

    const kneeTrack = kneeTrackOffsetAtDepth(usable);
    if (kneeTrack != null) {
      if (Math.abs(kneeTrack) > KNEE_TRACK_OFFSET) {
        findings.push({
          code: 'KNEE_TRACK',
          severity: 'cue',
          message: 'Knee vs ankle alignment at depth looks offset in this camera view.',
          coachHint: 'Use a front or 45° view; floor marks help. Confirm with the coach before cueing knees.',
        });
      } else {
        findings.push({
          code: 'KNEE_TRACK',
          severity: 'info',
          message: 'Knee/ankle x-offset at depth was small in this view (heuristic).',
          coachHint: 'Still watch live — 2D landmarks miss rotation and valgus that a coach will see.',
        });
      }
    } else {
      findings.push({
        code: 'KNEE_TRACK',
        severity: 'info',
        message: 'Knee tracking relative to toes not verified (missing landmarks).',
        coachHint: 'Use floor markers or a side/front view on Fold unfolded when possible.',
      });
    }

    if (maxLean != null && maxLean > TORSO_LEAN_FLAG_DEG) {
      findings.push({
        code: 'TORSO_LEAN',
        severity: 'cue',
        message: `Peak torso lean ≈ ${maxLean.toFixed(0)}° from vertical in image space.`,
        coachHint: 'Discuss brace and stance with the coach; side camera exaggerates or hides lean.',
      });
    } else if (minHip != null) {
      findings.push({
        code: 'TORSO_LEAN',
        severity: 'info',
        message: `Peak torso lean ≈ ${maxLean != null ? maxLean.toFixed(0) : 'n/a'}° (heuristic).`,
        coachHint: 'Treat as a talking point, not a score.',
      });
    }

    const vis = visibilityRatio(usable);
    if (vis < 0.7) {
      findings.push({
        code: 'LOW_VISIBILITY',
        severity: 'info',
        message: `Only about ${Math.round(vis * 100)}% of key squat landmarks stayed visible.`,
        coachHint: 'Gym lighting, racks, and dark clothing reduce contrast. Reposition the stand.',
      });
    }

    // FitWave-inspired multi-exercise cues (ported from squat360/FitWave)
    findings.push(...summarizeFitWaveSession('plank', usable));
    findings.push(...summarizeFitWaveSession('biceps', usable));
    findings.push(...summarizeFitWaveSession('press', usable));

    const summary =
      `Reviewed ${usable.length} landmark frame(s)` +
      (minKnee != null ? `; deepest knee ≈ ${minKnee.toFixed(0)}°` : '') +
      '. Heuristics only — augments coach review (includes FitWave form cues).';

    return { findings, summary };
  }
}

function kneeTrackOffsetAtDepth(frames: PoseFrame[]): number | null {
  let best: { knee: number; offset: number } | null = null;
  for (const frame of frames) {
    const knee = meanKneeAngle(frame.landmarks);
    if (knee == null) continue;
    const lk = getLandmark(frame.landmarks, 'left_knee');
    const la = getLandmark(frame.landmarks, 'left_ankle');
    const rk = getLandmark(frame.landmarks, 'right_knee');
    const ra = getLandmark(frame.landmarks, 'right_ankle');
    if (!lk || !la || !rk || !ra) continue;
    const offset = (lk.x - la.x + (rk.x - ra.x)) / 2;
    if (!best || knee < best.knee) best = { knee, offset };
  }
  return best?.offset ?? null;
}

function visibilityRatio(frames: PoseFrame[]): number {
  const names = [
    'left_hip',
    'right_hip',
    'left_knee',
    'right_knee',
    'left_ankle',
    'right_ankle',
    'left_shoulder',
    'right_shoulder',
  ];
  let ok = 0;
  let total = 0;
  for (const frame of frames) {
    for (const name of names) {
      total += 1;
      if (isLandmarkVisible(getLandmark(frame.landmarks, name))) ok += 1;
    }
  }
  return total === 0 ? 0 : ok / total;
}

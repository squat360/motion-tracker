import { meanKneeAngle } from './landmarks';
import type { SetCounter } from './SetCounter';
import type { PoseFrame, SetCountResult } from './types';

/** Hysteresis thresholds (degrees). Coaching aid — not a gym-validated rep judge. */
export const KNEE_STANDING_DEG = 155;
export const KNEE_BOTTOM_DEG = 105;
export const PHASE_MARGIN_DEG = 8;

/**
 * Phase machine over MediaPipe-style landmarks.
 * Counts a rep when the athlete reaches a bottom (knee angle below threshold)
 * and returns to standing. Pure TypeScript — no native / Apple frameworks.
 */
export class LandmarkSetCounter implements SetCounter {
  private reps = 0;
  private phase: SetCountResult['phase'] = 'unknown';
  private lastKnee: number | null = null;
  private sawBottom = false;
  private frames = 0;
  private skipped = 0;

  reset(): void {
    this.reps = 0;
    this.phase = 'unknown';
    this.lastKnee = null;
    this.sawBottom = false;
    this.frames = 0;
    this.skipped = 0;
  }

  update(frame: PoseFrame): SetCountResult {
    this.frames += 1;
    const knee = meanKneeAngle(frame.landmarks);
    if (knee == null) {
      this.skipped += 1;
      return this.getResult();
    }

    const prev = this.lastKnee;
    this.lastKnee = knee;
    const descending = prev != null && knee < prev - 0.4;
    const ascending = prev != null && knee > prev + 0.4;

    switch (this.phase) {
      case 'unknown':
        this.phase = knee >= KNEE_STANDING_DEG ? 'standing' : knee <= KNEE_BOTTOM_DEG ? 'bottom' : 'descending';
        if (this.phase === 'bottom') this.sawBottom = true;
        break;
      case 'standing':
        if (knee < KNEE_STANDING_DEG - PHASE_MARGIN_DEG) {
          this.phase = 'descending';
          this.sawBottom = false;
        }
        break;
      case 'descending':
        if (knee <= KNEE_BOTTOM_DEG) {
          this.phase = 'bottom';
          this.sawBottom = true;
        } else if (knee >= KNEE_STANDING_DEG && !this.sawBottom) {
          this.phase = 'standing';
        } else if (ascending && knee > KNEE_BOTTOM_DEG + PHASE_MARGIN_DEG) {
          // Turned around above a true bottom — still treat as ascent if reasonably deep.
          if (knee < KNEE_STANDING_DEG - 15) {
            this.phase = 'ascending';
            this.sawBottom = true;
          }
        }
        break;
      case 'bottom':
        if (knee > KNEE_BOTTOM_DEG + PHASE_MARGIN_DEG) {
          this.phase = 'ascending';
        }
        break;
      case 'ascending':
        if (knee >= KNEE_STANDING_DEG) {
          if (this.sawBottom) {
            this.reps += 1;
          }
          this.phase = 'standing';
          this.sawBottom = false;
        } else if (descending && knee <= KNEE_BOTTOM_DEG) {
          this.phase = 'bottom';
          this.sawBottom = true;
        }
        break;
      default:
        break;
    }

    return this.getResult();
  }

  getResult(): SetCountResult {
    const notes = [
      'Landmark set counter (knee-angle phase machine). Coaching aid — not a substitute for a trainer.',
      this.lastKnee != null ? `Last mean knee angle ≈ ${this.lastKnee.toFixed(0)}°.` : 'Waiting for visible hips/knees/ankles.',
    ];
    if (this.skipped > 0) {
      notes.push(`Skipped ${this.skipped}/${this.frames} frame(s) with low-visibility legs.`);
    }
    return { reps: this.reps, phase: this.phase, notes };
  }
}

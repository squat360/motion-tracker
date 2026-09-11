import type { PoseFrame, SetCountResult } from './types';

export interface SetCounter {
  reset(): void;
  /** Ingest a pose frame (MediaPipe/TFLite on Android — TODO). */
  update(frame: PoseFrame): SetCountResult;
  getResult(): SetCountResult;
}

/**
 * Mock set counter for UI / pilot demos.
 * TODO(Android): wire MediaPipe Pose Landmarker or TFLite GPU delegate;
 * derive knee/hip angles and phase machine from live landmarks.
 */
export class MockSetCounter implements SetCounter {
  private reps = 0;
  private phase: SetCountResult['phase'] = 'unknown';
  private toggle = false;

  reset(): void {
    this.reps = 0;
    this.phase = 'unknown';
    this.toggle = false;
  }

  update(_frame: PoseFrame): SetCountResult {
    // Placeholder cadence so Review/Record screens can show motion.
    this.toggle = !this.toggle;
    this.phase = this.toggle ? 'descending' : 'ascending';
    if (!this.toggle) {
      this.reps += 1;
    }
    return this.getResult();
  }

  getResult(): SetCountResult {
    return {
      reps: this.reps,
      phase: this.phase,
      notes: [
        'Mock counter — replace with MediaPipe/TFLite on Android.',
        'Augments coach review; not a substitute for a trainer.',
      ],
    };
  }
}

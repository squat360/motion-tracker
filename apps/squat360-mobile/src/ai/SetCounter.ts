import type { PoseFrame, SetCountResult } from './types';

export interface SetCounter {
  reset(): void;
  /** Ingest a pose frame (MediaPipe landmarks on Android when native module is linked). */
  update(frame: PoseFrame): SetCountResult;
  getResult(): SetCountResult;
}

/**
 * Mock set counter for UI when the native MediaPipe module is missing
 * (Expo Go, web, iOS without a dev client).
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
        'Mock counter — native MediaPipe not linked. Use npx expo run:android on Fold7.',
        'Augments coach review; not a substitute for a trainer.',
      ],
    };
  }
}

import type { ComponentType } from 'react';

export type NativePoseViewProps = {
  width?: number;
  height?: number;
  onLandmark?: (data: unknown) => void;
  face?: boolean;
  leftArm?: boolean;
  rightArm?: boolean;
  leftWrist?: boolean;
  rightWrist?: boolean;
  torso?: boolean;
  leftLeg?: boolean;
  rightLeg?: boolean;
  leftAnkle?: boolean;
  rightAnkle?: boolean;
  frameLimit?: number;
};

export type NativePoseModule = {
  RNMediapipe: ComponentType<NativePoseViewProps>;
  switchCamera?: () => void;
};

export function isNativePoseLinked(): boolean {
  return false;
}

export function loadNativePoseModule(): NativePoseModule | null {
  return null;
}

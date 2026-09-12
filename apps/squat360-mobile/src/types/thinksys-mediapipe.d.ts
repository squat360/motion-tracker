declare module '@thinksys/react-native-mediapipe' {
  import type { ComponentType } from 'react';

  export type RNMediapipeProps = {
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

  export const RNMediapipe: ComponentType<RNMediapipeProps>;
  export function switchCamera(): void;
}

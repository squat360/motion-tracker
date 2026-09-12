import { NativeModules, Platform, UIManager } from 'react-native';
import Constants from 'expo-constants';
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

let cached: NativePoseModule | null | undefined;

function viewManagerPresent(): boolean {
  try {
    const name = Platform.OS === 'android' ? 'TsMediapipeViewManager' : 'TsMediapipeView';
    const cfg = UIManager.getViewManagerConfig?.(name);
    if (cfg != null) return true;
    return Boolean(NativeModules.MediaPipeNativeModule || NativeModules.TsMediapipeViewManager);
  } catch {
    return false;
  }
}

/** True only when the native view manager is actually linked (not Expo Go / web). */
export function isNativePoseLinked(): boolean {
  if (Platform.OS === 'web') return false;
  if (Constants.expoConfig?.extra?.disableNativeMediapipe) return false;
  return viewManagerPresent();
}

export function loadNativePoseModule(): NativePoseModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web' || !viewManagerPresent()) {
    cached = null;
    return null;
  }
  try {
    // Optional native module — Expo Go / web throw or return an unlinked stub.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@thinksys/react-native-mediapipe') as NativePoseModule;
    cached = mod?.RNMediapipe ? mod : null;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

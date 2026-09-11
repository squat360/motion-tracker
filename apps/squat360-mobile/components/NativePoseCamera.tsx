import { StyleSheet, View } from 'react-native';
import { isNativePoseLinked, loadNativePoseModule } from '@/src/ai/nativePose';

type Props = {
  width: number;
  height: number;
  onLandmark?: (data: unknown) => void;
};

/** Renders ThinkSys MediaPipe camera when the native module is linked; otherwise nothing. */
export function NativePoseCamera({ width, height, onLandmark }: Props) {
  const mod = loadNativePoseModule();
  if (!mod || !isNativePoseLinked()) return null;
  const { RNMediapipe } = mod;
  return (
    <View style={[styles.box, { width, height }]}>
      <RNMediapipe
        width={width}
        height={height}
        onLandmark={onLandmark}
        face
        leftArm
        rightArm
        leftWrist
        rightWrist
        torso
        leftLeg
        rightLeg
        leftAnkle
        rightAnkle
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#000' },
});

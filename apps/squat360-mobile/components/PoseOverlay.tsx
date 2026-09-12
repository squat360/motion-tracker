import { StyleSheet, Text, View } from 'react-native';
import { SKELETON_EDGES, getLandmark, isLandmarkVisible } from '@/src/ai/landmarks';
import type { PoseFrame } from '@/src/ai/types';
import { gym } from '@/src/theme/gym';

type Props = {
  frame: PoseFrame | null;
  label?: string;
  width: number;
  height: number;
};

function Bone({
  x1,
  y1,
  x2,
  y2,
  color,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const angle = Math.atan2(dy, dx);
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x1,
        top: y1,
        width: len,
        height: 3,
        backgroundColor: color,
        opacity: 0.8,
        borderRadius: 2,
        transform: [{ rotateZ: `${angle}rad` }],
        transformOrigin: 'left center',
      }}
    />
  );
}

export function PoseOverlay({ frame, label, width, height }: Props) {
  if (!frame || frame.landmarks.length === 0 || width <= 0 || height <= 0) {
    return null;
  }

  const joints = frame.landmarks.filter((lm) => isLandmarkVisible(lm, 0.25));

  return (
    <View pointerEvents="none" style={[styles.wrap, { width, height }]}>
      {SKELETON_EDGES.map(([a, b]) => {
        const pa = getLandmark(frame.landmarks, a);
        const pb = getLandmark(frame.landmarks, b);
        if (!isLandmarkVisible(pa, 0.25) || !isLandmarkVisible(pb, 0.25) || !pa || !pb) {
          return null;
        }
        return (
          <Bone
            key={`${a}-${b}`}
            x1={pa.x * width}
            y1={pa.y * height}
            x2={pb.x * width}
            y2={pb.y * height}
            color={gym.accent}
          />
        );
      })}
      {joints.map((lm) => (
        <View
          key={lm.name}
          style={[
            styles.joint,
            {
              left: lm.x * width - 4,
              top: lm.y * height - 4,
            },
          ]}
        />
      ))}
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  joint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: gym.accent,
    borderWidth: 1,
    borderColor: '#052e16',
  },
  label: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    color: gym.accent,
    fontSize: 11,
    fontWeight: '700',
  },
});

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { PoseOverlay } from '@/components/PoseOverlay';
import { LandmarkTechniqueAnalyzer } from '@/src/ai/LandmarkTechniqueAnalyzer';
import { SAMPLE_SQUAT_FRAMES } from '@/src/ai/fixtures/squatSequence';
import { LandmarkSetCounter } from '@/src/ai/LandmarkSetCounter';
import { getLastPoseSession } from '@/src/ai/poseSession';
import type { PoseFrame } from '@/src/ai/types';
import { gym } from '@/src/theme/gym';
import { listSessions, type SessionRow } from '@/src/db/database';

export default function ReviewScreen() {
  const { width } = useWindowDimensions();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [tick, setTick] = useState(0);
  const uri = sessions.find((s) => s.video_uri)?.video_uri ?? null;
  const captured = getLastPoseSession();

  useFocusEffect(
    useCallback(() => {
      listSessions().then(setSessions).catch(() => setSessions([]));
    }, [])
  );

  const frames: PoseFrame[] = captured?.frames?.length ? captured.frames : SAMPLE_SQUAT_FRAMES;
  const usingFixture = !captured?.frames?.length;

  useEffect(() => {
    if (frames.length === 0) return;
    const id = setInterval(() => setTick((n) => n + 1), 70);
    return () => clearInterval(id);
  }, [frames.length]);

  const frame = frames.length ? frames[tick % frames.length] : null;

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });

  const derived = useMemo(() => {
    if (captured?.analysis && captured.count) {
      return { count: captured.count, analysis: captured.analysis, source: captured.source };
    }
    const counter = new LandmarkSetCounter();
    frames.forEach((f) => counter.update(f));
    return {
      count: counter.getResult(),
      analysis: new LandmarkTechniqueAnalyzer().analyze(frames),
      source: usingFixture ? 'fixture' : 'native-mediapipe',
    };
  }, [captured, frames, usingFixture]);

  const previewH = Math.min(width * 0.72, 340);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review</Text>
      <Text style={styles.muted}>
        {usingFixture
          ? 'Showing fixture skeleton until a captured pose session exists. Live MediaPipe needs a Fold7 dev build.'
          : `Overlay from ${derived.source} (${frames.length} frames). Heuristics only.`}
      </Text>

      <View style={[styles.playerWrap, { height: previewH }]}>
        {uri ? (
          <VideoView style={styles.video} player={player} nativeControls contentFit="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.muted}>No video file — pose frames still overlay below.</Text>
          </View>
        )}
        <PoseOverlay
          frame={frame}
          width={width - 32}
          height={previewH}
          label={usingFixture ? 'Fixture keypoints' : 'Captured keypoints'}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Set count: {derived.count.reps} reps · {derived.count.phase}
        </Text>
        <Text style={styles.muted}>{derived.analysis.summary}</Text>
        {derived.analysis.findings.map((f) => (
          <Text key={f.code} style={styles.find}>
            • {f.message}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gym.bg, padding: 16, gap: 10 },
  title: { color: gym.text, fontSize: 24, fontWeight: '700' },
  muted: { color: gym.muted, fontSize: 13, lineHeight: 18 },
  playerWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderColor: gym.border,
    borderWidth: 1,
  },
  video: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 },
  card: {
    backgroundColor: gym.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gym.border,
    padding: 14,
    gap: 6,
  },
  cardTitle: { color: gym.text, fontWeight: '600', fontSize: 16 },
  find: { color: gym.muted, fontSize: 13 },
});

import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { gym } from '@/src/theme/gym';
import { listSessions, type SessionRow } from '@/src/db/database';
import { MockSetCounter, MockTechniqueAnalyzer, type PoseFrame } from '@/src/ai';

export default function ReviewScreen() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const uri = sessions.find((s) => s.video_uri)?.video_uri ?? null;

  useEffect(() => {
    listSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });

  const mock = useMemo(() => {
    const frames: PoseFrame[] = Array.from({ length: 8 }, (_, i) => ({
      timestampMs: i * 33,
      landmarks: [],
    }));
    const counter = new MockSetCounter();
    frames.forEach((f) => counter.update(f));
    const analysis = new MockTechniqueAnalyzer().analyze(frames);
    return { counter: counter.getResult(), analysis };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review</Text>
      <Text style={styles.muted}>Player + pose overlay placeholder (MediaPipe later).</Text>

      <View style={styles.playerWrap}>
        {uri ? (
          <VideoView style={styles.video} player={player} nativeControls contentFit="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.muted}>No video yet — record a set first.</Text>
            <Text style={styles.muted}>Seed sessions still show AI mock output below.</Text>
          </View>
        )}
        {/* Overlay placeholder skeleton */}
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.joint} />
          <View style={[styles.joint, { top: '35%', left: '42%' }]} />
          <View style={[styles.joint, { top: '55%', left: '40%' }]} />
          <View style={[styles.bone, { top: '28%', left: '48%' }]} />
          <Text style={styles.overlayLabel}>Pose overlay placeholder</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mock set count: {mock.counter.reps} reps</Text>
        <Text style={styles.muted}>{mock.analysis.summary}</Text>
        {mock.analysis.findings.map((f) => (
          <Text key={f.code} style={styles.find}>
            • {f.message}
          </Text>
        ))}
      </View>
    </View>
  );
}

const H = Math.min(Dimensions.get('window').width * 0.7, 320);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gym.bg, padding: 16, gap: 10 },
  title: { color: gym.text, fontSize: 24, fontWeight: '700' },
  muted: { color: gym.muted, fontSize: 13, lineHeight: 18 },
  playerWrap: {
    height: H,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderColor: gym.border,
    borderWidth: 1,
  },
  video: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 },
  overlay: { ...StyleSheet.absoluteFill },
  joint: {
    position: 'absolute',
    top: '22%',
    left: '48%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: gym.accent,
    opacity: 0.85,
  },
  bone: {
    position: 'absolute',
    width: 3,
    height: '30%',
    backgroundColor: gym.accent,
    opacity: 0.5,
  },
  overlayLabel: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    left: 12,
    color: gym.accent,
    fontSize: 11,
    fontWeight: '600',
  },
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

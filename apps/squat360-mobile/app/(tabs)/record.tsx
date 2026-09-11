import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, useWindowDimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { PoseOverlay } from '@/components/PoseOverlay';
import { NativePoseCamera } from '@/components/NativePoseCamera';
import { LandmarkSetCounter } from '@/src/ai/LandmarkSetCounter';
import { LandmarkTechniqueAnalyzer } from '@/src/ai/LandmarkTechniqueAnalyzer';
import { buildSquatFixture } from '@/src/ai/fixtures/squatSequence';
import { normalizeNativeLandmarkPayload } from '@/src/ai/normalizeLandmarks';
import { isNativePoseLinked } from '@/src/ai/nativePose';
import { describePoseBackend } from '@/src/ai/poseFactory';
import { publishPoseSession } from '@/src/ai/poseSession';
import type { PoseFrame, SetCountResult } from '@/src/ai/types';
import { insertSession, insertSet } from '@/src/db/database';
import { gym } from '@/src/theme/gym';

export default function RecordScreen() {
  const { width, height } = useWindowDimensions();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [lastUri, setLastUri] = useState<string | null>(null);
  const [frame, setFrame] = useState<PoseFrame | null>(null);
  const [count, setCount] = useState<SetCountResult>({ reps: 0, phase: 'unknown', notes: [] });
  const [demoOn, setDemoOn] = useState(false);
  const native = isNativePoseLinked();
  const backend = describePoseBackend(native);
  const counterRef = useRef(new LandmarkSetCounter());
  const framesRef = useRef<PoseFrame[]>([]);
  const capturingRef = useRef(false);

  const previewH = Math.max(280, Math.round(height * 0.52));

  const ingest = useCallback((pose: PoseFrame, source: 'native-mediapipe' | 'fixture') => {
    setFrame(pose);
    if (capturingRef.current || source === 'fixture') {
      framesRef.current.push(pose);
      setCount(counterRef.current.update(pose));
    }
  }, []);

  const onLandmark = useCallback(
    (raw: unknown) => {
      const pose = normalizeNativeLandmarkPayload(raw);
      if (pose) ingest(pose, 'native-mediapipe');
    },
    [ingest]
  );

  useEffect(() => {
    if (!demoOn || native) return;
    const fixture = buildSquatFixture(2);
    let i = 0;
    counterRef.current.reset();
    framesRef.current = [];
    const id = setInterval(() => {
      const f = fixture[i % fixture.length];
      ingest(f, 'fixture');
      i += 1;
    }, 50);
    return () => clearInterval(id);
  }, [demoOn, native, ingest]);

  const persistCapture = useCallback(
    async (videoUri: string | null, source: 'native-mediapipe' | 'fixture' | 'mock') => {
      const result = counterRef.current.getResult();
      const frames = framesRef.current.slice();
      const analysis = new LandmarkTechniqueAnalyzer().analyze(frames);
      publishPoseSession({
        frames,
        count: result,
        analysis,
        source,
        capturedAt: Date.now(),
      });
      const sessionId = await insertSession({
        clientId: null,
        title: `Recorded set ${new Date().toLocaleString()}`,
        videoUri,
      });
      await insertSet({
        sessionId,
        reps: result.reps,
        notes: result.notes[0] ?? '',
      });
    },
    []
  );

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera permission</Text>
        <Text style={styles.muted}>Needed to record squat sets and run on-device pose for coach review.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  const startCapture = () => {
    counterRef.current.reset();
    framesRef.current = [];
    capturingRef.current = true;
    setCount(counterRef.current.getResult());
  };

  const toggleRecord = async () => {
    if (native) {
      if (recording) {
        capturingRef.current = false;
        setRecording(false);
        try {
          await persistCapture(null, 'native-mediapipe');
          Alert.alert('Saved', `Landmark set indexed (${counterRef.current.getResult().reps} heuristic reps). Open Review.`);
        } catch (e) {
          Alert.alert('Save error', String(e));
        }
        return;
      }
      startCapture();
      setRecording(true);
      return;
    }

    const cam = cameraRef.current;
    if (!cam) return;

    if (recording) {
      cam.stopRecording();
      return;
    }

    try {
      startCapture();
      setRecording(true);
      const video = await cam.recordAsync({
        maxDuration: 180,
        ...({ quality: '2160p' } as object),
      });
      const uri = video?.uri ?? null;
      setLastUri(uri);
      capturingRef.current = false;
      await persistCapture(uri, demoOn ? 'fixture' : 'mock');
      Alert.alert('Saved', 'Clip indexed in sqlite for Review.');
    } catch (e) {
      try {
        const video = await cam.recordAsync({ maxDuration: 180 });
        const uri = video?.uri ?? null;
        setLastUri(uri);
        capturingRef.current = false;
        await persistCapture(uri, demoOn ? 'fixture' : 'mock');
        Alert.alert('Saved (fallback quality)', '2160p unavailable; used device default.');
      } catch (e2) {
        capturingRef.current = false;
        Alert.alert('Record error', String(e2 ?? e));
      }
    } finally {
      setRecording(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.preview, { height: previewH }]}>
        {native ? (
          <NativePoseCamera width={width} height={previewH} onLandmark={onLandmark} />
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            mode="video"
            videoQuality="2160p"
          />
        )}
        <PoseOverlay
          frame={frame}
          width={width}
          height={previewH}
          label={native ? 'Live MediaPipe landmarks' : demoOn ? 'Fixture overlay (not live pose)' : undefined}
        />
      </View>
      <View style={styles.bar}>
        <Text style={styles.kicker}>{backend.label}</Text>
        <Text style={styles.muted}>{backend.detail}</Text>
        <Text style={styles.hud}>
          {count.reps} reps · {count.phase}
          {frame ? ` · ${frame.landmarks.length} pts` : ''}
        </Text>
        <Pressable style={[styles.btn, recording && styles.btnStop]} onPress={toggleRecord}>
          <Text style={styles.btnText}>
            {recording ? 'Stop' : native ? 'Capture set (pose)' : 'Record video'}
          </Text>
        </Pressable>
        {!native ? (
          <Pressable style={styles.btnGhost} onPress={() => setDemoOn((v) => !v)}>
            <Text style={styles.btnGhostText}>
              {demoOn ? 'Hide fixture overlay' : 'Show fixture overlay (web / Expo Go)'}
            </Text>
          </Pressable>
        ) : null}
        {lastUri ? (
          <Text style={styles.uri} numberOfLines={1}>
            {lastUri}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gym.bg },
  preview: { width: '100%', backgroundColor: '#000', overflow: 'hidden' },
  camera: { flex: 1 },
  bar: {
    padding: 16,
    gap: 8,
    backgroundColor: gym.card,
    borderTopColor: gym.border,
    borderTopWidth: 1,
  },
  title: { color: gym.text, fontSize: 22, fontWeight: '700', margin: 20 },
  kicker: { color: gym.accent, fontWeight: '700', fontSize: 13 },
  muted: { color: gym.muted, fontSize: 13, lineHeight: 18 },
  hud: { color: gym.text, fontSize: 16, fontWeight: '600' },
  btn: {
    backgroundColor: gym.accentDim,
    borderColor: gym.accent,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnStop: { backgroundColor: '#7f1d1d', borderColor: gym.danger },
  btnText: { color: gym.text, fontWeight: '700' },
  btnGhost: {
    borderColor: gym.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnGhostText: { color: gym.muted, fontWeight: '600', fontSize: 13 },
  uri: { color: gym.muted, fontSize: 11 },
});

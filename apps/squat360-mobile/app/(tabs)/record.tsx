import { useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { gym } from '@/src/theme/gym';
import { insertSession } from '@/src/db/database';

export default function RecordScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [lastUri, setLastUri] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera permission</Text>
        <Text style={styles.muted}>Needed to record squat sets for coach review.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  const toggleRecord = async () => {
    const cam = cameraRef.current;
    if (!cam) return;

    if (recording) {
      cam.stopRecording();
      return;
    }

    try {
      setRecording(true);
      // Prefer highest practical quality; request 2160p when the native layer supports it.
      const video = await cam.recordAsync({
        maxDuration: 180,
        // Expo Camera accepts platform-specific quality; 2160p preferred for Samsung.
        ...({ quality: '2160p' } as object),
      });
      const uri = video?.uri ?? null;
      setLastUri(uri);
      if (uri) {
        await insertSession({
          clientId: null,
          title: `Recorded set ${new Date().toLocaleString()}`,
          videoUri: uri,
        });
        Alert.alert('Saved', 'Clip indexed in sqlite for Review.');
      }
    } catch (e) {
      try {
        const video = await cam.recordAsync({ maxDuration: 180 });
        const uri = video?.uri ?? null;
        setLastUri(uri);
        if (uri) {
          await insertSession({
            clientId: null,
            title: `Recorded set ${new Date().toLocaleString()}`,
            videoUri: uri,
          });
          Alert.alert('Saved (fallback quality)', '2160p unavailable; used device default.');
        }
      } catch (e2) {
        Alert.alert('Record error', String(e2 ?? e));
      }
    } finally {
      setRecording(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mode="video"
        videoQuality="2160p"
      />
      <View style={styles.bar}>
        <Text style={styles.muted}>
          Best quality · prefer 2160p when available · MediaPipe analyze TODO on Android
        </Text>
        <Pressable style={[styles.btn, recording && styles.btnStop]} onPress={toggleRecord}>
          <Text style={styles.btnText}>{recording ? 'Stop' : 'Record'}</Text>
        </Pressable>
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
  camera: { flex: 1 },
  bar: {
    padding: 16,
    gap: 10,
    backgroundColor: gym.card,
    borderTopColor: gym.border,
    borderTopWidth: 1,
  },
  title: { color: gym.text, fontSize: 22, fontWeight: '700', margin: 20 },
  muted: { color: gym.muted, fontSize: 13 },
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
  uri: { color: gym.muted, fontSize: 11 },
});

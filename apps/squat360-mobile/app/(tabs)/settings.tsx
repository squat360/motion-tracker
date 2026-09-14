import { StyleSheet, Text, View } from 'react-native';
import { gym } from '@/src/theme/gym';
import { isFirebaseConfigured } from '@/src/firebase/config';
import { DEFAULT_BACKEND_LABEL, NATIVE_POSE_PACKAGE } from '@/src/ai/constants';
import { isNativePoseLinked } from '@/src/ai/nativePose';
import { describePoseBackend } from '@/src/ai/poseFactory';
import { getComfyBaseUrl } from '@/src/ai/comfyui/client';
import { getLlmBaseUrl, getLlmModel } from '@/src/ai/superCoachCloud';

export default function SettingsScreen() {
  const native = isNativePoseLinked();
  const backend = describePoseBackend(native);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>Pose backend (default)</Text>
        <Text style={styles.rowValue}>{DEFAULT_BACKEND_LABEL}</Text>
        <Text style={styles.muted}>{backend.label}</Text>
        <Text style={styles.muted}>{backend.detail}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>Native module</Text>
        <Text style={styles.rowValue}>
          {native ? `Linked · ${NATIVE_POSE_PACKAGE}` : `Not linked · ${NATIVE_POSE_PACKAGE}`}
        </Text>
        <Text style={styles.muted}>
          Expo Go cannot load this module. On Fold7 use USB debugging + npx expo run:android.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>Apple Vision / CoreML / ARKit</Text>
        <Text style={styles.rowValue}>Not on default path (macOS optional only)</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>Firebase</Text>
        <Text style={styles.rowValue}>
          {isFirebaseConfigured() ? 'Configured (stubs)' : 'Not configured — see .env.example'}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>Hardware</Text>
        <Text style={styles.rowValue}>IMX500 optional — src/hardware/README.md</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>Super Coach</Text>
        <Text style={styles.rowValue}>On-device phase / load / calories</Text>
        <Text style={styles.muted}>
          ComfyUI {getComfyBaseUrl() || 'not set'} · LLM {getLlmBaseUrl() ? `${getLlmModel()} @ ${getLlmBaseUrl()}` : 'local only (empty URL)'}
        </Text>
      </View>
      <Text style={styles.muted}>
        Squat 360 augments coaches. Pose numbers are heuristics — not gym-validated accuracy scores.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gym.bg, padding: 16, gap: 10 },
  title: { color: gym.text, fontSize: 24, fontWeight: '700', marginBottom: 4 },
  card: {
    backgroundColor: gym.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gym.border,
    padding: 14,
    gap: 4,
  },
  rowLabel: { color: gym.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue: { color: gym.text, fontSize: 15 },
  muted: { color: gym.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
});

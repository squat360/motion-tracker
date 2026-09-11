import { Link } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { gym } from '@/src/theme/gym';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Squat 360</Text>
      <Text style={styles.title}>Coach floor companion</Text>
      <Text style={styles.body}>
        Samsung / Android–first scaffold. MediaPipe Pose is the default analysis path. This app
        augments coaches — it does not replace trainers.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <Text style={styles.muted}>Record a set → review with overlay → assign a plan stub.</Text>
        <Text style={styles.muted}>Fold7 checklist: docs/samsung-android.md</Text>
      </View>

      <Link href="/record" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>Start recording</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gym.bg, padding: 20, gap: 12 },
  kicker: { color: gym.accent, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: gym.text, fontSize: 28, fontWeight: '700' },
  body: { color: gym.muted, fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: gym.card,
    borderColor: gym.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    marginTop: 8,
  },
  cardTitle: { color: gym.text, fontSize: 18, fontWeight: '600' },
  muted: { color: gym.muted, fontSize: 14, lineHeight: 20 },
  cta: {
    marginTop: 16,
    backgroundColor: gym.accentDim,
    borderColor: gym.accent,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: gym.accent, fontWeight: '700', fontSize: 16 },
});

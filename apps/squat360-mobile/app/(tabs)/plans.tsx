import { StyleSheet, Text, View, FlatList } from 'react-native';
import { gym } from '@/src/theme/gym';
import { MockTechniqueAnalyzer } from '@/src/ai';
import { buildRuleBasedPlan } from '@/src/plans/ruleBasedPlan';

export default function PlansScreen() {
  const analysis = new MockTechniqueAnalyzer().analyze([
    { timestampMs: 0, landmarks: [] },
  ]);
  const plan = buildRuleBasedPlan(analysis.findings);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plans</Text>
      <Text style={styles.muted}>
        Rule-based stub from technique cues. Coaches approve or edit before athletes follow anything.
      </Text>
      <FlatList
        data={plan}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.focus}>{item.focus.toUpperCase()}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.muted}>{item.detail}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gym.bg, padding: 16 },
  title: { color: gym.text, fontSize: 24, fontWeight: '700' },
  muted: { color: gym.muted, fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: gym.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gym.border,
    padding: 14,
    gap: 4,
  },
  focus: { color: gym.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  cardTitle: { color: gym.text, fontSize: 16, fontWeight: '600' },
});

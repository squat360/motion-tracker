import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView } from 'react-native';
import { gym } from '@/src/theme/gym';
import { SAMPLE_SQUAT_FRAMES } from '@/src/ai/fixtures/squatSequence';
import { LandmarkTechniqueAnalyzer } from '@/src/ai/LandmarkTechniqueAnalyzer';
import { getLastPoseSession } from '@/src/ai/poseSession';
import { listCoachHistory } from '@/src/db/database';
import {
  runAssistant,
  type AssistantBundle,
  type TrainingGoal,
} from '@/src/ai/comfyui';

const GOALS: TrainingGoal[] = ['strength', 'hypertrophy', 'conditioning'];

export default function AssistantScreen() {
  const [name, setName] = useState('Athlete');
  const [goal, setGoal] = useState<TrainingGoal>('strength');
  const [question, setQuestion] = useState('');
  const [bundle, setBundle] = useState<AssistantBundle | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = useCallback(async () => {
    setBusy(true);
    try {
      const captured = getLastPoseSession();
      const frames = captured?.frames?.length ? captured.frames : SAMPLE_SQUAT_FRAMES;
      const analysis = captured?.analysis ?? new LandmarkTechniqueAnalyzer().analyze(frames);
      const history = await listCoachHistory();
      const next = await runAssistant({
        athleteName: name.trim() || 'Athlete',
        goal,
        findings: analysis.findings,
        frames,
        queueAvatar: true,
        history,
        question,
      });
      setBundle(next);
    } finally {
      setBusy(false);
    }
  }, [name, goal, question]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32, gap: 12 }}>
      <Text style={styles.title}>Super Coach</Text>
      <Text style={styles.muted}>
        On-device phase, load, and calories from filmed history. Optional cloud LLM may rewrite the
        briefing only — it never changes the rule-engine call. Avatars queue to ComfyUI when
        EXPO_PUBLIC_COMFYUI_URL points at squat360/ComfyUI.
      </Text>

      <Text style={styles.label}>Athlete name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name"
        placeholderTextColor={gym.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Goal</Text>
      <View style={styles.row}>
        {GOALS.map((g) => (
          <Pressable
            key={g}
            onPress={() => setGoal(g)}
            style={[styles.chip, goal === g && styles.chipOn]}
          >
            <Text style={styles.chipText}>{g}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Ask Super Coach</Text>
      <TextInput
        value={question}
        onChangeText={setQuestion}
        placeholder="should I add weight / I am tired / is my depth the problem"
        placeholderTextColor={gym.muted}
        style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
        multiline
      />

      <Pressable style={styles.btn} onPress={generate} disabled={busy}>
        <Text style={styles.btnText}>{busy ? 'Building…' : 'Generate plan + briefing'}</Text>
      </Pressable>

      {bundle ? (
        <View style={{ gap: 12 }}>
          <View style={styles.card}>
            <Text style={styles.focus}>{bundle.decision.phase.toUpperCase()}</Text>
            <Text style={styles.cardTitle}>{bundle.briefing}</Text>
            <Text style={styles.muted}>
              Recovery {bundle.decision.recovery} · form {bundle.decision.trend} · load{' '}
              {bundle.decision.loadBiasKg >= 0 ? '+' : ''}
              {bundle.decision.loadBiasKg} kg · {bundle.calories} kcal
            </Text>
            <Text style={styles.muted}>{bundle.coachDetail}</Text>
          </View>

          {bundle.answer ? (
            <View style={styles.card}>
              <Text style={styles.focus}>ANSWER</Text>
              <Text style={styles.cardTitle}>{bundle.answer}</Text>
            </View>
          ) : null}

          <Text style={styles.section}>ComfyUI</Text>
          <Text style={styles.muted}>
            {bundle.comfyQueued ? 'Avatar workflow queued. ' : ''}
            {bundle.comfyDetail}
          </Text>
          <Text style={styles.muted}>Avatar prompt: {bundle.avatarPrompt}</Text>

          <Text style={styles.section}>Custom workouts</Text>
          {bundle.workouts.map((w) => (
            <View key={w.id} style={styles.card}>
              <Text style={styles.focus}>{w.day}</Text>
              <Text style={styles.cardTitle}>{w.title}</Text>
              <Text style={styles.muted}>{w.detail}</Text>
            </View>
          ))}

          <Text style={styles.section}>Food plan</Text>
          {bundle.food.map((f) => (
            <View key={f.id} style={styles.card}>
              <Text style={styles.focus}>{f.meal}</Text>
              <Text style={styles.cardTitle}>{f.title}</Text>
              <Text style={styles.muted}>{f.detail}</Text>
            </View>
          ))}

          <Text style={styles.section}>Form advice</Text>
          {bundle.formAdvice.map((f, i) => (
            <View key={`${f.code}-${i}`} style={styles.card}>
              <Text style={styles.focus}>{f.severity.toUpperCase()}</Text>
              <Text style={styles.cardTitle}>{f.message}</Text>
              {f.coachHint ? <Text style={styles.muted}>{f.coachHint}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gym.bg, padding: 16 },
  title: { color: gym.text, fontSize: 24, fontWeight: '700' },
  muted: { color: gym.muted, fontSize: 13, lineHeight: 18 },
  label: { color: gym.text, fontWeight: '600', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: gym.border,
    backgroundColor: gym.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: gym.text,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: gym.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { borderColor: gym.accent, backgroundColor: gym.accentDim },
  chipText: { color: gym.text, fontWeight: '600', fontSize: 13 },
  btn: {
    backgroundColor: gym.accentDim,
    borderColor: gym.accent,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: gym.text, fontWeight: '700' },
  section: { color: gym.accent, fontWeight: '700', fontSize: 14, marginTop: 8 },
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

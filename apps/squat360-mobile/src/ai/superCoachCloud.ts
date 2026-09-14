/**
 * Optional OpenAI-compatible briefing polish.
 * Empty EXPO_PUBLIC_LLM_URL = local only.
 * Cloud copy may rewrite briefing/answer text only — never phase, load, or calories.
 */
import Constants from 'expo-constants';
import type { CoachDecision, CoachSession, TrainingGoal } from './superCoach';
import { buildCloudLlmPayload } from './superCoach';

export type CloudPolish = {
  briefing: string;
  answer: string;
  source: 'local' | 'cloud';
  detail: string;
};

function extra(key: string): string {
  const fromExtra = (Constants.expoConfig?.extra as Record<string, string | undefined> | undefined)?.[key];
  return (fromExtra || '').trim();
}

export function getLlmBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_LLM_URL || '';
  return (fromEnv || extra('llmBaseUrl') || '').replace(/\/$/, '');
}

export function getLlmModel(): string {
  return process.env.EXPO_PUBLIC_LLM_MODEL || extra('llmModel') || 'gpt-4o-mini';
}

function getLlmApiKey(): string {
  return process.env.EXPO_PUBLIC_LLM_API_KEY || extra('llmApiKey') || '';
}

function extractJsonObject(text: string): { briefing?: unknown; answer?: unknown } | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as { briefing?: unknown; answer?: unknown };
  } catch {
    return null;
  }
}

export async function polishWithCloudLlm(options: {
  goal: TrainingGoal;
  decision: CoachDecision;
  question: string;
  history: CoachSession[];
  timeoutMs?: number;
}): Promise<CloudPolish> {
  const local: CloudPolish = {
    briefing: options.decision.briefing,
    answer: options.decision.answer,
    source: 'local',
    detail: 'On-device Super Coach (rule engine).',
  };
  const baseUrl = getLlmBaseUrl();
  if (!baseUrl) {
    return { ...local, detail: 'No LLM URL set. Empty EXPO_PUBLIC_LLM_URL = local only.' };
  }

  const packed = buildCloudLlmPayload(options.goal, options.decision, options.question, options.history);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), options.timeoutMs ?? 8000);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const key = getLlmApiKey();
    if (key) headers.Authorization = `Bearer ${key}`;
    const res = await fetch(`${baseUrl.replace(/\/v1\/chat\/completions$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        model: getLlmModel(),
        temperature: 0.2,
        messages: [
          { role: 'system', content: packed.system },
          { role: 'user', content: packed.user },
        ],
      }),
    });
    if (!res.ok) {
      return { ...local, detail: `Cloud LLM HTTP ${res.status} — kept local phase ${options.decision.phase}.` };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content || '';
    const parsed = extractJsonObject(content);
    const briefing = typeof parsed?.briefing === 'string' && parsed.briefing.trim() ? parsed.briefing.trim() : local.briefing;
    const answer = typeof parsed?.answer === 'string' ? parsed.answer.trim() : local.answer;
    return {
      briefing,
      answer,
      source: 'cloud',
      detail: `Cloud briefing only. Phase stays ${options.decision.phase}, load ${options.decision.loadBiasKg} kg.`,
    };
  } catch (err) {
    return { ...local, detail: `Cloud LLM offline (${String(err)}). Local phase ${options.decision.phase} unchanged.` };
  } finally {
    clearTimeout(t);
  }
}

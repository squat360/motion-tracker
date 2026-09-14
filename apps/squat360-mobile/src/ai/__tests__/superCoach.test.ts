import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CLOUD_LLM_SYSTEM,
  buildCloudLlmPayload,
  decideCoach,
  parseSessions,
} from '../superCoach';

test('intensify when form is fresh and climbing', () => {
  const history = parseSessions({
    sessions: [
      { reps: 5, loadKg: 80, formScore: 80, cueCodes: [] },
      { reps: 5, loadKg: 82, formScore: 82, cueCodes: [] },
      { reps: 5, loadKg: 85, formScore: 84, cueCodes: [] },
      { reps: 5, loadKg: 87, formScore: 90, cueCodes: [] },
      { reps: 5, loadKg: 90, formScore: 91, cueCodes: [] },
      { reps: 5, loadKg: 92, formScore: 92, cueCodes: [] },
    ],
  });
  const d = decideCoach('strength', 3, [], history, 'should I add weight');
  assert.equal(d.phase, 'intensify');
  assert.equal(d.loadBiasKg, 5.0);
  assert.equal(d.calorieBias, 80);
  assert.match(d.answer, /Add about 5 kg/);
  assert.match(d.briefing, /fresh/);
  assert.equal(d.priorityCue, '');
});

test('deload when volume and form drop', () => {
  const history = parseSessions({
    sessions: [
      { reps: 5, loadKg: 100, formScore: 88, cueCodes: [] },
      { reps: 5, loadKg: 70, formScore: 75, cueCodes: [] },
    ],
  });
  const d = decideCoach('strength', 3, [], history, 'I am tired');
  assert.equal(d.phase, 'deload');
  assert.equal(d.loadBiasKg, -10.0);
  assert.equal(d.calorieBias, -120);
  assert.match(d.answer.toLowerCase(), /deload/);
});

test('rebuild on persistent depth cue', () => {
  const history = parseSessions({
    sessions: [
      { reps: 5, loadKg: 80, formScore: 80, cueCodes: ['DEPTH_CHECK'] },
      { reps: 5, loadKg: 80, formScore: 81, cueCodes: ['DEPTH_CHECK'] },
    ],
  });
  const d = decideCoach('strength', 3, [], history, 'is my depth the problem');
  assert.equal(d.phase, 'rebuild');
  assert.equal(d.priorityCue, 'DEPTH_CHECK');
  assert.equal(d.loadBiasKg, -5.0);
  assert.match(d.answer, /Depth is the limiter/);
});

test('maps DEPTH_INSUFFICIENT and KNEE_VALGUS onto coach cues', () => {
  const history = parseSessions({
    sessions: [
      { reps: 5, loadKg: 80, formScore: 70, cueCodes: ['DEPTH_INSUFFICIENT'] },
      { reps: 5, load_kg: 80, formScore: 71, cues: 'DEPTH_INSUFFICIENT' },
    ],
  });
  assert.deepEqual(history[0].cueCodes, ['DEPTH_CHECK']);
  assert.deepEqual(history[1].cueCodes, ['DEPTH_CHECK']);
  const d = decideCoach('strength', 3, [], history, '');
  assert.equal(d.phase, 'rebuild');
  assert.equal(d.priorityCue, 'DEPTH_CHECK');
});

test('empty or garbage history is a no-op opening week', () => {
  assert.deepEqual(parseSessions(''), []);
  assert.deepEqual(parseSessions('not-json'), []);
  const d = decideCoach('hypertrophy', 4, [], [], '');
  assert.equal(d.phase, 'accumulate');
  assert.equal(d.answer, '');
  assert.match(d.reasoning.join(' '), /No scored history/);
});

test('cloud payload never invites the model to change the decision', () => {
  const history = parseSessions({
    sessions: [{ reps: 5, loadKg: 90, formScore: 92, cueCodes: [] }],
  });
  const d = decideCoach('strength', 3, [], history, 'should I add weight');
  const packed = buildCloudLlmPayload('strength', d, 'should I add weight', history);
  assert.match(packed.system, /Stay inside the provided JSON/);
  assert.equal(packed.system, CLOUD_LLM_SYSTEM);
  const user = JSON.parse(packed.user);
  assert.equal(user.goal, 'strength');
  assert.equal(user.question, 'should I add weight');
  assert.equal(user.decision.phase, d.phase);
  assert.equal(user.decision.loadBiasKg, d.loadBiasKg);
  assert.equal(user.history[0].formScore, 92);
});

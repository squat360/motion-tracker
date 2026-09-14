import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Wallet } from 'ethers';

import { decideCoach, parseSessions } from '../../ai/superCoach';
import {
  ATTESTATION_KIND,
  buildAttestation,
  contentId,
  formBadge,
  signAttestation,
  verifyAttestation,
} from '../attest';

function climbingHistory() {
  return parseSessions({
    sessions: [
      { reps: 5, loadKg: 80, formScore: 80, cueCodes: [] },
      { reps: 5, loadKg: 82, formScore: 82, cueCodes: [] },
      { reps: 5, loadKg: 85, formScore: 84, cueCodes: [] },
      { reps: 5, loadKg: 87, formScore: 90, cueCodes: [] },
      { reps: 5, loadKg: 90, formScore: 91, cueCodes: [] },
      { reps: 5, loadKg: 92, formScore: 92, cueCodes: [] },
    ],
  });
}

test('signed Super Coach briefing recovers the locker address', () => {
  const wallet = Wallet.createRandom();
  const decision = decideCoach('strength', 3, [], climbingHistory(), 'should I add weight');
  const att = buildAttestation({
    athlete: 'Alex',
    goal: 'strength',
    decision,
    issuedAt: '2026-09-14T18:00:00.000Z',
  });
  const signed = signAttestation(wallet, att);
  assert.equal(att.kind, ATTESTATION_KIND);
  assert.equal(att.phase, 'intensify');
  assert.equal(signed.signer, wallet.address);
  assert.match(signed.contentId, /^0x[0-9a-f]{64}$/);
  assert.equal(verifyAttestation(signed), true);
});

test('tampered briefing fails verify', () => {
  const wallet = Wallet.createRandom();
  const decision = decideCoach('strength', 3, [], climbingHistory(), '');
  const att = buildAttestation({ athlete: 'Alex', goal: 'strength', decision, issuedAt: '2026-09-14T18:00:00.000Z' });
  const signed = signAttestation(wallet, att);
  signed.attestation = { ...signed.attestation, loadBiasKg: 99 };
  assert.equal(verifyAttestation(signed), false);
});

test('form badge is mint-ready metadata, not a market listing', () => {
  const decision = decideCoach('strength', 3, [], climbingHistory(), '');
  const att = buildAttestation({ athlete: 'Alex', goal: 'strength', decision, issuedAt: '2026-09-14T18:00:00.000Z' });
  const badge = formBadge(att);
  assert.equal(badge.name, 'Squat 360 · PR window');
  assert.equal(badge.attributes.find((a) => a.trait_type === 'phase')?.value, 'intensify');
  assert.equal(contentId(att), contentId(att));
});

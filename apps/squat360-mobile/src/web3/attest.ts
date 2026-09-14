/**
 * Super Coach locker — ethers.js (awesome-web3.0 "Interface with Blockchain").
 * Offline: keccak256 content-id + EIP-191 signature. No RPC, no gas, no mint.
 * Phase / load / calories stay with the on-device rule engine.
 */
import { Wallet, keccak256, toUtf8Bytes, verifyMessage } from 'ethers';
import type { CoachDecision, TrainingGoal } from '../ai/superCoach';

export const ATTESTATION_KIND = 'squat360.superCoach.v1';

export type CoachAttestation = {
  version: 1;
  kind: typeof ATTESTATION_KIND;
  athlete: string;
  goal: TrainingGoal;
  phase: string;
  recovery: string;
  trend: string;
  priorityCue: string;
  loadBiasKg: number;
  calorieBias: number;
  briefing: string;
  issuedAt: string;
};

export type SignedAttestation = {
  attestation: CoachAttestation;
  contentId: string;
  signature: string;
  signer: string;
};

export type FormBadge = {
  name: string;
  description: string;
  attributes: { trait_type: string; value: string | number }[];
};

export function buildAttestation(options: {
  athlete: string;
  goal: TrainingGoal;
  decision: CoachDecision;
  issuedAt?: string;
}): CoachAttestation {
  return {
    version: 1,
    kind: ATTESTATION_KIND,
    athlete: options.athlete.trim() || 'Athlete',
    goal: options.goal,
    phase: options.decision.phase,
    recovery: options.decision.recovery,
    trend: options.decision.trend,
    priorityCue: options.decision.priorityCue,
    loadBiasKg: options.decision.loadBiasKg,
    calorieBias: options.decision.calorieBias,
    briefing: options.decision.briefing,
    issuedAt: options.issuedAt ?? new Date().toISOString(),
  };
}

/** Stable JSON so the same briefing always hashes the same. */
export function canonicalPayload(att: CoachAttestation): string {
  return JSON.stringify({
    version: att.version,
    kind: att.kind,
    athlete: att.athlete,
    goal: att.goal,
    phase: att.phase,
    recovery: att.recovery,
    trend: att.trend,
    priorityCue: att.priorityCue,
    loadBiasKg: att.loadBiasKg,
    calorieBias: att.calorieBias,
    briefing: att.briefing,
    issuedAt: att.issuedAt,
  });
}

export function contentId(att: CoachAttestation): string {
  return keccak256(toUtf8Bytes(canonicalPayload(att)));
}

export function signAttestation(wallet: Wallet, att: CoachAttestation): SignedAttestation {
  const payload = canonicalPayload(att);
  const signature = wallet.signMessageSync(payload);
  return {
    attestation: att,
    contentId: contentId(att),
    signature,
    signer: wallet.address,
  };
}

export function verifyAttestation(signed: SignedAttestation): boolean {
  try {
    const recovered = verifyMessage(canonicalPayload(signed.attestation), signed.signature);
    return (
      recovered.toLowerCase() === signed.signer.toLowerCase() &&
      contentId(signed.attestation) === signed.contentId
    );
  } catch {
    return false;
  }
}

/** OpenZeppelin-style ERC-721 metadata. Local / mint-ready — not listed on a market. */
export function formBadge(att: CoachAttestation): FormBadge {
  const titles: Record<string, string> = {
    intensify: 'PR window',
    rebuild: 'Technique lock',
    deload: 'Recovery week',
    accumulate: 'Volume block',
  };
  const title = titles[att.phase] ?? 'Training block';
  return {
    name: `Squat 360 · ${title}`,
    description: `${att.athlete} locked a ${att.phase} Super Coach briefing. Form ${att.trend}, recovery ${att.recovery}. Not medical advice.`,
    attributes: [
      { trait_type: 'phase', value: att.phase },
      { trait_type: 'recovery', value: att.recovery },
      { trait_type: 'trend', value: att.trend },
      { trait_type: 'goal', value: att.goal },
      { trait_type: 'loadBiasKg', value: att.loadBiasKg },
      { trait_type: 'calorieBias', value: att.calorieBias },
    ],
  };
}

export function shortAddress(address: string): string {
  if (!address || address.length < 12) return address || '—';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function shortHex(value: string): string {
  if (!value || value.length < 18) return value || '—';
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

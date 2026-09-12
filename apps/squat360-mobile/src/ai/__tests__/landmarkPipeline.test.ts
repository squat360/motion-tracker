import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LandmarkSetCounter } from '../LandmarkSetCounter';
import { LandmarkTechniqueAnalyzer } from '../LandmarkTechniqueAnalyzer';
import {
  buildShallowSquatFixture,
  buildSquatFixture,
  landmarksForKneeAngle,
} from '../fixtures/squatSequence';
import { meanKneeAngle } from '../landmarks';
import { normalizeNativeLandmarkPayload } from '../normalizeLandmarks';
import { createSetCounter, createTechniqueAnalyzer } from '../poseFactory';

test('fixture knee angle matches the requested degrees', () => {
  for (const deg of [170, 140, 110, 85]) {
    const knee = meanKneeAngle(landmarksForKneeAngle(deg));
    assert.ok(knee != null, `expected knee angle for ${deg}`);
    assert.ok(Math.abs(knee - deg) < 1.5, `knee ${knee} !~ ${deg}`);
  }
});

test('LandmarkSetCounter counts three fixture squat reps', () => {
  const frames = buildSquatFixture(3);
  const counter = new LandmarkSetCounter();
  for (const frame of frames) counter.update(frame);
  const result = counter.getResult();
  assert.equal(result.reps, 3);
  assert.equal(result.phase, 'standing');
});

test('LandmarkSetCounter stays at zero without a bottom', () => {
  const frames = buildSquatFixture(0);
  const counter = new LandmarkSetCounter();
  // standing-only frames
  for (let i = 0; i < 20; i += 1) {
    counter.update({
      timestampMs: i * 33,
      landmarks: landmarksForKneeAngle(168),
    });
  }
  assert.equal(counter.getResult().reps, 0);
  assert.equal(frames.length, 0);
});

test('LandmarkTechniqueAnalyzer flags shallow depth', () => {
  const analysis = new LandmarkTechniqueAnalyzer().analyze(buildShallowSquatFixture(2));
  const depth = analysis.findings.find((f) => f.code === 'DEPTH_CHECK');
  assert.ok(depth);
  assert.equal(depth.severity, 'cue');
});

test('LandmarkTechniqueAnalyzer reports info depth on a full squat fixture', () => {
  const analysis = new LandmarkTechniqueAnalyzer().analyze(buildSquatFixture(2));
  const depth = analysis.findings.find((f) => f.code === 'DEPTH_CHECK');
  assert.ok(depth);
  assert.equal(depth.severity, 'info');
  assert.match(analysis.summary, /landmark frame/);
});

test('normalizeNativeLandmarkPayload accepts MediaPipe arrays and wrappers', () => {
  const pts = landmarksForKneeAngle(90).map(({ name, ...rest }) => rest);
  const a = normalizeNativeLandmarkPayload(pts, 1);
  assert.ok(a);
  assert.equal(a.landmarks.length, 33);
  assert.equal(a.landmarks[23]?.name, 'left_hip');

  const b = normalizeNativeLandmarkPayload({ nativeEvent: { poseLandmarks: pts } }, 2);
  assert.ok(b);
  assert.equal(b.landmarks[0]?.name, 'nose');

  const named: Record<string, { x: number; y: number }> = {};
  for (const lm of landmarksForKneeAngle(100)) named[lm.name] = { x: lm.x, y: lm.y };
  const c = normalizeNativeLandmarkPayload(named, 3);
  assert.ok(c);
  assert.ok((c.landmarks.length ?? 0) >= 8);
});

test('normalizeNativeLandmarkPayload returns null for garbage', () => {
  assert.equal(normalizeNativeLandmarkPayload(null), null);
  assert.equal(normalizeNativeLandmarkPayload({ foo: 1 }), null);
});

test('factory uses landmark engines when native is linked or mode=landmark', () => {
  const linked = createSetCounter('auto', true);
  const forced = createSetCounter('landmark', false);
  const mock = createSetCounter('mock', true);
  assert.equal(linked.constructor.name, 'LandmarkSetCounter');
  assert.equal(forced.constructor.name, 'LandmarkSetCounter');
  assert.equal(mock.constructor.name, 'MockSetCounter');
  assert.equal(createTechniqueAnalyzer('landmark', false).constructor.name, 'LandmarkTechniqueAnalyzer');
});

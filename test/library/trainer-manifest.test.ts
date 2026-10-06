import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildTrainerManifest } from '../../src/library/build-trainer-manifest.ts';

const solution = JSON.parse(readFileSync('proof/btn-bb-srp-flop/canonical.json', 'utf8'));

test('builds a trainer entry without changing canonical strategy values', () => {
  const [entry] = buildTrainerManifest([solution]);

  assert.equal(entry.questionId, 'btn-bb-srp-qh7s2c-node0:QcQd');
  assert.equal(entry.dataSource, 'ACTUAL SOLVER');
  assert.equal(entry.availableActions[0].frequency, 0.705661);
  assert.equal(entry.availableActions[1].ev, 2.75);
  assert.equal(entry.availableActions[0].evLoss, 0.007);
  assert.equal(entry.actionHistory.length, 6);
  assert.deepEqual(entry.rangeData, []);
});

test('rejects duplicate trainer question identities', () => {
  assert.throws(() => buildTrainerManifest([solution, structuredClone(solution)]), /duplicate trainer question/u);
});

test('rejects invalid canonical input instead of registering it', () => {
  const invalid = structuredClone(solution);
  invalid.strategy[0].frequency = 0.2;
  assert.throws(() => buildTrainerManifest([invalid]), /frequencies must sum to 1/u);
});

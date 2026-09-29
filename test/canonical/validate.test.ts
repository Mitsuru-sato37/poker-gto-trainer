import assert from 'node:assert/strict';
import test from 'node:test';

import { validateCanonicalSolution } from '../../src/canonical/validate.ts';

function validSolution(): unknown {
  return {
    schemaVersion: '1.0.0',
    solutionId: 'ucsandman-postflop-btn-bb-qh7s2c-root-asjs',
    game: {
      type: 'NLHE',
      playerCount: 6,
      blinds: { small: 10, big: 20 },
      ante: 0,
      effectiveStack: 2000,
      chipUnit: 'chips',
    },
    spot: {
      positions: { inPosition: 'BTN', outOfPosition: 'BB' },
      pot: 130,
      street: 'flop',
      board: ['Qh', '7s', '2c'],
      actionHistory: [
        { street: 'preflop', actor: 'BTN', actionId: 'raise-50', kind: 'raise', amount: 50 },
        { street: 'preflop', actor: 'BB', actionId: 'call-30', kind: 'call', amount: 30 },
        { street: 'flop', actor: 'BB', actionId: 'check', kind: 'check' },
      ],
      playerToAct: 'BTN',
    },
    heroCombo: 'AsJs',
    actions: [
      { id: 'check', kind: 'check' },
      { id: 'bet-42.9', kind: 'bet', amount: 42.9, potFraction: 0.33 },
    ],
    strategy: [
      { actionId: 'check', frequency: 0.25, ev: 51.125 },
      { actionId: 'bet-42.9', frequency: 0.75, ev: 52.5 },
    ],
    bestEv: 52.5,
    provenance: {
      solver: 'ucsandman/postflop',
      solverVersion: '0.1.0',
      sourceRevision: '0123456789abcdef0123456789abcdef01234567',
      rawFormatVersion: 1,
      generatedAt: '2026-09-25T03:00:00.000Z',
      configSha256: 'a'.repeat(64),
      rawArtifactSha256: 'b'.repeat(64),
      solve: { iterations: 500, exploitabilityChips: 0.2, exploitabilityPctOfPot: 0.1538 },
    },
  };
}

test('accepts a complete canonical decision without changing numeric precision', () => {
  const value = validSolution();
  const result = validateCanonicalSolution(value);

  assert.equal(result.strategy[0].ev, 51.125);
  assert.equal(result.actions[1].amount, 42.9);
});

test('rejects frequencies that do not sum to one', () => {
  const value = validSolution() as any;
  value.strategy[1].frequency = 0.5;

  assert.throws(() => validateCanonicalSolution(value), /frequencies must sum to 1/);
});

test('rejects a hero combo that collides with the board', () => {
  const value = validSolution() as any;
  value.heroCombo = 'QhJs';

  assert.throws(() => validateCanonicalSolution(value), /heroCombo collides with board/);
});

test('rejects strategy entries whose action IDs do not align with actions', () => {
  const value = validSolution() as any;
  value.strategy.reverse();

  assert.throws(() => validateCanonicalSolution(value), /strategy actionId at index 0/);
});

test('rejects missing per-action EV instead of inferring it', () => {
  const value = validSolution() as any;
  delete value.strategy[0].ev;

  assert.throws(() => validateCanonicalSolution(value), /strategy\[0\]\.ev/);
});

test('rejects unsupported canonical schema versions', () => {
  const value = validSolution() as any;
  value.schemaVersion = '2.0.0';

  assert.throws(() => validateCanonicalSolution(value), /unsupported schemaVersion/);
});

test('rejects a best EV inconsistent with action EVs', () => {
  const value = validSolution() as any;
  value.bestEv = 99;

  assert.throws(() => validateCanonicalSolution(value), /bestEv must equal maximum action EV/);
});

test('accepts an explicitly unknown browser revision when execution and EV precision are recorded', () => {
  const value = validSolution() as any;
  value.provenance.sourceRevision = null;
  value.provenance.execution = {
    kind: 'official-hosted-workbench',
    url: 'https://postflop-workbench.vercel.app/',
  };
  value.provenance.actionEv = {
    source: 'official-workbench-inspector',
    precision: 0.01,
  };

  const result = validateCanonicalSolution(value);
  assert.equal(result.provenance.sourceRevision, null);
  assert.equal(result.provenance.actionEv?.precision, 0.01);
});

test('rejects nested properties forbidden by the canonical schema', () => {
  const value = validSolution() as any;
  value.game.unexpected = true;

  assert.throws(() => validateCanonicalSolution(value), /solution\.game\.unexpected is not allowed/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { adaptPostflopDecision } from '../../src/adapters/postflop.ts';

const fixtureUrl = new URL('../fixtures/postflop-decision-v1.json', import.meta.url);

function rawFixture(): any {
  return JSON.parse(readFileSync(fixtureUrl, 'utf8'));
}

function context() {
  return {
    solutionId: 'ucsandman-postflop-btn-bb-qh7s2c-root-asjs',
    game: {
      type: 'NLHE' as const,
      playerCount: 6,
      blinds: { small: 10, big: 20 },
      ante: 0,
      effectiveStack: 2000,
      chipUnit: 'chips' as const,
    },
    spot: {
      positions: { inPosition: 'BTN', outOfPosition: 'BB' },
      pot: 130,
      street: 'flop' as const,
      board: ['Qh', '7s', '2c'],
      actionHistory: [
        { street: 'preflop' as const, actor: 'BTN', actionId: 'raise-50', kind: 'raise' as const, amount: 50 },
        { street: 'preflop' as const, actor: 'BB', actionId: 'call-30', kind: 'call' as const, amount: 30 },
        { street: 'flop' as const, actor: 'BB', actionId: 'check', kind: 'check' as const },
      ],
      playerToAct: 'BTN',
    },
    heroCombo: 'AsJs',
    sourceNode: 1,
    generatedAt: '2026-09-25T03:00:00.000Z',
    configSha256: 'a'.repeat(64),
    rawArtifactSha256: 'b'.repeat(64),
  };
}

test('maps solver actions by source ID even when combo vectors are reordered', () => {
  const solution = adaptPostflopDecision(rawFixture(), context());

  assert.deepEqual(solution.actions.map(({ id }) => id), ['check', 'bet-42.9']);
  assert.deepEqual(solution.strategy, [
    { actionId: 'check', frequency: 0.25, ev: 51.125 },
    { actionId: 'bet-42.9', frequency: 0.75, ev: 52.5 },
  ]);
  assert.equal(solution.bestEv, 52.5);
});

test('rejects raw decisions with missing action EVs', () => {
  const raw = rawFixture();
  delete raw.decision.combos[0].actions[0].ev;

  assert.throws(() => adaptPostflopDecision(raw, context()), /combo AsJs action a1 is missing ev/);
});

test('rejects unsupported raw format versions', () => {
  const raw = rawFixture();
  raw.format_version = 2;

  assert.throws(() => adaptPostflopDecision(raw, context()), /unsupported postflop decision format_version: 2/);
});

test('rejects a combo vector that omits an available action', () => {
  const raw = rawFixture();
  raw.decision.combos[0].actions.pop();

  assert.throws(() => adaptPostflopDecision(raw, context()), /combo AsJs must contain exactly 2 actions/);
});

test('rejects a raw decision from a different solver node', () => {
  const raw = rawFixture();
  raw.decision.node = 999;

  assert.throws(() => adaptPostflopDecision(raw, context()), /raw decision node 999 does not match expected node 1/);
});

test('rejects a raw decision whose acting side disagrees with playerToAct', () => {
  const raw = rawFixture();
  raw.decision.player = 'OOP';

  assert.throws(() => adaptPostflopDecision(raw, context()), /raw decision player OOP maps to BB, not playerToAct BTN/);
});

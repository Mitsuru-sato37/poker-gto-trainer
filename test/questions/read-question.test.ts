import assert from 'node:assert/strict';
import test from 'node:test';

import { adaptPostflopDecision } from '../../src/adapters/postflop.ts';
import { readTrainerQuestion } from '../../src/questions/read-question.ts';
import { readFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync(new URL('../fixtures/postflop-decision-v1.json', import.meta.url), 'utf8'));

const solution = adaptPostflopDecision(raw, {
  solutionId: 'question-1',
  game: { type: 'NLHE', playerCount: 6, blinds: { small: 10, big: 20 }, ante: 0, effectiveStack: 2000, chipUnit: 'chips' },
  spot: {
    positions: { inPosition: 'BTN', outOfPosition: 'BB' }, pot: 130, street: 'flop', board: ['Qh', '7s', '2c'], playerToAct: 'BTN',
    actionHistory: [
      { street: 'preflop', actor: 'BTN', actionId: 'raise-50', kind: 'raise', amount: 50 },
      { street: 'preflop', actor: 'BB', actionId: 'call-30', kind: 'call', amount: 30 },
      { street: 'flop', actor: 'BB', actionId: 'check', kind: 'check' },
    ],
  },
  heroCombo: 'AsJs', sourceNode: 1, generatedAt: '2026-09-25T03:00:00.000Z', configSha256: 'a'.repeat(64), rawArtifactSha256: 'b'.repeat(64),
});

test('reads a trainer question with per-action EV loss from canonical data', () => {
  const question = readTrainerQuestion(solution);

  assert.equal(question.questionId, 'question-1:AsJs');
  assert.deepEqual(question.board, ['Qh', '7s', '2c']);
  assert.deepEqual(question.actions, [
    { id: 'check', kind: 'check', frequency: 0.25, ev: 51.125, evLoss: 1.375 },
    { id: 'bet-42.9', kind: 'bet', amount: 42.9, potFraction: 0.33, frequency: 0.75, ev: 52.5, evLoss: 0 },
  ]);
});

test('does not expose binary floating-point noise in EV loss', () => {
  const measured = structuredClone(solution);
  measured.strategy[0].ev = 54.86;
  measured.strategy[1].ev = 55;
  measured.bestEv = 55;

  const question = readTrainerQuestion(measured);

  assert.equal(question.actions[0].evLoss, 0.14);
});

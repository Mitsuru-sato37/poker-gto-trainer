import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLibraryIndex } from '../../src/library/index.ts';

function solution(id: string, combo: string, street = 'flop'): any {
  const board = street === 'turn' ? ['Qh', '7s', '2c', '2d'] : ['Qh', '7s', '2c'];
  return {
    schemaVersion: '1.0.0',
    solutionId: id,
    game: { type: 'NLHE', playerCount: 6, blinds: { small: 10, big: 20 }, ante: 0, effectiveStack: 2000, chipUnit: 'chips' },
    spot: { positions: { inPosition: 'BTN', outOfPosition: 'BB' }, pot: 110, street, board, actionHistory: [], playerToAct: 'BB' },
    heroCombo: combo,
    actions: [{ id: 'check', kind: 'check' }, { id: 'bet-36.4', kind: 'bet', amount: 36.4, potFraction: 0.33 }],
    strategy: [{ actionId: 'check', frequency: 0.7, ev: 54 }, { actionId: 'bet-36.4', frequency: 0.3, ev: 55 }],
    bestEv: 55,
    provenance: { solver: 'test', solverVersion: '1', sourceRevision: null, rawFormatVersion: 1, generatedAt: '2026-09-29T00:00:00.000Z', configSha256: 'a'.repeat(64), rawArtifactSha256: 'b'.repeat(64), execution: { kind: 'test' }, solve: { iterations: 1, exploitabilityChips: 0, exploitabilityPctOfPot: 0 } },
  };
}

test('builds a deterministic library index from validated canonical solutions', () => {
  const index = buildLibraryIndex([
    { relativePath: 'b.json', value: solution('solution-b', 'AsJs', 'turn') },
    { relativePath: 'a.json', value: solution('solution-a', 'QcQd') },
  ]);

  assert.deepEqual(index.entries.map((entry) => entry.questionId), ['solution-a:QcQd', 'solution-b:AsJs']);
  assert.equal(index.entries[1].relativePath, 'b.json');
});

test('rejects duplicate trainer question identities', () => {
  assert.throws(() => buildLibraryIndex([
    { relativePath: 'a.json', value: solution('solution-a', 'QcQd') },
    { relativePath: 'b.json', value: solution('solution-a', 'QcQd') },
  ]), /duplicate library question/);
});

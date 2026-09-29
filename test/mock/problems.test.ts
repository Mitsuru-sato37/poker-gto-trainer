import assert from 'node:assert/strict';
import test from 'node:test';

import { findProblem, PROBLEMS } from '../../mock/data/problems.js';

test('every dummy problem marks an EV-maximal action as BEST', () => {
  for (const problem of PROBLEMS.filter((entry) => !entry.dataSource)) {
    const bestEv = Math.max(...problem.availableActions.map((action) => action.ev));
    const bestActions = problem.availableActions.filter((action) => action.evaluation === 'BEST');
    assert.ok(bestActions.length > 0, `${problem.id} must have a BEST action`);
    assert.ok(bestActions.every((action) => action.ev === bestEv), `${problem.id} BEST action must have max EV`);
  }
});

test('postflop spots facing a bet include fold, call, and raise choices', () => {
  for (const problem of PROBLEMS.filter((entry) => entry.street !== 'preflop' && entry.actionHistory.at(-1)?.actor === 'BTN')) {
    assert.equal(problem.actionHistory.at(-1)?.actor, 'BTN', `${problem.id} should face BTN action`);
    assert.deepEqual(problem.availableActions.map((action) => action.id), ['fold', 'call', 'raise'], `${problem.id} choices should match facing a bet`);
  }
});

test('includes the verified solver proof question without changing its strategy values', () => {
  const problem = findProblem('solver-proof-btn-bb-qh7s2c-qcqd');
  assert.ok(problem);
  assert.equal(problem.dataSource, 'ACTUAL SOLVER PROOF');
  assert.equal(problem.heroHand, 'Q♣Q♦');
  assert.deepEqual(problem.board, ['Q♥', '7♠', '2♣']);
  assert.deepEqual(problem.availableActions.map((action) => [action.id, action.frequency, action.ev]), [
    ['check', 0.705661, 2.743],
    ['bet-36.4', 0.294339, 2.75],
  ]);
  assert.equal(problem.actionHistory.at(-1)?.actor, 'BB');
  assert.equal(problem.actionHistory.at(-1)?.label, 'BB calls 1.5 BB');
});

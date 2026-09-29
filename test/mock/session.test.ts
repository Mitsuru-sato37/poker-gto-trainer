import assert from 'node:assert/strict';
import test from 'node:test';

import { PLAY_THROUGH_HANDS, PROBLEMS, selectProblems } from '../../mock/data/problems.js';
import {
  SESSION_STORAGE_KEY,
  advanceSession,
  createReviewSession,
  createSession,
  getCurrentAnswer,
  getCurrentItem,
  recordAnswer,
  restoreSession,
  serializeSession,
} from '../../mock/session.js';

const catalog = { problems: PROBLEMS, hands: PLAY_THROUGH_HANDS };
const now = '2026-09-29T00:00:00.000Z';

test('selects ten unique questions for each normal session mode', () => {
  for (const type of ['RANDOM', 'PREFLOP', 'FLOP+']) {
    const selected = selectProblems(type, PROBLEMS);
    assert.equal(selected.length, 10);
    assert.equal(new Set(selected.map((problem) => problem.id)).size, 10);
  }
});

test('creates a ten-question session with problem references', () => {
  const session = createSession('RANDOM', catalog, now);

  assert.equal(session.type, 'RANDOM');
  assert.equal(session.items.length, 10);
  assert.equal(session.currentIndex, 0);
  assert.equal(session.status, 'in-progress');
  assert.ok(session.items.every((item) => item.kind === 'problem' && typeof item.problemId === 'string'));
});

test('creates a PLAY THROUGH session with hand and decision references', () => {
  const session = createSession('PLAY_THROUGH', catalog, now);

  assert.equal(session.type, 'PLAY_THROUGH');
  assert.equal(session.handCount, 3);
  assert.ok(session.items.length > 3);
  assert.ok(session.items.every((item) => item.kind === 'decision' && typeof item.handId === 'string'));
  assert.deepEqual(getCurrentItem(session, catalog).hand.id, PLAY_THROUGH_HANDS[0].id);
});

test('keeps the same hero hand across decisions in each PLAY THROUGH hand', () => {
  for (const hand of PLAY_THROUGH_HANDS) {
    const session = createSession('PLAY_THROUGH', catalog, now);
    const heroHands = new Set(session.items.filter((item) => item.handId === hand.id).map((item) => getCurrentItem({ ...session, items: [item], currentIndex: 0 }, catalog).problem.heroHand));
    assert.equal(heroHands.size, 1);
  }
});

test('records one answer with the required history fields and rejects a duplicate', () => {
  const session = createSession('RANDOM', catalog, now);
  const current = getCurrentItem(session, catalog).problem;
  const action = current.availableActions[0];
  const answered = recordAnswer(session, {
    problemId: current.id,
    sessionId: session.id,
    selectedAction: action.id,
    solverFrequency: action.frequency,
    selectedActionEv: action.ev,
    bestActionEv: Math.max(...current.availableActions.map((entry) => entry.ev)),
    evLoss: action.evLoss,
    evaluation: action.evaluation,
    isFirstAttempt: true,
    answeredAt: '2026-09-29T00:00:01.000Z',
  }, '2026-09-29T00:00:01.000Z');

  assert.equal(answered.answers.length, 1);
  assert.equal(answered.currentIndex, 0);
  assert.deepEqual(getCurrentAnswer(answered), answered.answers[0]);
  assert.throws(() => recordAnswer(answered, { ...answered.answers[0] }, '2026-09-29T00:00:02.000Z'), /already answered/);
});

test('returns no current answer before a question is submitted', () => {
  assert.equal(getCurrentAnswer(createSession('RANDOM', catalog, now)), null);
});

test('advances to the next item and completes after the final item', () => {
  let session = createSession('RANDOM', catalog, now);
  session = { ...session, currentIndex: 9 };
  const advanced = advanceSession(session, '2026-09-29T00:00:03.000Z');

  assert.equal(advanced.status, 'complete');
  assert.equal(advanced.currentIndex, 9);
});

test('terminal PLAY THROUGH decisions skip remaining decisions in the same hand', () => {
  const earlyTerminalCatalog = {
    problems: PROBLEMS,
    hands: [
      { id: 'early-terminal', decisions: [{ problemId: PROBLEMS[0].id, terminal: true }, { problemId: PROBLEMS[1].id, terminal: false }] },
      { id: 'next-hand', decisions: [{ problemId: PROBLEMS[2].id, terminal: false }] },
    ],
  };
  const session = createSession('PLAY_THROUGH', earlyTerminalCatalog, now);
  const advanced = advanceSession(session, now);

  assert.equal(advanced.currentIndex, 2);
  assert.equal(getCurrentItem(advanced, earlyTerminalCatalog).hand.id, 'next-hand');
});

test('a fold answer also ends the current PLAY THROUGH hand', () => {
  const earlyFoldCatalog = {
    problems: PROBLEMS,
    hands: [
      { id: 'early-fold', decisions: [{ problemId: PROBLEMS[0].id, terminal: false }, { problemId: PROBLEMS[1].id, terminal: false }] },
      { id: 'next-hand', decisions: [{ problemId: PROBLEMS[2].id, terminal: false }] },
    ],
  };
  let session = createSession('PLAY_THROUGH', earlyFoldCatalog, now);
  session = recordAnswer(session, { sessionId: session.id, problemId: PROBLEMS[0].id, selectedAction: 'fold', endsHand: true }, now);
  const advanced = advanceSession(session, now);

  assert.equal(advanced.currentIndex, 2);
});

test('serializes and restores only compatible session state', () => {
  const session = createSession('RANDOM', catalog, now);
  const restored = restoreSession(serializeSession(session));

  assert.deepEqual(restored, session);
  assert.equal(restoreSession('{"version":999}'), null);
  const malformedItems = JSON.parse(serializeSession(session));
  malformedItems.session.items = [null];
  assert.equal(restoreSession(JSON.stringify(malformedItems)), null);
  assert.equal(SESSION_STORAGE_KEY, 'poker-gto-trainer.mock-session.v1');
});

test('creates a review session from accumulated mistakes that still exist in the catalog', () => {
  const session = createReviewSession([
    { problemId: PROBLEMS[0].id, evaluation: 'MISTAKE' },
    { problemId: 'missing', evaluation: 'MISTAKE' },
    { problemId: PROBLEMS[1].id, evaluation: 'GOOD' },
  ], catalog);
  assert.equal(session?.type, 'REVIEW');
  assert.deepEqual(session?.items.map((item) => item.problemId), [PROBLEMS[0].id]);
});

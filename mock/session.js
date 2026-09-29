import { findProblem, selectProblems } from './data/problems.js';

export const SESSION_STORAGE_KEY = 'poker-gto-trainer.mock-session.v1';
const SESSION_VERSION = 1;

const MODE_LABELS = {
  RANDOM: 'ランダム · 10問',
  PREFLOP: 'プリフロップ · 10問',
  'FLOP+': 'フロップ+ · 10問',
  PLAY_THROUGH: 'ハンドを通して練習 · 3ハンド',
  REVIEW: 'ミスを復習',
};

function normalItems(type, catalog) {
  return selectProblems(type, catalog.problems).map((problem) => ({
    kind: 'problem',
    problemId: problem.id,
  }));
}

function playThroughItems(catalog) {
  return catalog.hands.flatMap((hand) => hand.decisions.map((decision, decisionIndex) => ({
    kind: 'decision',
    handId: hand.id,
    decisionIndex,
    problemId: decision.problemId,
    ...(decision.heroHand ? { heroHand: decision.heroHand } : {}),
    terminal: Boolean(decision.terminal),
  })));
}

export function createSession(type, catalog, now = new Date().toISOString()) {
  if (!MODE_LABELS[type]) throw new Error(`unsupported session type: ${type}`);
  const items = type === 'PLAY_THROUGH' ? playThroughItems(catalog) : normalItems(type, catalog);
  const session = {
    version: SESSION_VERSION,
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    modeLabel: MODE_LABELS[type],
    items,
    currentIndex: 0,
    answers: [],
    startedAt: now,
    updatedAt: now,
    status: 'in-progress',
  };
  if (type === 'PLAY_THROUGH') {
    session.handCount = catalog.hands.length;
    session.decisionCount = items.length;
  }
  return session;
}

export function createReviewSession(history, catalog, now = new Date().toISOString()) {
  const items = history
    .filter((entry) => entry.evaluation === 'MISTAKE' && catalog.problems.some((problem) => problem.id === entry.problemId))
    .map((entry) => ({ kind: 'problem', problemId: entry.problemId }));
  if (items.length === 0) return null;
  return {
    version: SESSION_VERSION,
    id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'REVIEW',
    modeLabel: MODE_LABELS.REVIEW,
    items,
    currentIndex: 0,
    answers: [],
    startedAt: now,
    updatedAt: now,
    status: 'in-progress',
  };
}

export function getCurrentItem(session, catalog) {
  const item = session.items[session.currentIndex];
  if (!item) throw new Error('session has no current item');
  const problem = findProblem(item.problemId, catalog.problems);
  if (!problem) throw new Error(`problem not found: ${item.problemId}`);
  const displayedProblem = item.heroHand ? { ...problem, heroHand: item.heroHand } : problem;
  if (item.kind === 'problem') return { item, problem: displayedProblem };
  const hand = catalog.hands.find((entry) => entry.id === item.handId);
  if (!hand) throw new Error(`hand not found: ${item.handId}`);
  return { item, problem: displayedProblem, hand, decision: hand.decisions[item.decisionIndex] };
}

export function getCurrentAnswer(session) {
  return session.answers.find((entry) => entry.itemIndex === session.currentIndex) ?? null;
}

export function recordAnswer(session, answer, now = new Date().toISOString()) {
  if (session.status !== 'in-progress') throw new Error('session is already complete');
  const current = session.items[session.currentIndex];
  if (!current || current.problemId !== answer.problemId || session.id !== answer.sessionId) {
    throw new Error('answer does not match current session item');
  }
  if (session.answers.some((entry) => entry.itemIndex === session.currentIndex)) {
    throw new Error('current item is already answered');
  }
  return {
    ...session,
    updatedAt: now,
    answers: [...session.answers, { ...answer, itemIndex: session.currentIndex }],
  };
}

export function advanceSession(session, now = new Date().toISOString()) {
  if (session.status !== 'in-progress') return session;
  const current = session.items[session.currentIndex];
  let nextIndex = session.currentIndex + 1;
  const currentAnswer = getCurrentAnswer(session);
  if (session.type === 'PLAY_THROUGH' && (current?.terminal || currentAnswer?.endsHand)) {
    while (nextIndex < session.items.length && session.items[nextIndex].handId === current.handId) nextIndex += 1;
  }
  const isLast = nextIndex >= session.items.length;
  return {
    ...session,
    currentIndex: isLast ? session.currentIndex : nextIndex,
    status: isLast ? 'complete' : 'in-progress',
    updatedAt: now,
  };
}

export function serializeSession(session) {
  return JSON.stringify({ version: SESSION_VERSION, session });
}

export function restoreSession(raw) {
  try {
    const parsed = JSON.parse(raw);
    const session = parsed?.session;
    if (parsed?.version !== SESSION_VERSION || !session || session.version !== SESSION_VERSION) return null;
    if (session.status !== 'in-progress' || !Array.isArray(session.items) || !Array.isArray(session.answers)) return null;
    if (!Number.isInteger(session.currentIndex) || session.currentIndex < 0 || session.currentIndex >= session.items.length) return null;
    if (!session.id || !session.type || !session.modeLabel || session.items.length === 0) return null;
    if (!session.items.every((item) => item && typeof item === 'object' && typeof item.problemId === 'string' && (item.kind === 'problem' || (item.kind === 'decision' && typeof item.handId === 'string' && Number.isInteger(item.decisionIndex) && item.decisionIndex >= 0)))) return null;
    if (!session.answers.every((answer) => answer && typeof answer === 'object' && Number.isInteger(answer.itemIndex) && answer.itemIndex >= 0 && typeof answer.problemId === 'string' && typeof answer.sessionId === 'string' && typeof answer.selectedAction === 'string')) return null;
    return session;
  } catch {
    return null;
  }
}

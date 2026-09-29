import { VERIFIED_SOLVER_PROBLEM } from './production.js';

const ACTIONS = {
  fold: { id: 'fold', label: 'FOLD', evaluation: 'MISTAKE' },
  call: { id: 'call', label: 'CALL', evaluation: 'GOOD' },
  raise: { id: 'raise', label: 'RAISE', evaluation: 'BEST' },
  check: { id: 'check', label: 'CHECK', evaluation: 'BEST' },
};

function action(base, overrides = {}) {
  return { ...base, frequency: 0, ev: 0, evLoss: 0, ...overrides };
}

function makeProblem(index, street, board, heroHand, pot, actions, whyText) {
  const preflopHistory = [
    { actor: 'UTG', label: 'UTG folds', street: 'preflop' },
    { actor: 'HJ', label: 'HJ folds', street: 'preflop' },
    { actor: 'CO', label: 'CO folds', street: 'preflop' },
    { actor: 'BTN', label: 'BTN raises 2.5 BB', street: 'preflop' },
    { actor: 'SB', label: 'SB folds', street: 'preflop' },
  ];
  return {
    id: `mock-${street}-${String(index).padStart(2, '0')}`,
    street,
    heroPosition: 'BB',
    villainPosition: 'BTN',
    potType: 'SRP',
    stackSize: 100,
    board,
    heroHand,
    actionHistory: street === 'preflop'
      ? preflopHistory
      : [...preflopHistory, { actor: 'BB', label: 'BB calls 1.5 BB', street: 'preflop' }, { actor: 'BTN', label: 'BTN bets 1.8 BB', street }],
    potSize: pot,
    availableActions: actions,
    whyText,
    rangeData: [
      ['A♠K♠', 'A♠Q♠', 'A♠J♠', 'K♠Q♠'],
      ['Q♠J♠', heroHand, 'J♠T♠', 'T♠9♠'],
      ['9♠8♠', '8♠7♠', '7♠6♠', '6♠5♠'],
    ],
  };
}

const preflopWhy = 'このレンジでは、強いハンドをRaiseに残しながら、Callの組み合わせも広く保ちます。';
const postflopWhy = 'ボードとレンジのぶつかり方を見ながら、最もEVを失わないアクションを選びます。';

const PREFLOP = Array.from({ length: 10 }, (_, index) => makeProblem(
  index + 1,
  'preflop',
  [],
  ['A♠K♠', 'Q♠Q♦', 'A♥J♥', 'K♣Q♣', 'J♠T♠'][index % 5],
  5.5,
  [
    action(ACTIONS.fold, { frequency: 0.08, ev: 2.1, evLoss: 1.2 }),
    action(ACTIONS.call, { frequency: 0.42, ev: 3.2, evLoss: 0.1, label: 'CALL 1.5 BB', amount: 1.5, potPercentage: 27 }),
    action(ACTIONS.raise, { frequency: 0.5, ev: 3.3, evLoss: 0, label: 'RAISE 7.5 BB', amount: 7.5, potPercentage: 136 }),
  ],
  preflopWhy,
));

const POSTFLOP = Array.from({ length: 10 }, (_, index) => {
  const street = ['flop', 'flop', 'flop', 'turn', 'turn', 'turn', 'river', 'river', 'flop', 'turn'][index];
  const boards = {
    flop: ['A♥ 9♣ 4♦', 'Q♥ 7♠ 2♣', 'K♦ 8♦ 3♣'],
    turn: ['A♥ 9♣ 4♦ 2♠', 'Q♥ 7♠ 2♣ 6♥', 'K♦ 8♦ 3♣ J♠'],
    river: ['A♥ 9♣ 4♦ 2♠ 7♥', 'Q♥ 7♠ 2♣ 6♥ K♣', 'K♦ 8♦ 3♣ J♠ 2♥'],
  };
  const callIsBest = index % 3 === 0;
  const actions = [
    action(ACTIONS.fold, { frequency: callIsBest ? 0.12 : 0.08, ev: 4.05, evLoss: callIsBest ? 0.65 : 0.45 }),
    action(ACTIONS.call, { frequency: callIsBest ? 0.68 : 0.32, ev: callIsBest ? 4.7 : 4.28, evLoss: callIsBest ? 0 : 0.22, evaluation: callIsBest ? 'BEST' : 'GOOD', label: 'CALL 1.8 BB', amount: 1.8, potPercentage: 33 }),
    action(ACTIONS.raise, { frequency: callIsBest ? 0.2 : 0.6, ev: callIsBest ? 4.52 : 4.5, evLoss: callIsBest ? 0.18 : 0, evaluation: callIsBest ? 'GOOD' : 'BEST', label: 'RAISE 5.5 BB', amount: 5.5, potPercentage: 100 }),
  ];
  return makeProblem(
    index + 11,
    street,
    boards[street][index % boards[street].length].split(' '),
    ['A♠7♠', 'Q♣Q♦', 'K♠J♠', 'T♠9♠'][index % 4],
    street === 'flop' ? 5.5 : 11,
    actions,
    postflopWhy,
  );
});

export const PROBLEMS = [...PREFLOP, VERIFIED_SOLVER_PROBLEM, ...POSTFLOP];

export const PLAY_THROUGH_HANDS = [
  {
    id: 'hand-01',
    label: 'BTN vs BB · Hand 01',
    decisions: [
      { problemId: PREFLOP[0].id, terminal: false },
      { problemId: POSTFLOP[0].id, heroHand: 'A♠K♠', terminal: false },
      { problemId: POSTFLOP[3].id, heroHand: 'A♠K♠', terminal: true },
    ],
  },
  {
    id: 'hand-02',
    label: 'BTN vs BB · Hand 02',
    decisions: [
      { problemId: PREFLOP[1].id, terminal: false },
      { problemId: POSTFLOP[1].id, heroHand: 'Q♠Q♦', terminal: false },
      { problemId: POSTFLOP[6].id, heroHand: 'Q♠Q♦', terminal: true },
    ],
  },
  {
    id: 'hand-03',
    label: 'BTN vs BB · Hand 03',
    decisions: [
      { problemId: PREFLOP[2].id, terminal: false },
      { problemId: POSTFLOP[2].id, heroHand: 'A♥J♥', terminal: false },
      { problemId: POSTFLOP[7].id, heroHand: 'A♥J♥', terminal: true },
    ],
  },
];

export function selectProblems(type, problems = PROBLEMS) {
  const filtered = type === 'PREFLOP'
    ? problems.filter((problem) => problem.street === 'preflop')
    : type === 'FLOP+'
      ? problems.filter((problem) => problem.street !== 'preflop')
      : problems;
  if (filtered.length < 10) throw new Error(`${type} requires at least ten unique problems`);
  const shuffled = [...filtered];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled.slice(0, 10);
}

export function findProblem(problemId, problems = PROBLEMS) {
  return problems.find((problem) => problem.id === problemId) ?? null;
}

const proofActionHistory = [
  { actor: 'UTG', label: 'UTG folds', street: 'preflop' },
  { actor: 'HJ', label: 'HJ folds', street: 'preflop' },
  { actor: 'CO', label: 'CO folds', street: 'preflop' },
  { actor: 'BTN', label: 'BTN raises 2.5 BB', street: 'preflop' },
  { actor: 'SB', label: 'SB folds', street: 'preflop' },
  { actor: 'BB', label: 'BB calls 1.5 BB', street: 'preflop' },
];

export const VERIFIED_SOLVER_PROBLEM = {
  id: 'solver-proof-btn-bb-qh7s2c-qcqd',
  dataSource: 'ACTUAL SOLVER PROOF',
  solutionId: 'btn-bb-srp-qh7s2c-node0',
  street: 'flop',
  heroPosition: 'BB',
  villainPosition: 'BTN',
  potType: 'SRP',
  stackSize: 100,
  board: ['Q♥', '7♠', '2♣'],
  heroHand: 'Q♣Q♦',
  potSize: 5.5,
  actionHistory: proofActionHistory,
  availableActions: [
    { id: 'check', label: 'CHECK', frequency: 0.705661, ev: 2.743, evLoss: 0.007, evaluation: 'BEST' },
    { id: 'bet-36.4', label: 'BET 1.82 BB', frequency: 0.294339, ev: 2.75, evLoss: 0, evaluation: 'GOOD', amount: 1.82, potPercentage: 33 },
  ],
  whyText: 'このノードは実Solverの検証済み出力です。Checkと33% pot Betの混合戦略として表示しています。',
  rangeData: [
    ['Q♣Q♦', 'Q♠Q♦', 'A♠Q♠', 'K♠Q♠'],
    ['Q♥J♥', 'J♠J♦', 'A♣Q♣', 'K♣J♣'],
    ['A♠K♠', 'A♠J♠', 'K♠J♠', 'J♠T♠'],
  ],
};

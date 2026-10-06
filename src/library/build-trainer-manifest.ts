import { validateCanonicalSolution } from '../canonical/validate.ts';
import type { ActionKind, CanonicalSolution } from '../canonical/types.ts';

export interface TrainerManifestAction {
  id: string;
  kind: ActionKind;
  label: string;
  amount?: number;
  potPercentage?: number;
  frequency: number;
  ev: number;
  evLoss: number;
  evaluation: 'BEST' | 'GOOD' | 'MISTAKE';
}

export interface TrainerManifestEntry {
  questionId: string;
  solutionId: string;
  dataSource: 'ACTUAL SOLVER';
  heroHand: string;
  heroPosition: string;
  villainPosition: string;
  potType: 'SRP';
  stackSize: number;
  board: string[];
  potSize: number;
  street: CanonicalSolution['spot']['street'];
  actionHistory: CanonicalSolution['spot']['actionHistory'];
  availableActions: TrainerManifestAction[];
  whyText: string;
  rangeData: [];
  provenance: CanonicalSolution['provenance'];
}

function actionLabel(action: CanonicalSolution['actions'][number], bigBlind: number): string {
  const label = action.kind.toUpperCase();
  if (action.amount === undefined) return label;
  const amountBb = displayBb(action.amount, bigBlind);
  return `${label} ${amountBb} BB`;
}

function actionEvaluation(frequency: number, bestFrequency: number): 'BEST' | 'GOOD' | 'MISTAKE' {
  if (frequency === 0) return 'MISTAKE';
  return frequency === bestFrequency ? 'BEST' : 'GOOD';
}

function displayBb(value: number, bigBlind: number): number {
  return Number((value / bigBlind).toFixed(12));
}

function toEntry(value: unknown): TrainerManifestEntry {
  const solution = validateCanonicalSolution(value);
  const bigBlind = solution.game.blinds.big;
  if (bigBlind <= 0) throw new RangeError('trainer manifest requires a positive big blind');
  const bestFrequency = Math.max(...solution.strategy.map((item) => item.frequency));
  const availableActions = solution.actions.map((action, index) => {
    const strategy = solution.strategy[index];
    return {
      id: action.id,
      kind: action.kind,
      label: actionLabel(action, bigBlind),
      ...(action.amount === undefined ? {} : { amount: displayBb(action.amount, bigBlind) }),
      ...(action.potFraction === undefined ? {} : { potPercentage: displayBb(action.potFraction * 100, 1) }),
      frequency: strategy.frequency,
      ev: displayBb(strategy.ev, bigBlind),
      evLoss: displayBb(solution.bestEv - strategy.ev, bigBlind),
      evaluation: actionEvaluation(strategy.frequency, bestFrequency),
    };
  });
  return {
    questionId: `${solution.solutionId}:${solution.heroCombo}`,
    solutionId: solution.solutionId,
    dataSource: 'ACTUAL SOLVER',
    heroHand: solution.heroCombo,
    heroPosition: solution.spot.playerToAct,
    villainPosition: solution.spot.playerToAct === solution.spot.positions.outOfPosition
      ? solution.spot.positions.inPosition
      : solution.spot.positions.outOfPosition,
    potType: 'SRP',
    stackSize: displayBb(solution.game.effectiveStack, bigBlind),
    board: [...solution.spot.board],
    potSize: displayBb(solution.spot.pot, bigBlind),
    street: solution.spot.street,
    actionHistory: solution.spot.actionHistory.map((entry) => ({ ...entry })),
    availableActions,
    whyText: '実Solverの検証済み出力です。表示されている頻度とEVは、選択したコンボのSolver結果をそのまま使っています。',
    rangeData: [],
    provenance: solution.provenance,
  };
}

export function buildTrainerManifest(values: unknown[]): TrainerManifestEntry[] {
  const entries = values.map(toEntry).sort((left, right) => left.questionId.localeCompare(right.questionId));
  const identities = new Set<string>();
  for (const entry of entries) {
    if (identities.has(entry.questionId)) throw new Error(`duplicate trainer question: ${entry.questionId}`);
    identities.add(entry.questionId);
  }
  return entries;
}

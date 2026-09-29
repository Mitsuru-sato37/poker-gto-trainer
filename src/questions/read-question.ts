import { validateCanonicalSolution } from '../canonical/validate.ts';
import type { ActionHistoryEntry, CanonicalSolution, PokerAction, Street } from '../canonical/types.ts';

export interface TrainerQuestion {
  questionId: string;
  solutionId: string;
  game: CanonicalSolution['game'];
  positions: CanonicalSolution['spot']['positions'];
  pot: number;
  street: Street;
  board: string[];
  actionHistory: ActionHistoryEntry[];
  playerToAct: string;
  heroCombo: string;
  bestEv: number;
  actions: Array<PokerAction & { frequency: number; ev: number; evLoss: number }>;
}

function decimalPlaces(value: number): number {
  const [mantissa, exponentText = '0'] = value.toString().toLowerCase().split('e');
  const fractionLength = mantissa.split('.')[1]?.length ?? 0;
  return Math.max(0, fractionLength - Number(exponentText));
}

function decimalDifference(high: number, low: number): number {
  const places = Math.max(decimalPlaces(high), decimalPlaces(low));
  return Number((high - low).toFixed(places));
}

export function readTrainerQuestion(value: unknown): TrainerQuestion {
  const solution = validateCanonicalSolution(value);
  return {
    questionId: `${solution.solutionId}:${solution.heroCombo}`,
    solutionId: solution.solutionId,
    game: solution.game,
    positions: solution.spot.positions,
    pot: solution.spot.pot,
    street: solution.spot.street,
    board: [...solution.spot.board],
    actionHistory: solution.spot.actionHistory.map((entry) => ({ ...entry })),
    playerToAct: solution.spot.playerToAct,
    heroCombo: solution.heroCombo,
    bestEv: solution.bestEv,
    actions: solution.actions.map((action, index) => ({
      ...action,
      frequency: solution.strategy[index].frequency,
      ev: solution.strategy[index].ev,
      evLoss: decimalDifference(solution.bestEv, solution.strategy[index].ev),
    })),
  };
}

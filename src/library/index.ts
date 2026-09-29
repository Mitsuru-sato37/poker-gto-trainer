import { validateCanonicalSolution } from '../canonical/validate.ts';
import type { CanonicalSolution, Street } from '../canonical/types.ts';

export interface CanonicalLibraryInput {
  relativePath: string;
  value: unknown;
}

export interface LibraryIndexEntry {
  questionId: string;
  solutionId: string;
  heroCombo: string;
  street: Street;
  board: string[];
  playerToAct: string;
  solver: string;
  relativePath: string;
}

export interface CanonicalLibraryIndex {
  schemaVersion: '1.0.0';
  entries: LibraryIndexEntry[];
}

function entry(solution: CanonicalSolution, relativePath: string): LibraryIndexEntry {
  return {
    questionId: `${solution.solutionId}:${solution.heroCombo}`,
    solutionId: solution.solutionId,
    heroCombo: solution.heroCombo,
    street: solution.spot.street,
    board: [...solution.spot.board],
    playerToAct: solution.spot.playerToAct,
    solver: solution.provenance.solver,
    relativePath,
  };
}

export function buildLibraryIndex(inputs: CanonicalLibraryInput[]): CanonicalLibraryIndex {
  const entries = inputs
    .map(({ relativePath, value }) => entry(validateCanonicalSolution(value), relativePath))
    .sort((left, right) => left.questionId.localeCompare(right.questionId));
  const identities = new Set<string>();
  for (const item of entries) {
    if (identities.has(item.questionId)) throw new Error(`duplicate library question: ${item.questionId}`);
    identities.add(item.questionId);
  }
  return { schemaVersion: '1.0.0', entries };
}

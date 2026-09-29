export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export type ActionKind = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

export interface PokerAction {
  id: string;
  kind: ActionKind;
  amount?: number;
  potFraction?: number;
}

export interface ActionHistoryEntry {
  street: Street;
  actor: string;
  actionId: string;
  kind: ActionKind;
  amount?: number;
}

export interface CanonicalSolution {
  schemaVersion: '1.0.0';
  solutionId: string;
  game: {
    type: 'NLHE';
    playerCount: number;
    blinds: { small: number; big: number };
    ante: number;
    effectiveStack: number;
    chipUnit: 'chips';
  };
  spot: {
    positions: { inPosition: string; outOfPosition: string };
    pot: number;
    street: Street;
    board: string[];
    actionHistory: ActionHistoryEntry[];
    playerToAct: string;
  };
  heroCombo: string;
  actions: PokerAction[];
  strategy: Array<{ actionId: string; frequency: number; ev: number }>;
  bestEv: number;
  provenance: {
    solver: string;
    solverVersion: string;
    sourceRevision: string | null;
    rawFormatVersion: number;
    generatedAt: string;
    configSha256: string;
    rawArtifactSha256: string;
    execution?: {
      kind: string;
      url?: string;
    };
    actionEv?: {
      source: string;
      precision: number;
    };
    solve: {
      iterations: number;
      exploitabilityChips: number;
      exploitabilityPctOfPot: number;
    };
  };
}

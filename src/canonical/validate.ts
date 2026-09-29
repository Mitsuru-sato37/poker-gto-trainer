import type { ActionKind, CanonicalSolution, Street } from './types.ts';

const ACTION_KINDS = new Set<ActionKind>(['fold', 'check', 'call', 'bet', 'raise', 'all-in']);
const STREETS = new Set<Street>(['preflop', 'flop', 'turn', 'river']);
const CARD_PATTERN = /^[2-9TJQKA][cdhs]$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function object(value: unknown, path: string): Record<string, any> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${path} must be an object`);
  }
  return value as Record<string, any>;
}

function array(value: unknown, path: string): any[] {
  if (!Array.isArray(value)) throw new TypeError(`${path} must be an array`);
  return value;
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${path} must be a non-empty string`);
  return value;
}

function finite(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${path} must be a finite number`);
  return value;
}

function nonNegative(value: unknown, path: string): number {
  const result = finite(value, path);
  if (result < 0) throw new RangeError(`${path} must be non-negative`);
  return result;
}

function integer(value: unknown, path: string): number {
  const result = finite(value, path);
  if (!Number.isInteger(result)) throw new TypeError(`${path} must be an integer`);
  return result;
}

function card(value: unknown, path: string): string {
  const result = string(value, path);
  if (!CARD_PATTERN.test(result)) throw new TypeError(`${path} must be a card such as As`);
  return result;
}

function exactKeys(value: Record<string, any>, allowed: string[], path: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new TypeError(`${path}.${key} is not allowed`);
  }
}

export function validateCanonicalSolution(value: unknown): CanonicalSolution {
  const root = object(value, 'solution');
  exactKeys(root, ['schemaVersion', 'solutionId', 'game', 'spot', 'heroCombo', 'actions', 'strategy', 'bestEv', 'provenance'], 'solution');
  if (root.schemaVersion !== '1.0.0') throw new TypeError(`unsupported schemaVersion: ${String(root.schemaVersion)}`);
  string(root.solutionId, 'solution.solutionId');

  const game = object(root.game, 'solution.game');
  exactKeys(game, ['type', 'playerCount', 'blinds', 'ante', 'effectiveStack', 'chipUnit'], 'solution.game');
  if (game.type !== 'NLHE') throw new TypeError('solution.game.type must be NLHE');
  if (integer(game.playerCount, 'solution.game.playerCount') < 2) throw new RangeError('solution.game.playerCount must be at least 2');
  const blinds = object(game.blinds, 'solution.game.blinds');
  exactKeys(blinds, ['small', 'big'], 'solution.game.blinds');
  nonNegative(blinds.small, 'solution.game.blinds.small');
  nonNegative(blinds.big, 'solution.game.blinds.big');
  nonNegative(game.ante, 'solution.game.ante');
  nonNegative(game.effectiveStack, 'solution.game.effectiveStack');
  if (game.chipUnit !== 'chips') throw new TypeError('solution.game.chipUnit must be chips');

  const spot = object(root.spot, 'solution.spot');
  exactKeys(spot, ['positions', 'pot', 'street', 'board', 'actionHistory', 'playerToAct'], 'solution.spot');
  const positions = object(spot.positions, 'solution.spot.positions');
  exactKeys(positions, ['inPosition', 'outOfPosition'], 'solution.spot.positions');
  string(positions.inPosition, 'solution.spot.positions.inPosition');
  string(positions.outOfPosition, 'solution.spot.positions.outOfPosition');
  nonNegative(spot.pot, 'solution.spot.pot');
  if (!STREETS.has(spot.street)) throw new TypeError('solution.spot.street is invalid');
  const board = array(spot.board, 'solution.spot.board').map((entry, index) => card(entry, `solution.spot.board[${index}]`));
  if (new Set(board).size !== board.length) throw new TypeError('solution.spot.board contains duplicate cards');
  const expectedBoardLength = { preflop: 0, flop: 3, turn: 4, river: 5 }[spot.street as Street];
  if (board.length !== expectedBoardLength) throw new TypeError(`solution.spot.board must contain ${expectedBoardLength} cards for ${spot.street}`);
  string(spot.playerToAct, 'solution.spot.playerToAct');
  array(spot.actionHistory, 'solution.spot.actionHistory').forEach((entry, index) => {
    const history = object(entry, `solution.spot.actionHistory[${index}]`);
    exactKeys(history, ['street', 'actor', 'actionId', 'kind', 'amount'], `solution.spot.actionHistory[${index}]`);
    if (!STREETS.has(history.street)) throw new TypeError(`solution.spot.actionHistory[${index}].street is invalid`);
    string(history.actor, `solution.spot.actionHistory[${index}].actor`);
    string(history.actionId, `solution.spot.actionHistory[${index}].actionId`);
    if (!ACTION_KINDS.has(history.kind)) throw new TypeError(`solution.spot.actionHistory[${index}].kind is invalid`);
    if (history.amount !== undefined) nonNegative(history.amount, `solution.spot.actionHistory[${index}].amount`);
  });

  const combo = string(root.heroCombo, 'solution.heroCombo');
  if (combo.length !== 4) throw new TypeError('solution.heroCombo must contain exactly two cards');
  const comboCards = [card(combo.slice(0, 2), 'solution.heroCombo[0]'), card(combo.slice(2), 'solution.heroCombo[1]')];
  if (comboCards[0] === comboCards[1]) throw new TypeError('solution.heroCombo contains duplicate cards');
  if (comboCards.some((entry) => board.includes(entry))) throw new TypeError('heroCombo collides with board');

  const actions = array(root.actions, 'solution.actions');
  if (actions.length === 0) throw new TypeError('solution.actions must not be empty');
  const actionIds = actions.map((entry, index) => {
    const action = object(entry, `solution.actions[${index}]`);
    exactKeys(action, ['id', 'kind', 'amount', 'potFraction'], `solution.actions[${index}]`);
    const id = string(action.id, `solution.actions[${index}].id`);
    if (!ACTION_KINDS.has(action.kind)) throw new TypeError(`solution.actions[${index}].kind is invalid`);
    if (action.amount !== undefined) nonNegative(action.amount, `solution.actions[${index}].amount`);
    if (action.potFraction !== undefined) nonNegative(action.potFraction, `solution.actions[${index}].potFraction`);
    return id;
  });
  if (new Set(actionIds).size !== actionIds.length) throw new TypeError('solution.actions contains duplicate action IDs');

  const strategy = array(root.strategy, 'solution.strategy');
  if (strategy.length !== actions.length) throw new TypeError('solution.strategy length must match actions length');
  let frequencySum = 0;
  const evs = strategy.map((entry, index) => {
    const item = object(entry, `solution.strategy[${index}]`);
    exactKeys(item, ['actionId', 'frequency', 'ev'], `solution.strategy[${index}]`);
    if (item.actionId !== actionIds[index]) throw new TypeError(`strategy actionId at index ${index} must align with actions`);
    const frequency = finite(item.frequency, `solution.strategy[${index}].frequency`);
    if (frequency < 0 || frequency > 1) throw new RangeError(`solution.strategy[${index}].frequency must be between 0 and 1`);
    frequencySum += frequency;
    return finite(item.ev, `solution.strategy[${index}].ev`);
  });
  if (Math.abs(frequencySum - 1) > 1e-6) throw new RangeError(`strategy frequencies must sum to 1 (got ${frequencySum})`);
  const bestEv = finite(root.bestEv, 'solution.bestEv');
  const maximumEv = Math.max(...evs);
  if (Math.abs(bestEv - maximumEv) > 1e-9) throw new RangeError(`bestEv must equal maximum action EV (${maximumEv})`);

  const provenance = object(root.provenance, 'solution.provenance');
  exactKeys(provenance, ['solver', 'solverVersion', 'sourceRevision', 'rawFormatVersion', 'generatedAt', 'configSha256', 'rawArtifactSha256', 'execution', 'actionEv', 'solve'], 'solution.provenance');
  string(provenance.solver, 'solution.provenance.solver');
  string(provenance.solverVersion, 'solution.provenance.solverVersion');
  if (provenance.execution !== undefined) {
    const execution = object(provenance.execution, 'solution.provenance.execution');
    exactKeys(execution, ['kind', 'url'], 'solution.provenance.execution');
    string(execution.kind, 'solution.provenance.execution.kind');
    if (execution.url !== undefined) {
      const url = string(execution.url, 'solution.provenance.execution.url');
      if (!url.startsWith('https://')) throw new TypeError('solution.provenance.execution.url must use https');
    }
  }
  if (provenance.sourceRevision === null) {
    if (provenance.execution === undefined) throw new TypeError('solution.provenance.execution is required when sourceRevision is null');
  } else {
    const revision = string(provenance.sourceRevision, 'solution.provenance.sourceRevision');
    if (!/^[0-9a-f]{40}$/.test(revision)) throw new TypeError('solution.provenance.sourceRevision must be a 40-character lowercase git SHA or null');
  }
  nonNegative(integer(provenance.rawFormatVersion, 'solution.provenance.rawFormatVersion'), 'solution.provenance.rawFormatVersion');
  const generatedAt = string(provenance.generatedAt, 'solution.provenance.generatedAt');
  if (!Number.isFinite(Date.parse(generatedAt))) throw new TypeError('solution.provenance.generatedAt must be an ISO timestamp');
  for (const key of ['configSha256', 'rawArtifactSha256']) {
    if (!SHA256_PATTERN.test(string(provenance[key], `solution.provenance.${key}`))) throw new TypeError(`solution.provenance.${key} must be a lowercase SHA-256`);
  }
  const solve = object(provenance.solve, 'solution.provenance.solve');
  exactKeys(solve, ['iterations', 'exploitabilityChips', 'exploitabilityPctOfPot'], 'solution.provenance.solve');
  nonNegative(integer(solve.iterations, 'solution.provenance.solve.iterations'), 'solution.provenance.solve.iterations');
  nonNegative(solve.exploitabilityChips, 'solution.provenance.solve.exploitabilityChips');
  nonNegative(solve.exploitabilityPctOfPot, 'solution.provenance.solve.exploitabilityPctOfPot');
  if (provenance.actionEv !== undefined) {
    const actionEv = object(provenance.actionEv, 'solution.provenance.actionEv');
    exactKeys(actionEv, ['source', 'precision'], 'solution.provenance.actionEv');
    string(actionEv.source, 'solution.provenance.actionEv.source');
    const precision = finite(actionEv.precision, 'solution.provenance.actionEv.precision');
    if (precision <= 0) throw new RangeError('solution.provenance.actionEv.precision must be greater than zero');
  }

  return value as CanonicalSolution;
}

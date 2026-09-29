import { validateCanonicalSolution } from '../canonical/validate.ts';
import type { ActionKind, ActionHistoryEntry, CanonicalSolution, Street } from '../canonical/types.ts';

export interface PostflopAdapterContext {
  solutionId: string;
  game: CanonicalSolution['game'];
  spot: {
    positions: CanonicalSolution['spot']['positions'];
    pot: number;
    street: Street;
    board: string[];
    actionHistory: ActionHistoryEntry[];
    playerToAct: string;
  };
  heroCombo: string;
  sourceNode: number;
  generatedAt: string;
  configSha256: string;
  rawArtifactSha256: string;
}

const KIND_MAP: Record<string, ActionKind> = {
  Fold: 'fold',
  Check: 'check',
  Call: 'call',
  Bet: 'bet',
  Raise: 'raise',
  AllIn: 'all-in',
};

function record(value: unknown, path: string): Record<string, any> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${path} must be an object`);
  return value as Record<string, any>;
}

function list(value: unknown, path: string): any[] {
  if (!Array.isArray(value)) throw new TypeError(`${path} must be an array`);
  return value;
}

function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${path} must be a non-empty string`);
  return value;
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${path} must be a finite number`);
  return value;
}

function canonicalActionId(kind: ActionKind, amount?: number): string {
  return amount === undefined ? kind : `${kind}-${amount}`;
}

export function adaptPostflopDecision(rawValue: unknown, context: PostflopAdapterContext): CanonicalSolution {
  const raw = record(rawValue, 'raw');
  if (raw.format_version !== 1) throw new TypeError(`unsupported postflop decision format_version: ${String(raw.format_version)}`);
  const solver = record(raw.solver, 'raw.solver');
  const meta = record(raw.meta, 'raw.meta');
  const decision = record(raw.decision, 'raw.decision');

  const sourceNode = number(decision.node, 'raw.decision.node');
  if (!Number.isInteger(sourceNode) || sourceNode < 0) throw new TypeError('raw.decision.node must be a non-negative integer');
  if (sourceNode !== context.sourceNode) {
    throw new TypeError(`raw decision node ${sourceNode} does not match expected node ${context.sourceNode}`);
  }
  const actingSide = text(decision.player, 'raw.decision.player');
  if (actingSide !== 'OOP' && actingSide !== 'IP') throw new TypeError('raw.decision.player must be OOP or IP');
  const sourcePlayer = actingSide === 'OOP' ? context.spot.positions.outOfPosition : context.spot.positions.inPosition;
  if (sourcePlayer !== context.spot.playerToAct) {
    throw new TypeError(`raw decision player ${actingSide} maps to ${sourcePlayer}, not playerToAct ${context.spot.playerToAct}`);
  }

  const rawActions = list(decision.actions, 'raw.decision.actions');
  if (rawActions.length === 0) throw new TypeError('raw.decision.actions must not be empty');
  const sourceIds = new Set<string>();
  const actionBySourceId = new Map<string, { id: string; kind: ActionKind; amount?: number; potFraction?: number }>();
  const actions = rawActions.map((value, index) => {
    const rawAction = record(value, `raw.decision.actions[${index}]`);
    const sourceId = text(rawAction.source_id, `raw.decision.actions[${index}].source_id`);
    if (sourceIds.has(sourceId)) throw new TypeError(`duplicate source action ID: ${sourceId}`);
    sourceIds.add(sourceId);
    const rawKind = text(rawAction.kind, `raw.decision.actions[${index}].kind`);
    const kind = KIND_MAP[rawKind];
    if (!kind) throw new TypeError(`unsupported postflop action kind: ${rawKind}`);
    const amount = rawAction.amount === undefined ? undefined : number(rawAction.amount, `raw.decision.actions[${index}].amount`);
    const potFraction = rawAction.pot_fraction === undefined ? undefined : number(rawAction.pot_fraction, `raw.decision.actions[${index}].pot_fraction`);
    const action = { id: canonicalActionId(kind, amount), kind, ...(amount === undefined ? {} : { amount }), ...(potFraction === undefined ? {} : { potFraction }) };
    actionBySourceId.set(sourceId, action);
    return action;
  });

  const combo = list(decision.combos, 'raw.decision.combos').find((value, index) => {
    const candidate = record(value, `raw.decision.combos[${index}]`);
    return candidate.cards === context.heroCombo;
  });
  if (!combo) throw new TypeError(`raw decision does not contain hero combo ${context.heroCombo}`);
  const rawCombo = record(combo, `combo ${context.heroCombo}`);
  const comboActions = list(rawCombo.actions, `combo ${context.heroCombo}.actions`);
  if (comboActions.length !== actions.length) throw new TypeError(`combo ${context.heroCombo} must contain exactly ${actions.length} actions`);
  const resultBySourceId = new Map<string, { frequency: number; ev: number }>();
  comboActions.forEach((value, index) => {
    const result = record(value, `combo ${context.heroCombo}.actions[${index}]`);
    const sourceId = text(result.source_id, `combo ${context.heroCombo}.actions[${index}].source_id`);
    if (!actionBySourceId.has(sourceId)) throw new TypeError(`combo ${context.heroCombo} references unknown action ${sourceId}`);
    if (resultBySourceId.has(sourceId)) throw new TypeError(`combo ${context.heroCombo} repeats action ${sourceId}`);
    if (result.ev === undefined) throw new TypeError(`combo ${context.heroCombo} action ${sourceId} is missing ev`);
    resultBySourceId.set(sourceId, {
      frequency: number(result.frequency, `combo ${context.heroCombo} action ${sourceId} frequency`),
      ev: number(result.ev, `combo ${context.heroCombo} action ${sourceId} ev`),
    });
  });
  const strategy = rawActions.map((rawAction) => {
    const sourceId = rawAction.source_id as string;
    const action = actionBySourceId.get(sourceId)!;
    const result = resultBySourceId.get(sourceId);
    if (!result) throw new TypeError(`combo ${context.heroCombo} is missing action ${sourceId}`);
    return { actionId: action.id, frequency: result.frequency, ev: result.ev };
  });

  return validateCanonicalSolution({
    schemaVersion: '1.0.0',
    solutionId: context.solutionId,
    game: context.game,
    spot: context.spot,
    heroCombo: context.heroCombo,
    actions,
    strategy,
    bestEv: Math.max(...strategy.map(({ ev }) => ev)),
    provenance: {
      solver: text(solver.name, 'raw.solver.name'),
      solverVersion: text(solver.version, 'raw.solver.version'),
      sourceRevision: solver.source_revision === null ? null : text(solver.source_revision, 'raw.solver.source_revision'),
      rawFormatVersion: raw.format_version,
      generatedAt: context.generatedAt,
      configSha256: context.configSha256,
      rawArtifactSha256: context.rawArtifactSha256,
      ...(solver.execution === undefined ? {} : { execution: solver.execution }),
      ...(solver.action_ev === undefined ? {} : { actionEv: { source: solver.action_ev.source, precision: solver.action_ev.precision } }),
      solve: {
        iterations: number(meta.iterations, 'raw.meta.iterations'),
        exploitabilityChips: number(meta.exploitability_chips, 'raw.meta.exploitability_chips'),
        exploitabilityPctOfPot: number(meta.exploitability_pct_of_pot, 'raw.meta.exploitability_pct_of_pot'),
      },
    },
  });
}

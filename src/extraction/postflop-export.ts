export interface ExtractionRequest {
  solutionId: string;
  sourceNode: number;
  heroCombo: string;
}

function record(value: unknown, path: string): Record<string, any> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${path} must be an object`);
  return value as Record<string, any>;
}

function list(value: unknown, path: string): any[] {
  if (!Array.isArray(value)) throw new TypeError(`${path} must be an array`);
  return value;
}

function nonEmptyText(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${path} must be a non-empty string`);
  return value;
}

function finiteNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${path} must be a finite number`);
  return value;
}

function validateComboActions(combo: Record<string, any>, actionIds: Set<string>, path: string): void {
  const seen = new Set<string>();
  for (const [index, value] of list(combo.actions, `${path}.actions`).entries()) {
    const action = record(value, `${path}.actions[${index}]`);
    const sourceId = nonEmptyText(action.source_id, `${path}.actions[${index}].source_id`);
    if (!actionIds.has(sourceId)) throw new TypeError(`${path} references unknown action ${sourceId}`);
    if (seen.has(sourceId)) throw new TypeError(`${path} repeats action ${sourceId}`);
    seen.add(sourceId);
    finiteNumber(action.frequency, `${path} action ${sourceId} frequency`);
    if (action.ev === undefined) throw new TypeError(`${path} action ${sourceId} is missing ev`);
    finiteNumber(action.ev, `${path} action ${sourceId} ev`);
  }
  if (seen.size !== actionIds.size) throw new TypeError(`${path} must contain exactly one result for every source action`);
}

export function extractPostflopDecisions(rawValue: unknown, requests: ExtractionRequest[]): Record<string, any>[] {
  const raw = record(rawValue, 'raw export');
  if (raw.format_version !== 1) throw new TypeError(`unsupported postflop export format_version: ${String(raw.format_version)}`);
  record(raw.solver, 'raw.solver');
  record(raw.meta, 'raw.meta');
  const decision = record(raw.decision, 'raw.decision');
  const node = finiteNumber(decision.node, 'raw.decision.node');
  if (!Number.isInteger(node) || node < 0) throw new TypeError('raw.decision.node must be a non-negative integer');
  const sourceActions = list(decision.actions, 'raw.decision.actions');
  if (sourceActions.length === 0) throw new TypeError('raw.decision.actions must not be empty');
  const actionIds = new Set<string>();
  for (const [index, value] of sourceActions.entries()) {
    const action = record(value, `raw.decision.actions[${index}]`);
    const sourceId = nonEmptyText(action.source_id, `raw.decision.actions[${index}].source_id`);
    if (actionIds.has(sourceId)) throw new TypeError(`duplicate source action ID: ${sourceId}`);
    actionIds.add(sourceId);
  }
  const combos = list(decision.combos, 'raw.decision.combos');
  const comboByCards = new Map<string, Record<string, any>>();
  for (const [index, value] of combos.entries()) {
    const combo = record(value, `raw.decision.combos[${index}]`);
    const cards = nonEmptyText(combo.cards, `raw.decision.combos[${index}].cards`);
    if (comboByCards.has(cards)) throw new TypeError(`duplicate combo: ${cards}`);
    comboByCards.set(cards, combo);
  }

  return requests.map((request, index) => {
    nonEmptyText(request.solutionId, `requests[${index}].solutionId`);
    if (!Number.isInteger(request.sourceNode) || request.sourceNode < 0) throw new TypeError(`requests[${index}].sourceNode must be a non-negative integer`);
    if (request.sourceNode !== node) throw new TypeError(`raw decision node ${node} does not match expected node ${request.sourceNode}`);
    const heroCombo = nonEmptyText(request.heroCombo, `requests[${index}].heroCombo`);
    const combo = comboByCards.get(heroCombo);
    if (!combo) throw new TypeError(`raw decision does not contain hero combo ${heroCombo}`);
    validateComboActions(combo, actionIds, `combo ${heroCombo}`);
    return {
      ...raw,
      decision: {
        ...decision,
        combos: [combo],
      },
    };
  });
}

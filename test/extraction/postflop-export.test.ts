import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildCanonicalSolutions } from '../../src/cli/extract-postflop.ts';
import { extractPostflopDecisions } from '../../src/extraction/postflop-export.ts';

const exportValue = JSON.parse(readFileSync('test/fixtures/postflop-export-multi-combo.json', 'utf8'));
const request = (heroCombo: string) => ({
  solutionId: 'btn-bb-srp-qh7s2c-node0',
  sourceNode: 0,
  heroCombo,
});

test('extracts requested combos without changing action order or numeric precision', () => {
  const [first, second] = extractPostflopDecisions(exportValue, [request('QcQd'), request('AsKd')]);

  assert.equal(first.decision.combos.length, 1);
  assert.equal(first.decision.combos[0].cards, 'QcQd');
  assert.deepEqual(first.decision.actions.map((action: { source_id: string }) => action.source_id), ['check', 'bet-to-1.82bb']);
  assert.equal(first.decision.combos[0].actions[0].frequency, 0.705661);
  assert.equal(first.decision.combos[0].actions[1].ev, 55);
  assert.equal(second.decision.combos[0].cards, 'AsKd');
  assert.equal(second.decision.combos[0].actions[0].ev, 31.234567);
});

test('rejects a requested combo when an action EV is missing', () => {
  const incomplete = structuredClone(exportValue);
  delete incomplete.decision.combos[1].actions[1].ev;

  assert.throws(
    () => extractPostflopDecisions(incomplete, [request('AsKd')]),
    /missing ev/u,
  );
});

test('rejects unknown combos and duplicate combo actions', () => {
  assert.throws(() => extractPostflopDecisions(exportValue, [request('AhAd')]), /does not contain hero combo AhAd/u);

  const duplicate = structuredClone(exportValue);
  duplicate.decision.combos[0].actions.push({ source_id: 'check', frequency: 0, ev: 54.86 });
  assert.throws(() => extractPostflopDecisions(duplicate, [request('QcQd')]), /repeats action check/u);
});

test('builds validated canonical solutions for each requested combo', () => {
  const context = {
    solutionId: 'btn-bb-srp-qh7s2c-node0',
    game: { type: 'NLHE', playerCount: 6, blinds: { small: 10, big: 20 }, ante: 0, effectiveStack: 2000, chipUnit: 'chips' },
    spot: {
      positions: { inPosition: 'BTN', outOfPosition: 'BB' },
      pot: 110,
      street: 'flop',
      board: ['Qh', '7s', '2c'],
      actionHistory: [],
      playerToAct: 'BB',
    },
    sourceNode: 0,
    generatedAt: '2026-09-29T00:00:00.000Z',
    configSha256: 'fb8c59006a4abba7831e8583034d8dba3f5a2c30d5280126be4594fe91424be3',
  } as const;
  const solutions = buildCanonicalSolutions(Buffer.from(JSON.stringify(exportValue)), [
    { request: request('QcQd'), context: { ...context, heroCombo: 'QcQd' } },
    { request: request('AsKd'), context: { ...context, heroCombo: 'AsKd' } },
  ]);

  assert.equal(solutions.length, 2);
  assert.equal(solutions[0].heroCombo, 'QcQd');
  assert.equal(solutions[1].strategy[1].ev, 31.999999);
  assert.equal(solutions[1].provenance.rawArtifactSha256.length, 64);
});

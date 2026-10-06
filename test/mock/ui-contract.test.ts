import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync('mock/app.js', 'utf8');

test('range feedback explains representative combos and unavailable full range', () => {
  assert.match(app, /代表的なコンボ/u);
  assert.match(app, /全レンジ表示は準備中/u);
  assert.match(app, /range-legend/u);
});

test('screen rendering resets the viewport after replacing the app view', () => {
  assert.match(app, /function resetViewport\(\)/u);
  assert.match(app, /window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/u);
  assert.match(app, /resetViewport\(\);/u);
});

test('feedback keeps Solver provenance visible and does not claim dummy data is GTO', () => {
  assert.match(app, /実Solver検証済み/u);
  assert.match(app, /仮データ（GTOではありません）/u);
  assert.match(app, /dataSource/u);
});

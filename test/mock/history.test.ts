import assert from 'node:assert/strict';
import test from 'node:test';

import { getMistakeEntries, recordHistory, restoreHistory, serializeHistory } from '../../mock/history.js';

const entry = { problemId: 'p1', evaluation: 'MISTAKE', selectedAction: 'fold', answeredAt: '2026-09-29T00:00:00.000Z' };

test('history round-trips valid entries and exposes mistakes for review', () => {
  const history = recordHistory([], entry);
  assert.deepEqual(restoreHistory(serializeHistory(history)), history);
  assert.deepEqual(getMistakeEntries(history), [entry]);
});

test('history ignores malformed storage and entries', () => {
  assert.deepEqual(restoreHistory('{"version":1,"entries":[null,{"problemId":"p1"}]}'), []);
  assert.deepEqual(restoreHistory('not json'), []);
});

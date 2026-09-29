import assert from 'node:assert/strict';
import test from 'node:test';

import { decodeRequestPath } from '../../scripts/serve-mock.mjs';

test('rejects malformed percent-encoded request paths without throwing', () => {
  assert.equal(decodeRequestPath('/%ZZ'), null);
  assert.equal(decodeRequestPath('/index.html'), '/index.html');
});

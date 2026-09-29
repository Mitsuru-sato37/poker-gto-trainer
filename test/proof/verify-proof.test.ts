import assert from 'node:assert/strict';
import { appendFileSync, cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { verifyProofDirectory } from '../../src/proof/verify-proof.ts';

const repoRoot = new URL('../../', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1');
const proofDirectory = join(repoRoot, 'proof', 'btn-bb-srp-flop');
const configPath = join(repoRoot, 'solver', 'configs', 'btn-vs-bb-srp-flop.toml');

test('verifies the committed actual-solver proof without rewriting it', () => {
  assert.doesNotThrow(() => verifyProofDirectory(proofDirectory, configPath));
});

test('rejects a solver config whose bytes do not match the recorded digest', () => {
  const directory = mkdtempSync(join(tmpdir(), 'poker-gto-proof-'));
  try {
    const copiedProof = join(directory, 'proof');
    const copiedConfig = join(directory, 'spot.toml');
    cpSync(proofDirectory, copiedProof, { recursive: true });
    cpSync(configPath, copiedConfig);
    appendFileSync(copiedConfig, '\n# changed after proof\n');

    assert.throws(
      () => verifyProofDirectory(copiedProof, copiedConfig),
      /solver config SHA-256 does not match context.configSha256/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

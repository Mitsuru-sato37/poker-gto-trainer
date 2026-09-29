import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = new URL('../../', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1');

test('CLI converts a raw decision and prints a trainer-compatible question', () => {
  const directory = mkdtempSync(join(tmpdir(), 'poker-gto-pipeline-'));
  try {
    const rawPath = join(directory, 'raw.json');
    const contextPath = join(directory, 'context.json');
    const canonicalPath = join(directory, 'canonical.json');
    cpSync(join(repoRoot, 'test', 'fixtures', 'postflop-decision-v1.json'), rawPath);
    writeFileSync(contextPath, JSON.stringify({
      solutionId: 'question-cli',
      game: { type: 'NLHE', playerCount: 6, blinds: { small: 10, big: 20 }, ante: 0, effectiveStack: 2000, chipUnit: 'chips' },
      spot: {
        positions: { inPosition: 'BTN', outOfPosition: 'BB' }, pot: 130, street: 'flop', board: ['Qh', '7s', '2c'], playerToAct: 'BTN',
        actionHistory: [
          { street: 'preflop', actor: 'BTN', actionId: 'raise-50', kind: 'raise', amount: 50 },
          { street: 'preflop', actor: 'BB', actionId: 'call-30', kind: 'call', amount: 30 },
          { street: 'flop', actor: 'BB', actionId: 'check', kind: 'check' }
        ]
      },
      heroCombo: 'AsJs', sourceNode: 1, generatedAt: '2026-09-25T03:00:00.000Z', configSha256: 'a'.repeat(64)
    }));

    const convert = spawnSync(process.execPath, ['src/cli/canonicalize.ts', rawPath, contextPath, canonicalPath], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(convert.status, 0, convert.stderr);
    const canonical = JSON.parse(readFileSync(canonicalPath, 'utf8'));
    assert.match(canonical.provenance.rawArtifactSha256, /^[0-9a-f]{64}$/);

    const read = spawnSync(process.execPath, ['src/cli/read-question.ts', canonicalPath], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(read.status, 0, read.stderr);
    const question = JSON.parse(read.stdout);
    assert.equal(question.questionId, 'question-cli:AsJs');
    assert.equal(question.actions[0].evLoss, 1.375);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

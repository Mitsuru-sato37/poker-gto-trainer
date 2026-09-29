import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { adaptPostflopDecision } from '../adapters/postflop.ts';
import type { PostflopAdapterContext } from '../adapters/postflop.ts';
import { readTrainerQuestion } from '../questions/read-question.ts';

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function requireSameJson(actual: unknown, expected: unknown, artifact: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${artifact} differs from the committed deterministic proof artifact`);
  }
}

export function verifyProofDirectory(proofDirectory: string, configPath: string): void {
  const context = readJson(join(proofDirectory, 'context.json')) as Omit<PostflopAdapterContext, 'rawArtifactSha256'>;
  const configDigest = sha256(readFileSync(configPath));
  if (configDigest !== context.configSha256) {
    throw new Error('solver config SHA-256 does not match context.configSha256');
  }

  const rawBytes = readFileSync(join(proofDirectory, 'raw-decision.json'));
  const canonical = adaptPostflopDecision(JSON.parse(rawBytes.toString('utf8')), {
    ...context,
    rawArtifactSha256: sha256(rawBytes),
  });
  requireSameJson(canonical, readJson(join(proofDirectory, 'canonical.json')), 'canonical.json');
  requireSameJson(readTrainerQuestion(canonical), readJson(join(proofDirectory, 'question.json')), 'question.json');
}

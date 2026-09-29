import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

import { adaptPostflopDecision } from '../adapters/postflop.ts';
import type { PostflopAdapterContext } from '../adapters/postflop.ts';

const [rawPath, contextPath, outputPath] = process.argv.slice(2);
if (!rawPath || !contextPath || !outputPath) {
  throw new Error('usage: node src/cli/canonicalize.ts RAW_JSON CONTEXT_JSON OUTPUT_JSON');
}

const rawBytes = readFileSync(rawPath);
const raw = JSON.parse(rawBytes.toString('utf8'));
const context = JSON.parse(readFileSync(contextPath, 'utf8')) as Omit<PostflopAdapterContext, 'rawArtifactSha256'>;
const solution = adaptPostflopDecision(raw, {
  ...context,
  rawArtifactSha256: createHash('sha256').update(rawBytes).digest('hex'),
});
writeFileSync(outputPath, `${JSON.stringify(solution, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });

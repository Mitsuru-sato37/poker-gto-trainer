import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

import { adaptPostflopDecision, type PostflopAdapterContext } from '../adapters/postflop.ts';
import type { CanonicalSolution } from '../canonical/types.ts';
import { extractPostflopDecisions, type ExtractionRequest } from '../extraction/postflop-export.ts';

export interface PostflopExtractionJob {
  request: ExtractionRequest;
  context: Omit<PostflopAdapterContext, 'rawArtifactSha256' | 'solutionId' | 'heroCombo' | 'sourceNode'> & {
    solutionId: string;
    heroCombo: string;
    sourceNode: number;
  };
}

export function buildCanonicalSolutions(rawBytes: Uint8Array, jobs: PostflopExtractionJob[]): CanonicalSolution[] {
  const raw = JSON.parse(new TextDecoder().decode(rawBytes));
  const rawArtifactSha256 = createHash('sha256').update(rawBytes).digest('hex');
  return extractPostflopDecisions(raw, jobs.map(({ request }) => request)).map((decision, index) => {
    const job = jobs[index];
    return adaptPostflopDecision(decision, {
      ...job.context,
      solutionId: job.context.solutionId,
      heroCombo: job.context.heroCombo,
      sourceNode: job.context.sourceNode,
      rawArtifactSha256,
    });
  });
}

const [rawPath, jobsPath, outputPath] = process.argv.slice(2);
const invokedAsCli = process.argv[1]?.endsWith('extract-postflop.ts') ?? false;
if (invokedAsCli && rawPath && jobsPath && outputPath) {
  const rawBytes = readFileSync(rawPath);
  const jobs = JSON.parse(readFileSync(jobsPath, 'utf8')) as PostflopExtractionJob[];
  const solutions = buildCanonicalSolutions(rawBytes, jobs);
  writeFileSync(outputPath, `${JSON.stringify(solutions, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
} else if (invokedAsCli) {
  throw new Error('usage: node src/cli/extract-postflop.ts RAW_EXPORT_JSON JOBS_JSON OUTPUT_JSON');
}

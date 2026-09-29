import { readFileSync } from 'node:fs';

import { readTrainerQuestion } from '../questions/read-question.ts';

const [canonicalPath] = process.argv.slice(2);
if (!canonicalPath) throw new Error('usage: node src/cli/read-question.ts CANONICAL_JSON');

const solution = JSON.parse(readFileSync(canonicalPath, 'utf8'));
process.stdout.write(`${JSON.stringify(readTrainerQuestion(solution), null, 2)}\n`);

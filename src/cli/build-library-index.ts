import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { buildLibraryIndex } from '../library/index.ts';

const [directory, outputPath] = process.argv.slice(2);
if (!directory || !outputPath) throw new Error('usage: node src/cli/build-library-index.ts CANONICAL_DIRECTORY OUTPUT_JSON');

const inputs = readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json')
  .sort((left, right) => left.name.localeCompare(right.name))
  .map((entry) => ({
    relativePath: relative(directory, join(directory, entry.name)).replaceAll('\\', '/'),
    value: JSON.parse(readFileSync(join(directory, entry.name), 'utf8')),
  }));

const index = buildLibraryIndex(inputs);
writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });

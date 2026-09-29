import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { verifyProofDirectory } from '../proof/verify-proof.ts';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
verifyProofDirectory(
  join(repoRoot, 'proof', 'btn-bb-srp-flop'),
  join(repoRoot, 'solver', 'configs', 'btn-vs-bb-srp-flop.toml'),
);
process.stdout.write('Phase 0 proof artifacts reproduced exactly.\n');

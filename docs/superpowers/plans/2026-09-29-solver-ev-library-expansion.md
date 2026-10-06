# Solver EV Library Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tested, EV-preserving ingestion path for official Solver JSON exports and make the trainer catalog consume only validated Solver-backed questions.

**Architecture:** Keep solver-specific parsing in a new extraction boundary upstream of `adaptPostflopDecision`. Extract one requested node/combo at a time into the existing raw decision contract, validate it into canonical data, and register only canonical files in the existing library index. The browser mock reads a small audited manifest derived from canonical data; dummy problems remain isolated as fixtures and are not selected by production session modes.

**Tech Stack:** Node.js 24, TypeScript with native type stripping, Node built-in test runner, existing canonical validator/adapter/library, dependency-free browser JavaScript.

**Spec:** `docs/superpowers/specs/2026-09-29-solver-ev-library-expansion-design.md`

## Global Constraints

- Solver output is ground truth; never infer frequencies or EVs.
- Preserve combo identity, bet sizes, complete action history, solver provenance, and numeric precision.
- Keep raw solver outputs, binaries, caches, secrets, and large libraries outside Git.
- Keep the Phase 0 slice limited to six-max NLHE, 10/20 blinds, no ante, 100bb, BTN vs BB SRP.
- Application/UI code consumes canonical-derived trainer records, not solver-specific JSON.
- Do not add authentication, cloud backends, multi-user infrastructure, distributed jobs, or on-demand solving.

## Review Focus

- Missing per-action EV must fail before canonical output is written — covered by extractor rejection tests.
- Multiple combos from one export must retain exact action arrays and decimal values — covered by multi-combo extraction tests.
- Node/player/action-history mismatches must remain rejected — covered by adapter regression tests.
- Duplicate canonical question identity must not enter the library — covered by index tests.
- The production mock must not sample hand-written dummy values — covered by catalog/session tests.

### Task 1: Define the official export extraction boundary

**Files:**
- Create: `src/extraction/postflop-export.ts`
- Create: `src/cli/extract-postflop.ts`
- Create: `test/extraction/postflop-export.test.ts`
- Create: `test/fixtures/postflop-export-multi-combo.json`
- Modify: `package.json`

**Interfaces:**
- `extractPostflopDecisions(rawExport: unknown, requests: ExtractionRequest[]): RawDecisionInput[]`
- `ExtractionRequest` identifies `solutionId`, source node, hero combo, and adapter context.
- The extractor emits the existing adapter raw decision shape and does not emit canonical data itself.
- CLI accepts an ignored export path plus a checked-in request manifest and writes canonical output atomically only after all requested records adapt and validate.

- [ ] **Step 1: Write failing tests for a multi-combo official export**

  Assert that two requested combos preserve the source action order, exact frequency decimals, exact EV decimals, node ID, actor side, and solver metadata.

- [ ] **Step 2: Run the focused extraction tests and confirm the expected missing-module or missing-function failure**

  Run: `node --test test/extraction/postflop-export.test.ts`

- [ ] **Step 3: Write failing tests for incomplete and ambiguous exports**

  Assert rejection when a combo omits an action EV, references an unknown action, duplicates a combo/action, or requests a missing node/combo.

- [ ] **Step 4: Implement the smallest export parser**

  Support only the documented export shape needed by the fixture. Reject undocumented shapes rather than guessing field names. Keep all source numeric values unchanged.

- [ ] **Step 5: Implement the CLI atomic conversion boundary**

  Reuse the existing adapter and validator, write one canonical file per accepted identity, and leave no output for a failed request batch.

- [ ] **Step 6: Run focused extraction tests and syntax checks**

  Run: `node --test test/extraction/postflop-export.test.ts`; `npm run check`.

### Task 2: Connect extracted canonical records to the library manifest

**Files:**
- Create: `src/library/build-trainer-manifest.ts`
- Create: `test/library/trainer-manifest.test.ts`
- Modify: `src/library/index.ts`
- Modify: `package.json`

**Interfaces:**
- `buildTrainerManifest(canonicalSolutions: CanonicalSolution[]): TrainerManifestEntry[]`
- Manifest entries expose only trainer-required fields and retain provenance/reference identity.
- The builder rejects duplicate `solutionId:heroCombo` identities and any non-validator-approved input.

- [ ] **Step 1: Write failing manifest tests**

  Assert exact preservation of frequencies/EVs, conversion of canonical actions/history into trainer fields, provenance retention, and duplicate rejection.

- [ ] **Step 2: Run the focused tests and verify they fail for the missing manifest builder**

  Run: `node --test test/library/trainer-manifest.test.ts`

- [ ] **Step 3: Implement the manifest builder with no derived strategy values**

  Compute only display-safe derived loss values from canonical `bestEv - action.ev`; do not round stored numbers or invent evaluation frequencies.

- [ ] **Step 4: Run focused manifest tests and the existing library tests**

  Run: `node --test test/library/trainer-manifest.test.ts test/library/index.test.ts`

### Task 3: Replace production mock selection with Solver-backed catalog data

**Files:**
- Create: `mock/data/solver-manifest.js`
- Modify: `mock/data/problems.js`
- Modify: `mock/session.js` only if catalog selection needs an explicit production catalog
- Create: `test/mock/solver-catalog.test.ts`

**Interfaces:**
- `mock/data/solver-manifest.js` exports only audited Solver-derived entries.
- `PROBLEMS` contains no hand-written frequency/EV records for production session selection.
- Dummy fixtures remain separately exported for development tests but are not included in `PROBLEMS`.

- [ ] **Step 1: Write failing catalog tests**

  Assert that every production problem has solver provenance, varied hero combos, complete action history, and no dummy-only source marker; assert that session selection cannot return fabricated entries.

- [ ] **Step 2: Run the focused catalog tests and confirm they fail against the current dummy catalog**

  Run: `node --test test/mock/solver-catalog.test.ts`

- [ ] **Step 3: Implement the canonical-derived manifest mapping**

  Map canonical action kinds/amounts, history, board, pot, stack, frequencies, EVs, and provenance to the existing feedback model without changing numeric precision in source data.

- [ ] **Step 4: Keep the current proof question and add only supplied audited records**

  Do not create placeholder entries to reach ten questions. If fewer than ten verified records exist, session creation must report the real shortage rather than fill from dummy data.

- [ ] **Step 5: Run catalog and session tests**

  Run: `node --test test/mock/solver-catalog.test.ts test/mock/session.test.ts test/mock/problems.test.ts`

### Task 4: Update UI/data-status copy and scrolling regression coverage

**Files:**
- Modify: `mock/app.js`
- Modify: `mock/styles.css`
- Create: `test/mock/ui-contract.test.ts`

**Interfaces:**
- Feedback range copy explains that displayed cells are representative combos, not the complete range.
- Rendering transitions call a single scroll-reset helper after replacing the app view.
- Solver provenance is visible when the question is Solver-backed; no “GTO” claim appears for non-Solver data.

- [ ] **Step 1: Write failing UI contract tests**

  Assert the explanatory range copy, “full range unavailable” state, provenance labeling, and scroll-reset call are present in the rendered app contract.

- [ ] **Step 2: Run focused UI contract tests and verify the expected failures**

  Run: `node --test test/mock/ui-contract.test.ts`

- [ ] **Step 3: Implement the minimal range explanation and scroll reset**

  Keep the fixed Next control and add only the legend/status needed to prevent interpreting a representative subset as a full GTO matrix.

- [ ] **Step 4: Run focused UI tests and browser syntax checks**

  Run: `node --test test/mock/ui-contract.test.ts`; `node --check mock/app.js`; `node --check mock/data/problems.js`.

### Task 5: Acquire audited exports and close out documentation

**Files:**
- Create locally only, ignored: `.local/solutions/...` and any official export artifacts
- Modify: `docs/PROGRESS.md`
- Modify: `docs/DECISIONS.md`
- Modify: `solver/README.md`
- Modify: `.gitignore` if required to cover the export path

**Interfaces:**
- The acquisition checklist records source URL/revision when known, export hash, config hash, node IDs, combo IDs, solve metrics, and action-EV precision.
- No raw or large generated artifact is committed.

- [ ] **Step 1: Acquire official EV-bearing JSON exports for additional approved BTN-vs-BB postflop spots**

  Use the upstream official workbench/export or native CLI when the Windows toolchain is available. Record exact export metadata and retain outputs only under ignored `.local/` paths.

- [ ] **Step 2: Run the extraction CLI against the real exports**

  Run the command defined in Task 1 and inspect the resulting manifest count and identities.

- [ ] **Step 3: Run the complete verification suite**

  Run: `npm test`; `npm run check`; `npm run proof`; `git diff --check`.

- [ ] **Step 4: Update progress and decisions with verified counts and remaining gaps**

  State exactly how many additional records were acquired. If the upstream export is still unavailable, leave the catalog unexpanded and document the blocker instead of claiming completion.

- [ ] **Step 5: Inspect the working tree for accidental solver artifacts**

  Run: `git status --short`; confirm no binaries, raw exports, caches, or large libraries are tracked.


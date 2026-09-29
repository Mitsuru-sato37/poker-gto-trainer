# Phase 0 GTO Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one validated trainer-compatible BTN vs BB SRP question from an actual pinned OSS solver run.

**Architecture:** A solver runner writes a versioned raw decision artifact. A solver-specific TypeScript adapter converts it into one Canonical Solution v1 decision-node document, semantic validation protects ground-truth integrity, and a solver-agnostic reader exposes a trainer question.

**Tech Stack:** Node.js 24, TypeScript type stripping, `node:test`, JSON Schema, Rust stable for the external solver.

**Spec:** `docs/superpowers/specs/2026-09-25-phase-0-gto-data-foundation-design.md`

## Global Constraints

- Solver data, never an LLM, is ground truth.
- Preserve exact combo identity, action sizes, full action history, solver provenance, and unrounded numeric values.
- Fixtures do not satisfy the real-solver milestone.
- Generated binaries and large outputs remain under ignored `.local/`.
- UI and future infrastructure are out of scope.

## Review Focus

- Frequency vectors with the right length but a sum other than one must fail conversion.
- A hero combo that collides with the board must fail validation.
- Reordered raw action vectors must remain aligned by action ID, not display label.
- Missing per-action EV data must fail rather than be inferred from strategy.
- An unsupported raw or canonical format version must fail with a contextual message.

---

### Task 1: Canonical contract and validator

**Files:** Create `package.json`, `schema/canonical-solution-v1.schema.json`, `src/canonical/types.ts`, `src/canonical/validate.ts`, and `test/canonical/validate.test.ts`.

**Interfaces:** Produce `validateCanonicalSolution(value: unknown): CanonicalSolution` and the canonical TypeScript types.

- [ ] Write tests for a valid document and each Review Focus invariant.
- [ ] Run the focused tests and verify failure because the validator is absent.
- [ ] Implement the minimal types and validator.
- [ ] Run focused and full tests to green.

### Task 2: Solver adapter

**Files:** Create `src/adapters/postflop.ts`, `test/adapters/postflop.test.ts`, and `test/fixtures/postflop-decision-v1.json`.

**Interfaces:** Consume a versioned raw decision export; produce a validated `CanonicalSolution` via `adaptPostflopDecision(raw, context)`.

- [ ] Write mapping and rejection tests, including absent EVs and action-vector alignment.
- [ ] Run tests and verify the missing-adapter failure.
- [ ] Implement only the tested mapping.
- [ ] Run focused and full tests to green.

### Task 3: Trainer question reader and CLI

**Files:** Create `src/questions/read-question.ts`, `src/cli/canonicalize.ts`, `src/cli/read-question.ts`, and their tests.

**Interfaces:** Produce `readTrainerQuestion(solution: CanonicalSolution): TrainerQuestion`; CLIs convert raw JSON and print a selected question as JSON.

- [ ] Write reader and CLI behavior tests.
- [ ] Verify expected red failures.
- [ ] Implement minimal reader and CLI entry points.
- [ ] Run focused and full tests to green.

### Task 4: Actual solver proof

**Files:** Create `solver/SOLVER.lock`, `solver/configs/btn-vs-bb-srp-flop.toml`, `solver/run-proof.ps1`, and a small proof record under `proof/`.

**Interfaces:** `solver/run-proof.ps1` builds/runs the pinned solver, exports a raw decision with strategies and action EVs, invokes canonicalization, validates the result, reads a question, and writes hashes/metrics.

- [ ] Clone the selected revision under `.local/solver/` and inspect the real export contract.
- [ ] Add a script-level test/dry-run guard for missing tools and malformed output.
- [ ] Run the smallest representative BTN vs BB SRP solve.
- [ ] Convert and validate at least one real combo decision.
- [ ] Record revision, commands, convergence, and SHA-256 digests without committing large output.

### Task 5: Source-of-truth closeout

**Files:** Update `README.md`, `docs/DECISIONS.md`, and `docs/PROGRESS.md`.

**Interfaces:** A new session can determine completed work, limitations, reproduction steps, and the next task from the repository alone.

- [ ] Run `npm test`, `npm run check`, and the real-solver proof command.
- [ ] Reconcile every completion claim with fresh command output.
- [ ] Update status and decisions, including any solver fallback.
- [ ] Inspect `git diff` and `git status` for accidental artifacts or secrets.

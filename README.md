# poker-gto-trainer

A personal GTO-based poker training system that turns real solver solutions into fast practice, durable training history, leak detection, review, and—later—AI coaching.

The project is in **Phase 0: GTO Data Foundation**. The immediate goal is a verified vertical slice for a 6-max NLHE BTN vs BB single-raised pot:

```text
Actual OSS solver
  -> solver-specific adapter
  -> canonical solution v1
  -> validation
  -> trainer-compatible question
```

Solver frequency and EV data are ground truth. LLM output is never used to manufacture strategy data.

## Repository map

- `AGENTS.md` — rules every development session must follow
- `docs/PRODUCT_SPEC.md` — product scope and phases
- `docs/ARCHITECTURE.md` — Phase 0 boundaries and data flow
- `docs/DECISIONS.md` — durable technical decisions
- `docs/PROGRESS.md` — completed, active, blocked, and next work
- `schema/` — canonical JSON Schema
- `src/` — adapters, validation, and trainer-facing readers
- `solver/` — reproducible solver configs and run instructions (not binaries or large output)

## Development

Requires Node.js 24 or newer. Rust stable is additionally required to reproduce solver runs.

```powershell
npm test
npm run check
npm run proof
```

Generated solver artifacts belong under `.local/` and are ignored by Git.

The first actual-solver proof and its documented provenance boundary live in `proof/btn-bb-srp-flop/`.

See `docs/PROGRESS.md` for the exact current status and next task.

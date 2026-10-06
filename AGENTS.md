# Project instructions

## Product principles

- Build a personal GTO training system, not merely a solution viewer.
- Treat solver output as ground truth. LLMs may explain or coach; they must not invent strategy, frequency, or EV data.
- Deliver vertical slices. The current slice is 6-max NLHE, 10/20 blinds, no ante, 100bb, BTN vs BB single-raised pots.
- Preserve combo identity, bet sizes, complete action history, solver provenance, and numeric precision through every conversion.

## Current priority

Phase 0 is the active phase: actual OSS solver -> adapter -> canonical schema -> validated solution library -> trainer-compatible question. A fixture may support unit tests, but it does not satisfy the milestone.

Read `docs/PROGRESS.md` before starting work and update it before finishing. Record consequential architecture choices in `docs/DECISIONS.md`.

## Development workflow

- Design for extension, implement only the current need.
- Use tests first for behavior changes and run the full relevant suite before reporting completion.
- Keep solver-specific formats behind adapters. Application code consumes only the canonical model.
- Keep generated solver outputs, local solver binaries, caches, secrets, and large solution libraries out of Git.
- Do not add authentication, cloud backends, multi-user infrastructure, distributed jobs, or on-demand solving during Phase 0.
- Major UI work follows: requirements -> desktop/mobile mock -> user review -> implementation. Do not implement unapproved major screens.
- Decide ordinary internal details autonomously. Ask only for major UX/scope, paid services, authentication, recurring cost, major architecture changes, or destructive/irreversible actions.

## Documentation

- Avoid duplicating the full product specification across files.
- `README.md` is the entry point, `docs/PRODUCT_SPEC.md` defines product scope, `docs/ARCHITECTURE.md` defines boundaries, `docs/DECISIONS.md` records decisions, and `docs/PROGRESS.md` records status and next work.
- Update documentation in the same change when behavior, decisions, or status changes.


## Cross-PC Codex handoff standard

This repository must remain resumable from another PC without relying on Codex chat history or uncommitted local files.

### Fixed entry points

At the start of every meaningful session, read in this order:

1. `AGENTS.md`
2. `docs/SPEC.md`
3. `docs/STATUS.md`
4. the canonical documents referenced by those files

Codex conversation history is not a source of truth. Durable requirements, decisions, status, and next steps belong in the repository.

### Start of session

1. Run `git status` and preserve any unrelated local work.
2. Run `git fetch origin`.
3. Read `docs/STATUS.md` and resume the active branch recorded by its canonical handoff document when one exists; otherwise synchronize `main`.
4. Pull with `git pull --ff-only`.
5. Read the specification/status sources before changing code.

Do not discard local changes merely to synchronize.

### During work

- Record durable product or architecture decisions in the repository in the same change as the implementation.
- Do not leave important context only in a Codex conversation, terminal scrollback, or an uncommitted file.
- Keep one coherent task on one branch unless the repository explicitly defines another workflow.

### End of session / PC handoff

Before work is considered safely handed off:

1. Update the canonical handoff document referenced by `docs/STATUS.md` (or `docs/STATUS.md` itself when it is canonical).
2. Record at least: active branch, completed work, next work, verification performed, and blockers/external dependencies.
3. Commit all intended changes.
4. Push the active branch to GitHub.
5. Confirm the pushed branch contains the handoff update.

On another PC, recovery is: fetch -> switch to the recorded branch -> pull -> read `AGENTS.md`, `docs/SPEC.md`, and `docs/STATUS.md`.


## Quick Git sync check

On Windows, run this from the repository root at the start of work and before handing work to another PC:

```powershell
.\git-status.cmd
```

It fetches `origin` and reports the current branch, uncommitted changes, whether pull or push is needed, and whether the current feature branch is merged into `main`. If GitHub CLI (`gh`) is available, PR state is used for a more precise merge result; otherwise Git history/patch equivalence is used as a fallback.

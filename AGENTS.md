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

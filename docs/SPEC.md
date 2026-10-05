# Specification entry point

This file is the fixed specification entry point for Codex sessions. It intentionally indexes the existing source-of-truth documents instead of duplicating them.

## Canonical sources

1. `docs/PRODUCT_SPEC.md` — product scope and phases.
2. `docs/ARCHITECTURE.md` — architecture and boundaries.
3. `docs/DECISIONS.md` — durable architecture/product decisions.
4. `AGENTS.md` — repository operating rules.

Solver output remains the source of truth for strategy, frequency, and EV data.

## Update rule

When product scope or architecture changes, update the canonical document above in the same change. Keep this file stable so every PC has one known starting path.

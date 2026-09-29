# Phase 0 GTO Data Foundation design

## Intent and success

The first durable value is a narrow, trustworthy path from a real OSS postflop solve to one BTN vs BB SRP trainer question. Success requires actual solver-derived combo strategy and per-action EV data, full provenance, deterministic conversion, validation, and an application reader. Fixtures support tests but do not count as milestone completion.

## Scope

This design covers repository source-of-truth documentation, solver selection and pinning, Canonical Solution v1, one solver adapter, a minimal BTN vs BB SRP configuration, a trainer-question reader, automated tests, and a real-solver proof. It excludes UI, history storage, sessions, leak detection, AI, cloud sync, and broad solution generation.

## Chosen design

Keep the solver as an external build/run concern and use an ignored raw artifact as the handoff. A solver-specific adapter reads a versioned, machine-readable decision export and produces one canonical decision-node JSON document. Semantic validation runs before output. The trainer question reader consumes canonical documents only.

The initial candidate is pinned `ucsandman/postflop`; it is preferred over TexasSolver and the b-inary engine for its CLI, deterministic solve, measured exploitability, JSON round trip, and MIT license. If its CLI cannot produce action EVs in a stable machine-readable form, replace only the runner/exporter with a thin `b-inary/postflop-solver` program; canonical and trainer boundaries remain unchanged.

## Data contract

Canonical v1 stores schema/solution IDs; game and spot state; ordered action history; exact hero combo; ordered action IDs with kind and sizing; aligned frequency and EV vectors; best EV; solve provenance; and raw artifact digest. Validation rejects unknown schema versions, malformed or colliding cards, duplicate actions, non-finite numbers, frequencies outside `[0,1]` or not summing to one within `1e-6`, absent EVs, and a best EV inconsistent with the maximum action EV.

## Reproducibility

The repository commits the solver URL/revision, config, and run command. Local solver checkout and outputs live under `.local/`. Proof metadata records solver version/revision, config SHA-256, raw SHA-256, canonical SHA-256, convergence metrics, timestamp, and exact command. No generated value is silently rounded.

## Testing

Use Node's built-in test runner and TDD. Unit tests cover valid mapping plus each integrity failure class. An integration test converts a committed small raw fixture and reads a question. The milestone command additionally runs the actual solver and validates the generated question.

## Risks

- A solver may expose strategies but not stable machine-readable action EVs. The adapter must reject the artifact rather than infer EV; the runner fallback isolates this risk.
- A very small solve may be fast but unrepresentative. It is acceptable for plumbing proof, and provenance/convergence are visible so it cannot be mistaken for a production library.
- Solver source or output formats may change. Pinning revisions and failing on format versions makes drift explicit.

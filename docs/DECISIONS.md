# Architecture decisions

## ADR-001 — Canonical decision-node files

**Status:** Accepted — 2026-09-25

Store one independently validated decision node per canonical file. This is the smallest useful trainer artifact, keeps Phase 0 focused, and permits a future library index without forcing a database or cloud design now.

## ADR-002 — Solver selection for the first proof

**Status:** Provisional — 2026-09-25

Use `ucsandman/postflop` as the first executable candidate because it provides a headless Windows-capable Rust CLI, exact combo handling, deterministic parallelism, measured exploitability, versioned JSON output, per-hand strategy/EV inspection, active source history, and an MIT license. Pin a source revision for reproducibility.

`b-inary/postflop-solver` remains the fallback: it has a mature API exposing `expected_values_detail`, but its desktop project is suspended and AGPL integration has distribution implications. TexasSolver can dump JSON and has broader history, but its console/output contract and licensing guidance make automated adapter integration less attractive for the first proof. Revisit this decision if the selected CLI cannot export machine-readable per-action EVs without patching upstream internals.

## ADR-003 — TypeScript without runtime dependencies for the boundary

**Status:** Accepted — 2026-09-25

Implement canonical validation, adapters, and trainer-facing reads in TypeScript on Node.js 24 using the built-in test runner. Phase 0 needs no framework, ORM, state library, or web scaffold. This reduces setup while keeping application-facing code in the intended language.

## ADR-004 — Generated solutions stay outside Git

**Status:** Accepted — 2026-09-25

Ignore `.local/` and keep solver checkouts, binaries, and generated output there. Commit only small, audited fixtures and proof metadata needed for deterministic tests. Large canonical libraries will use local cache plus external durable storage after real sizes and access patterns are measured.

## ADR-005 — Hosted WASM is acceptable for the first actual-solve proof

**Status:** Accepted with follow-up — 2026-09-28

Use the upstream project's official hosted WebAssembly workbench for the first actual solve because the current Windows host has Rust but lacks the MSVC linker and Windows SDK, and installing Visual Studio Build Tools was not authorized. The upstream UI states that the browser uses the same Rust engine as the CLI, single-threaded.

Do not pretend the hosted deployment's commit is known. Record `sourceRevision: null`, the official execution URL, engine label, config hash, measured convergence, and numeric source precision. Commit only the audited decision-node extraction. This establishes the actual-solver vertical slice while leaving full native CLI solve/export/adapter automation as explicit follow-up.

## ADR-006 — Bind every extracted decision to solver node and acting side

**Status:** Accepted — 2026-09-28

Require adapter context to name the expected solver node and derive the expected actor from the solver's OOP/IP marker. Reject the conversion when either differs from the canonical spot. This prevents a valid-looking strategy from being attached to the wrong game state. Proof verification also recomputes both raw-input and solver-config digests before comparing canonical and trainer artifacts.

## ADR-007 — Dependency-free browser mock boundary

**Status:** Accepted — 2026-09-29

Keep the MVP UX mock in `mock/` as native HTML, CSS, and browser JavaScript served by a small Node static server. The repository has no existing frontend runtime, and the approved mock is for interaction validation rather than production delivery. This avoids changing the Phase 0 dependency boundary while allowing localStorage resume and the full five-state flow. The mock's dummy catalog must remain replaceable and must not be treated as solver-backed training data.

## ADR-008 — Trainer action evaluation labels

**Status:** Accepted — 2026-09-29

Classify a selected action against the solver's per-action frequency: `BEST` is the highest-frequency action at the decision node, `GOOD` is a non-primary action with frequency greater than zero, and `MISTAKE` is an action with zero solver frequency. This preserves mixed-strategy nuance: a `GOOD` action is still inside the solver-approved range and must not be presented as an outright error.

## ADR-009 — First production-data UI cutover

**Status:** Accepted — 2026-09-29

Wire the verified `btn-bb-srp-qh7s2c-node0:QcQd` trainer question into the FLOP+ mock catalog first. Preserve its canonical numeric values after chip-to-big-blind display conversion, keep the full action history, and show solver provenance in the question view. Keep remaining catalog entries marked as dummy until automated full-export ingestion and library expansion are complete.

## ADR-010 — Local MVP training history

**Status:** Accepted — 2026-09-29

Store answer attempts in a versioned localStorage history alongside the resumable session. Each entry keeps the problem ID, selected action, evaluation, Solver-derived values, timestamp, and a problem snapshot so later review can reproduce the question even if the catalog changes. Review Mistakes creates a new local review session from stored zero-frequency answers; a future production history store can replace this boundary without changing trainer question semantics.

## ADR-011 — Canonical library registration boundary

**Status:** Accepted — 2026-09-29

Register only validator-approved canonical solution files in the solution library. The index is deterministic and keyed by `solutionId:heroCombo`, rejects duplicate question identities, and stores only lookup metadata plus a relative canonical-file path. Raw Solver export parsing remains upstream of this boundary and is not inferred from an undocumented full-export shape.

## ADR-012 — Full-solution extraction must preserve action EVs

**Status:** Accepted — 2026-09-29

Treat the upstream solution file as a versioned full-tree artifact, not as a flat trainer-question list. The official CLI can rebuild a node and print per-combo action frequencies, while the trainer canonical contract also requires per-action EVs. Therefore the extractor must consume an official export/API that includes EVs or add a solver-side export extension; it must never infer EVs from frequencies or assign synthetic values.

## ADR-013 — Mobile release starts as a PWA

**Status:** Accepted — 2026-09-29

Ship the current trainer UI as an installable PWA first: static HTTPS hosting, manifest, icons, service-worker shell caching, and browser-local history. A later App Store/Google Play release may wrap the same web app with Capacitor; a separate Swift/Kotlin rewrite is not part of the current MVP.

GitHub Pages is the first hosting target because the repository already has a GitHub remote and Pages provides the HTTPS origin required for browser installation. The deployment workflow publishes only `mock/`; no Solver binaries, ignored `.local/` data, or secrets are included.

## ADR-014 — Official JSON export is not sufficient without combo EV rows

**Status:** Accepted — 2026-09-29

The official workbench JSON export was inspected and downloaded for a real turn solve. It contains node action vectors, combo ordering, and per-combo strategy frequencies, but not per-action EV values. The Inspector UI displays those EV rows separately. Therefore the trainer ingestion path accepts only an EV-bearing export or an audited Inspector extraction; it never derives EV from frequency, regret, or exported aggregate values. Until additional EV-bearing records are available, remaining mock entries are explicitly labeled as non-GTO example data.

# Solver EV Library Expansion Design

## Goal

Expand the trainer's question library with additional Solver-backed BTN-vs-BB single-raised-pot postflop decision nodes that preserve per-combo action frequencies, per-action EVs, action history, and solver provenance. Remove fabricated strategy values from the user-facing training catalog.

## Scope

- Keep the current Phase 0 slice: six-max NLHE, 10/20 blinds, no ante, 100bb, BTN vs BB SRP.
- Add a repeatable path from the official `ucsandman/postflop` solution JSON/export to audited canonical decision files.
- Accept only exports that contain both action frequencies and per-action EVs for the selected combo.
- Register only validator-approved canonical files in the existing deterministic solution-library index.
- Make the mock trainer consume the validated library entries rather than the hand-written dummy catalog.
- Keep raw solver outputs, binaries, caches, and large libraries outside Git.

## Non-goals

- Preflop solving or preflop GTO charts.
- Inferring EV from frequency, equity, or action ranking.
- Adding an on-demand solver, backend, authentication, or cloud persistence.
- Replacing the canonical schema or introducing a second solver-specific format in UI code.

## Design

The solver-specific extraction remains upstream of the canonical boundary. A small extraction command will read an official full solution/export, identify a requested node and hero combo, and emit the existing adapter input shape only when the export supplies action EVs. The adapter will continue to validate node identity, acting side, action alignment, frequency normalization, and numeric precision. Each selected node becomes one canonical file and one trainer question identity.

The production mock catalog will load a checked-in small manifest of audited canonical-derived trainer records, while the source solver output and any large generated library remain local/ignored. The manifest must retain `solutionId`, hero combo, board, action history, action list, strategy values, EV loss, and provenance needed by the current feedback view. Dummy questions may remain available only behind an explicit development fixture path; they must not be selected by RANDOM, PREFLOP, or FLOP+ production modes.

Because the upstream CLI's documented `show --combo` output is human-readable while the browser workbench provides JSON export, the first supported acquisition path is the official JSON export/API. If a supplied export lacks per-action EVs, ingestion fails with a precise diagnostic and does not create a canonical file.

## Acceptance criteria

1. A representative official export containing multiple combos and actions produces multiple validated canonical trainer records without rounding strategy or EV values.
2. An export missing action EVs is rejected and cannot enter the library.
3. Duplicate `solutionId:heroCombo` identities are rejected by the library index.
4. The user-facing catalog contains no fabricated frequency/EV values and has enough varied hero combos for the requested training set once the audited exports are supplied.
5. Existing proof verification, canonical tests, mock session tests, and browser behavior remain green.
6. `docs/PROGRESS.md` and `docs/DECISIONS.md` document the acquisition boundary, verified data count, and any remaining external-solver limitation.

## Open operational dependency

The code can make the ingestion path deterministic, but actual additional questions require official EV-bearing exports for additional boards/nodes. Until those exports are available, the trainer must not pretend that fixture values are Solver truth.

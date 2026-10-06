# Progress

Last updated: 2026-10-06

## Completed

- Initial product handoff consolidated into repository documentation.
- Phase 0 architecture and decision boundaries defined.
- Initial solver comparison completed; `ucsandman/postflop` selected provisionally with `b-inary/postflop-solver` as fallback.
- Local Rust stable toolchain installed for solver verification.
- Canonical Solution Schema v1, semantic validator, solver adapter, CLIs, and trainer question reader implemented.
- Actual official-hosted WASM solve completed for the BTN-vs-BB SRP flop slice: Qh 7s 2c, 50 iterations, 149,361 nodes, 0.0372% pot exploitability.
- Audited QcQd decision converted to canonical chips data and a trainer-compatible question with action frequency, action EV, best EV, and EV loss.
- Cross-platform deterministic proof verification added as `npm run proof`; it rechecks the raw artifact hash, solver config hash, canonical output, and trainer question.
- Solver node identity and OOP/IP actor mapping are enforced at the adapter boundary; runtime validation now rejects nested fields forbidden by the canonical schema.
- The proof's six-max preflop action history now records all folds, the BTN raise, and the BB call.
- MVP mock design was approved and recorded in `docs/superpowers/specs/2026-09-29-mvp-mock-design.md`; implementation plan is recorded in `docs/superpowers/plans/2026-09-29-mvp-mock-implementation.md`.
- MVP mock implemented under `mock/`: Home, New Session, Question, Feedback, Session Result, normal ten-question sessions, PLAY THROUGH three-hand sessions, and one-session localStorage resume.
- Browser walkthrough verified the normal flow, reload-to-Feedback resume, PLAY THROUGH hand/decision counts, and inert future Review/Full Range actions.
- Visual refresh applied after UX review: lighter surface/background palette, stronger section contrast, and color-coded cards/actions/results.
- Action flow clarity improved: history now uses numbered vertical timeline steps, street labels, action-tone colors, and an explicit current-decision marker.
- Fixed postflop action candidates: every spot that shows a BTN bet now exposes FOLD, CALL, and RAISE.
- Evaluation rule agreed: highest-frequency solver action is BEST, non-primary positive-frequency actions are GOOD, and zero-frequency actions are MISTAKE.
- Verified Solver proof node is now wired into the FLOP+ mock catalog with its canonical frequencies, EVs, complete preflop history, and visible provenance label; remaining mock entries are still explicitly dummy data.
- Added versioned local history accumulation, mistake counts on Home, and a Review Mistakes session sourced from stored MISTAKE answers.
- Normal session selection now samples ten unique problems without replacement instead of taking a fixed first-ten slice.
- Review sessions preserve an in-progress normal session in a separate local resume slot, so starting review does not discard unfinished training.
- Added a canonical solution-library index builder that validates every input before registering a deterministic `solutionId:heroCombo` question identity.
- Added PWA install metadata, app icons, service-worker offline shell caching, and manifest MIME handling to the browser mock.
- Localized the mock trainer UI and PWA metadata to Japanese while retaining `BEST` / `GOOD` / `MISTAKE` evaluation labels and English poker action labels.
- Added a GitHub Pages Actions workflow that publishes only `mock/` over the repository's HTTPS Pages URL.
- Confirmed against the upstream CLI source that saved solutions are versioned full-tree files and `solver show --combo` exposes frequencies; per-action EVs still require the workbench/export path or an upstream export extension, so no unsafe flat-file parser was added.
- Added an EV-preserving postflop export extraction boundary with rejection tests for missing EVs, unknown combos, duplicate actions, and numeric precision changes.
- Added canonical-to-trainer manifest conversion with duplicate question identity checks and display-safe BB conversion.
- Fixed feedback transitions to reset the viewport to the top and explained that the range area shows representative combos rather than a complete range.
- Solver-backed questions now show provenance; hand-written mock entries are visibly labeled `仮データ（GTOではありません）` until replaced.
- Official Workbench Inspector extraction path was verified: the EV view exposes per-combo frequencies, per-action EVs, and aggregate EV; an audited sample of 5 hand classes / 18 combos was read successfully.
- PokerData catalog verification found a materially better source candidate: 6-max NLHE preflop API coverage includes all six seats, action-path nodes, frequencies, and per-hand EV; its postflop catalog currently lists 22 100bb heads-up packs across multiple opener/defender positions, with 49 boards and EV marked for the listed packs.

## In progress

- Closing the remaining automation gap between the solver's full native/hosted JSON export and the small adapter input, specifically per-combo action EV rows.

## Remaining

- Run the pinned native CLI once MSVC Build Tools/Windows SDK are available, without changing the canonical boundary.
- Automate full solution JSON -> audited decision extraction, including per-action EVs, instead of the current human-audited Inspector extraction.
- Feed the future full-export extractor into the canonical library index builder once the native/hosted export path is available.
- Obtain an official EV-bearing export/API for multiple nodes before expanding the production library; frequencies alone are insufficient for the canonical trainer contract.
- Expand the solution library beyond the one proof node only after full export ingestion is reliable.
- Review the MVP mock UX before replacing its remaining dummy catalog entries with production data.
- Replace dummy mock data with canonical trainer questions only after the production question-selection and history boundaries are approved.
- Acquire and audit enough EV-bearing combo rows to build the first ten-question Solver-backed catalog.

## Blocked

The current Windows host lacks the native MSVC linker and Windows SDK. Installing Visual Studio Build Tools was not authorized. An official Workbench JSON export was downloaded successfully, but its schema contains frequencies without per-action EV rows. Inspector extraction is possible and was verified, but the currently available Workbench spot is HU while the product slice is six-max. PokerData is now the preferred source candidate for a connected six-max preflop/postflop slice; API entitlement and data-use terms still need confirmation before importing production data.

## Next

Automate the remaining full-export ingestion boundary, then replace the mock catalog with canonical questions and define production history/session persistence.

## Handoff — 2026-10-06

- Active branch: `codex/solver-ev-library-expansion`.
- Completed in this handoff: EV-bearing postflop export extraction, canonical-to-trainer manifest conversion, rejection tests, and mock provenance/range messaging updates.
- Verification: `npm test` — 52 passed; `npm run check` — passed; `git diff --check` — passed.
- Blockers/external dependencies: native MSVC/Windows SDK remains unavailable; the upstream Workbench export still lacks per-action EV rows; PokerData entitlement and data-use terms require confirmation.
- Next work: obtain an official EV-bearing six-max source, then expand the validated production catalog beyond the proof node.

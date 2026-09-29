# Progress

Last updated: 2026-09-29

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

## In progress

- Closing the remaining automation gap between the solver's full native/hosted JSON export and the small adapter input.

## Remaining

- Run the pinned native CLI once MSVC Build Tools/Windows SDK are available, without changing the canonical boundary.
- Automate full solution JSON -> audited decision extraction, including per-action EVs, instead of the current human-audited Inspector extraction.
- Feed the future full-export extractor into the canonical library index builder once the native/hosted export path is available.
- Obtain an official EV-bearing export/API for multiple nodes before expanding the production library; frequencies alone are insufficient for the canonical trainer contract.
- Expand the solution library beyond the one proof node only after full export ingestion is reliable.
- Review the MVP mock UX before replacing its remaining dummy catalog entries with production data.
- Replace dummy mock data with canonical trainer questions only after the production question-selection and history boundaries are approved.

## Blocked

The current Windows host lacks the native MSVC linker and Windows SDK. Installing Visual Studio Build Tools was not authorized. The hosted workbench completed the actual solve, but its large full JSON export did not complete through the automated browser download channel; action EVs were therefore audited from the official Inspector at recorded precision.

## Next

Automate the remaining full-export ingestion boundary, then replace the mock catalog with canonical questions and define production history/session persistence.

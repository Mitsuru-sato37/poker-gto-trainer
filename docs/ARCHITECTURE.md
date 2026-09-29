# Architecture

## Phase 0 data flow

```text
Pinned OSS solver + committed config
             |
             v
Ignored raw solution artifact
             |
             v
Solver adapter (only solver-aware application component)
             |
             v
Canonical solution v1 + validation
             |
             v
Solution-library file
             |
             v
Trainer question reader
```

The canonical boundary prevents the trainer, browser, analysis, and history features from depending on a solver's file format. Solver binaries and large raw/canonical datasets remain local or in future external storage; code, schema, small audited proof artifacts, configs, and tests belong in Git.

## Components

- `schema/canonical-solution-v1.schema.json` is the interchange contract.
- `src/canonical/validate.ts` enforces semantic invariants JSON Schema alone cannot express, including action-vector alignment, normalized frequencies, unique combos/actions, finite values, and best-EV consistency.
- `src/adapters/` converts one pinned solver format into the canonical model. Adapters fail loudly on unsupported format versions or missing action EVs; they never synthesize ground truth.
- `src/questions/read-question.ts` is the first application consumer and exposes only trainer-ready state.
- `solver/configs/` holds reproducible solve inputs. `.local/solver/` and `.local/solutions/` hold ignored binaries and outputs.

## Canonical model

One canonical file describes one decision node. This deliberately small unit is independently versioned, validated, addressable by `solutionId`, and directly usable as one trainer question. A later library index can reference many such files without changing their contents.

Amounts use chips as stored numeric values plus optional pot fractions. Cards use rank+suit notation (`As`, `Td`) and combos are two concatenated cards (`AsJs`). Frequencies are decimal probabilities in `[0, 1]`; EVs and EV loss use chips. Numeric values are not rounded by the adapter.

## Failure handling

Conversion is atomic at the file level: parse, adapt, validate, then write. Unknown raw formats, illegal cards, board collisions, duplicate actions, misaligned arrays, non-normalized frequencies, absent EV data, and inconsistent best EV fail with contextual errors. A failed conversion never emits a canonical artifact.

## Testing strategy

- unit fixtures prove adapter mapping and rejection behavior;
- canonical validation tests pin data-integrity invariants;
- question-reader tests prove the application can consume only canonical data;
- `npm run proof` converts the audited actual-solver decision, validates it, reads a trainer question, and compares both artifacts with the committed proof;
- the real-solver proof records the candidate revision, hosted execution URL, config digest, raw artifact digest, solve metrics, and source precision;
- rerunning the solver itself is currently a documented hosted-workbench step; native CLI solve/export automation remains follow-up work.

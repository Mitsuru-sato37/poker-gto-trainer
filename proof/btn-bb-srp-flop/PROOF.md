# Phase 0 actual-solver proof

This directory contains a small, auditable decision extracted from an actual solve by the official hosted WebAssembly build of `ucsandman/postflop`. It is not a test fixture.

## Spot and run

- Game: 6-max NLHE, blinds 10/20, no ante, 100bb starting effective stack
- Preflop: UTG, HJ, and CO fold; BTN raises to 50; SB folds; BB calls 30; flop pot 110
- Board: Qh 7s 2c
- OOP range: `KK,QQ`; IP range: `AJs,TT`
- Tree: 33% pot bet on flop, turn, and river; no raises
- Run: 50 iterations, 149,361 nodes, browser engine time 10.125s
- Measured exploitability: 0.002045bb = 0.0409 chips = 0.0372% of the starting pot
- Engine label: 0.1.0
- Execution: <https://postflop-workbench.vercel.app/>

## Audited decision

At node 0, BB holds QcQd and acts first on Qh 7s 2c:

| Action | Frequency | Action EV |
| --- | ---: | ---: |
| Check | 0.705661 | 54.86 chips (2.743bb) |
| Bet to 36.4 chips (1.82bb) | 0.294339 | 55.00 chips (2.750bb) |

Frequency is read from the Inspector strategy bar's inline percentage width, which exposes six decimal places as a probability. Action EV is read from the Inspector combo-row title attributes, which expose 0.001bb; `provenance.actionEv.precision` records the corresponding 0.02-chip precision. The bet amount is the workbench tree's displayed `bet to 1.82`; its requested sizing remains recorded separately as `potFraction: 0.33`.

## Provenance boundary

The candidate source checkout is pinned in `solver/SOLVER.lock`. The official hosted page does not expose its deployed Git commit, so the proof intentionally records `sourceRevision: null` plus the official execution URL. Claiming the inspected checkout SHA as the deployed revision would be false precision.

The full 149,361-node browser JSON export did not complete through the automated browser download channel. `raw-decision.json` is therefore a small, human-audited extraction of the actual solver result, not the untouched full solution file. This proves actual solve -> adapter -> canonical -> trainer question, but a fully automated full-export ingestion remains follow-up work.

Run `npm run proof` to recreate the canonical and trainer artifacts from the audited raw decision and compare them deterministically with the committed copies.

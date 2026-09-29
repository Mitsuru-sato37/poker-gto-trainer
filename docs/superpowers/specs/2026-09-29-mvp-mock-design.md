# Poker GTO Trainer MVP Mock Design

## Intent

Create an interactive, mobile-first mock of the MVP learning loop so the product can be evaluated by touch and navigation before backend or solver integration:

```text
Home -> New Session -> Question -> Feedback -> next Question -> Session Result
```

This is a UX validation surface, not the production trainer. It uses separated dummy data while preserving the canonical product vocabulary: decision, action, frequency, EV, EV loss, and evaluation.

## Scope

The mock includes five connected surfaces/states:

1. Home
2. New Session
3. Question
4. Feedback
5. Session Result

Supported session types:

- `RANDOM`: ten unique dummy questions.
- `PREFLOP`: ten unique preflop questions.
- `FLOP+`: ten unique flop, turn, or river questions.
- `PLAY_THROUGH`: three hands with one or more street decisions per hand; this mode is not a ten-question session.

The mock does not implement solver calls, Full Range, AI explanations, backend persistence, authentication, advanced review selection, detailed Analysis, Settings, or a complete poker engine.

## Technical shape

Keep the existing Node.js repository and avoid introducing a frontend framework or runtime dependency for this mock. Add a small browser surface under `mock/`:

- `mock/index.html` — document shell and accessible landmarks.
- `mock/styles.css` — mobile-first visual system and responsive layout.
- `mock/app.js` — state machine, rendering, event handling, and local persistence.
- `mock/data/problems.js` — dummy problem and PLAY THROUGH data.
- `mock/README.md` — local preview instructions and mock boundary.

Add a dependency-free Node static preview command only if the existing repository has no suitable preview command. Do not alter the canonical solver adapter or schema to serve the mock.

## State model

The application owns one in-memory `AppState`:

```text
screen: home | new-session | question | feedback | result
session: null | SessionState
```

`SessionState` contains:

```text
id
type
modeLabel
items[]
currentIndex
answers[]
startedAt
updatedAt
status: in-progress | complete
```

Each normal item references one problem ID. Each PLAY THROUGH item references a hand ID and a decision index. The item reference prevents the session from duplicating the problem object and lets the same data layer support both session units.

`answers[]` records:

```text
problemId
sessionId
selectedAction
solverFrequency
selectedActionEv
bestActionEv
evLoss
evaluation
isFirstAttempt
answeredAt
```

The active session is serialized to `localStorage` under one versioned key. Invalid or incompatible saved state is ignored and replaced with a fresh Home state. Only one unfinished session is retained in the mock.

## Interaction rules

- Selecting an action commits the answer immediately; there is no confirmation dialog.
- The Question screen changes into Feedback state in place.
- `NEXT` advances to the next item and clears transient feedback state.
- Completing the final normal item opens Session Result.
- Completing the final decision of the final PLAY THROUGH hand opens Session Result.
- A terminal PLAY THROUGH decision ends the current hand and advances to the next hand.
- Home shows `SESSION IN PROGRESS` when an unfinished session exists and provides Continue.
- Starting a new session replaces the existing unfinished session only after the user chooses the New Session flow; no hidden automatic merge occurs.
- Normal session item selection is deterministic within the mock and has no duplicate IDs.

## Evaluation display

Dummy actions carry `frequency`, `ev`, `evLoss`, and `evaluation`. The UI displays the supplied evaluation and does not derive BEST/GOOD/MISTAKE from an invented threshold.

- BEST is the EV-optimal action and may include multiple actions in future data.
- GOOD is acceptable according to the dummy record.
- MISTAKE is materially costly according to the dummy record.

Frequency is shown numerically and as a horizontal bar. Action amount is primarily shown in BB, with pot percentage as secondary text when available. EV and EV loss are displayed in BB for the mock's training vocabulary.

## Screen requirements

### Home

Show today's new-question count, total new-question count, BEST rate, ACCEPTABLE rate, average EV loss, and a New Session CTA. If an unfinished session exists, show its progress and a Continue CTA near the top.

### New Session

Show four mode cards and a disabled or clearly marked Custom Training entry. The mode description must distinguish normal ten-question sessions from three-hand PLAY THROUGH.

### Question

Show progress, positions, pot type, stack, board, hero hand, pot, complete action history, and available actions. Action controls must be large enough for touch use and keyboard reachable.

### Feedback

Keep a compact problem summary visible. Show the selected action, evaluation, GTO strategy bars, action EV, EV loss, fixed WHY text, a compact hero-centered range grid, and a bottom-fixed Next control. Full Range is a visible but non-functional future entry point.

### Session Result

Normal sessions show total questions and BEST/ACCEPTABLE/MISTAKE counts plus average EV loss. PLAY THROUGH additionally shows hands and decisions. Provide New Session, Home, and a non-functional Review Mistakes entry point.

## Responsive and accessibility requirements

- Mobile is the reference layout; desktop centers the working surface with a readable maximum width.
- No horizontal scrolling at supported widths.
- Body text is at least 16px; frequently used labels and controls are at least 14px.
- Action buttons have visible focus states and semantic button elements.
- Color is not the only signal for evaluation; pair colors with labels and icons/text.
- Fixed bottom navigation must not cover the last content item; reserve bottom padding.

## Verification

Manual verification in a mobile-sized browser must cover:

1. Home -> New Session -> ten unique normal questions -> Feedback -> Result.
2. Reload during an unfinished session -> Home -> Continue -> same question.
3. PLAY THROUGH -> multiple decisions -> hand transition -> three-hand result showing both counts.
4. Feedback frequency bars, EV/EV loss, WHY, and range area render without changing solver data.
5. Existing Phase 0 tests and proof command remain green.


# Poker GTO Trainer MVP Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build a mobile-first, locally runnable mock that connects Home, New Session, Question, Feedback, and Session Result for normal ten-question sessions and three-hand PLAY THROUGH sessions.

**Architecture:** Add a dependency-free browser surface under `mock/` without changing the Phase 0 canonical model or solver adapter. Keep dummy problem data separate from rendering, keep session transitions in a small pure state/persistence module, and let the browser shell render the five states from that model.

**Tech Stack:** Existing Node.js 24 repository, native browser HTML/CSS/JavaScript modules, Node's built-in test runner, and a small dependency-free Node static server for local preview.

**Spec:** `docs/superpowers/specs/2026-09-29-mvp-mock-design.md`

## Global Constraints

- The mock is a UX validation surface, not the production trainer.
- Use separated dummy data; do not connect the solver or alter canonical schema/adapter files.
- Normal modes are ten unique questions; PLAY THROUGH is three hands and is not a ten-question session.
- Selecting an action commits immediately and changes Question into Feedback state in place.
- Retain at most one unfinished session in versioned `localStorage` state.
- Mobile is the reference layout; desktop must remain readable without horizontal scrolling.
- Do not add backend, authentication, AI explanation generation, advanced review algorithms, Full Range, detailed Analysis, Settings, or a complete poker engine.
- The repository's Git metadata is read-only; use verification results and working-tree status instead of committing during this task.

## Review Focus

- A normal session must never contain duplicate problem IDs; test session creation with a catalog larger than ten.
- Reloading an unfinished session must restore the same current item and answers; test serialize/restore with a mid-session answer.
- One action click must create exactly one answer and show Feedback; test repeated answer attempts are rejected while feedback is active.
- PLAY THROUGH must count hands separately from decisions and transition terminal hands correctly; test a fold/terminal decision followed by the next hand.
- Future Full Range and Review Mistakes affordances must not mutate session state; test them as inert UI actions.

### Task 1: Dummy catalog and session state engine

**Files:**
- Create: `mock/data/problems.js`
- Create: `mock/session.js`
- Create: `test/mock/session.test.ts`

**Interfaces:**
- `mock/data/problems.js` exports `PROBLEMS`, `PLAY_THROUGH_HANDS`, and catalog selectors for `RANDOM`, `PREFLOP`, and `FLOP+`.
- `mock/session.js` exports `SESSION_STORAGE_KEY`, `createSession(type, catalog, now)`, `getCurrentItem(session, catalog)`, `recordAnswer(session, answer, now)`, `advanceSession(session, now)`, `serializeSession(session)`, and `restoreSession(raw)`.
- `SessionState` carries `id`, `type`, `modeLabel`, `items`, `currentIndex`, `answers`, `startedAt`, `updatedAt`, and `status`.

- [ ] **Step 1: Write failing catalog and state tests**

  Test catalog selectors return enough unique data for all three normal modes, session creation returns ten unique normal items, PLAY THROUGH returns three hands with decision references, and answer records contain the specified history fields.

- [ ] **Step 2: Run the focused tests and confirm they fail because the mock modules do not exist**

  Run: `node --test test/mock/session.test.ts`

  Expected: module-not-found failures for the new mock modules.

- [ ] **Step 3: Implement the dummy data contract in `mock/data/problems.js`**

  Include realistic six-max BTN/BB dummy spots with street, board, hero hand, action history, pot, available actions, fixed WHY text, and hero-centered `rangeData`. Every action must include label, amount when relevant, pot percentage when relevant, frequency, EV, EV loss, and evaluation.

- [ ] **Step 4: Implement pure session transitions in `mock/session.js`**

  Use immutable-returning helpers. Normal sessions store problem IDs; PLAY THROUGH stores hand ID plus decision index. `recordAnswer` rejects a second answer for the current item, and `advanceSession` marks the session complete only after the final item/decision.

- [ ] **Step 5: Implement versioned local persistence helpers**

  `serializeSession` writes a version marker; `restoreSession` returns `null` for malformed, incompatible, or incomplete payloads rather than throwing into the UI.

- [ ] **Step 6: Run focused tests and verify all state invariants pass**

  Run: `node --test test/mock/session.test.ts`

  Expected: all catalog, duplicate prevention, answer, PLAY THROUGH, and persistence tests pass.

### Task 2: Browser shell and five-state interaction flow

**Files:**
- Create: `mock/index.html`
- Create: `mock/app.js`
- Modify: `mock/session.js` only if browser integration exposes a tested state boundary

**Interfaces:**
- `mock/app.js` imports the catalog and session helpers, owns `AppState { screen, session, transientFeedback }`, and renders `home`, `new-session`, `question`, `feedback`, and `result` states.
- DOM events call `startSession(type)`, `continueSession()`, `selectAction(actionId)`, `nextItem()`, `goHome()`, and `showNewSession()`.

- [ ] **Step 1: Add the semantic document shell**

  Create landmarks for header/main/content and an empty app mount. Include a product title, viewport metadata, and accessible page title without adding marketing content.

- [ ] **Step 2: Render Home and New Session states**

  Home shows the requested metrics, New Session CTA, and an in-progress Continue CTA when applicable. New Session distinguishes RANDOM/PREFLOP/FLOP+ ten-question modes from three-hand PLAY THROUGH and marks Custom Training as unavailable.

- [ ] **Step 3: Render Question and immediate Feedback states**

  Question shows progress, positions, pot type, stacks, board, hero hand, pot, full action history, and touch-sized action buttons. Selecting once records the answer and changes the same screen to Feedback without a confirmation dialog or second submit path.

- [ ] **Step 4: Render Feedback details and NEXT**

  Preserve the compact problem summary; show evaluation label, selected action, frequency bars, EV, EV loss, fixed WHY text, a non-functional FULL RANGE entry point, and a bottom-fixed NEXT control with sufficient bottom padding.

- [ ] **Step 5: Render normal and PLAY THROUGH Session Result states**

  Normal results show question count and BEST/ACCEPTABLE/MISTAKE/average EV loss. PLAY THROUGH results show both hand and decision counts. New Session, Home, and Review Mistakes actions have the specified behavior or remain visibly unavailable without mutating state.

- [ ] **Step 6: Wire localStorage resume behavior**

  Persist after session creation, answer, advance, and completion. On page load restore only valid unfinished state and land on Home with Continue; Continue returns to the saved question.

### Task 3: Mobile-first visual system and local preview

**Files:**
- Create: `mock/styles.css`
- Create: `mock/README.md`
- Create: `scripts/serve-mock.mjs`
- Modify: `package.json`

**Interfaces:**
- `npm run mock` serves the repository's `mock/` directory locally without adding runtime dependencies.
- CSS provides the mobile reference layout, responsive desktop max-width, touch targets, focus states, evaluation labels/colors, frequency bars, range grid, and fixed NEXT spacing.

- [ ] **Step 1: Add the intentional visual tokens and mobile layout**

  Use a dark navy poker/GTO surface, readable 16px body text, high-contrast cards, large action controls, and clear BEST/GOOD/MISTAKE labels that do not rely on color alone.

- [ ] **Step 2: Add responsive desktop behavior**

  Center the working surface at larger widths, preserve readable line lengths, and verify there is no unintended horizontal scrolling.

- [ ] **Step 3: Add a minimal static server and preview script**

  Serve only the repository files needed by the mock, return a useful 404, and preserve the existing package scripts. Do not install a frontend framework or package.

- [ ] **Step 4: Document local preview and scope**

  `mock/README.md` explains `npm run mock`, the five screens, dummy-data boundary, localStorage reset behavior, and intentionally unavailable features.

### Task 4: End-to-end verification and project closeout

**Files:**
- Modify: `docs/PROGRESS.md`
- Modify: `docs/DECISIONS.md` only if an implementation choice changes an existing boundary

**Interfaces:**
- Browser manual checklist verifies the full normal flow, reload resume, PLAY THROUGH hand transition, feedback details, and responsive layout.
- Existing Phase 0 commands remain authoritative: `npm test`, `npm run check`, and `npm run proof`.

- [ ] **Step 1: Run existing Phase 0 verification**

  Run: `npm test`; `npm run check`; `npm run proof`.

  Expected: existing tests, syntax checks, and proof reproduction remain green.

- [ ] **Step 2: Run mock syntax and preview checks**

  Run: `node --check mock/app.js`; `node --check mock/session.js`; `node --check mock/data/problems.js`; `npm run mock`.

  Expected: all syntax checks pass and the preview serves `mock/index.html`.

- [ ] **Step 3: Manually exercise the mobile flow**

  Verify ten unique normal questions, immediate Feedback, result counts, reload resume, three-hand PLAY THROUGH counts, inert future links, keyboard focus, and no horizontal scrolling.

- [ ] **Step 4: Update repository status documentation**

  Record the mock's completed scope, local preview command, manual verification result, and remaining production gaps in `docs/PROGRESS.md`. Do not claim solver-backed UI data or production persistence.

- [ ] **Step 5: Inspect the working tree for accidental artifacts**

  Run: `git status --short`; `git diff --check`.

  Expected: only intended source/docs/test files are present; no generated solver outputs, secrets, or large browser artifacts are added.


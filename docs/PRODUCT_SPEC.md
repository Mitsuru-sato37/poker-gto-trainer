# Product specification

## Vision

Build a single-user personal poker training system that learns from training history and prioritizes the spots the player most needs. The long-term loop is solution -> trainer -> history -> leak detection -> review/weakness training -> AI tutor -> next training.

Solver output is the only source of strategy truth. AI may explain solver data and analyze training history but must not invent frequencies, EVs, or strategies.

## Initial game and slice

- No Limit Hold'em, 6-max cash
- Blinds 10/20, no ante, 100bb effective
- First vertical slice: BTN vs BB single-raised pot
- Expand only after a real-solver end-to-end slice works

## Product surfaces

The eventual product has Today's Training, Free Training, Solution Browser, and Analysis. A session contains 10 questions. Results emphasize total and average EV loss rather than binary correctness. Today's Training will eventually mix weakness, review, and general sampling; exact weights are intentionally unset.

## Trainer question and feedback

A question contains game state, exact hero combo, board, complete action history, player to act, and available actions. Feedback contains the chosen action, GTO frequencies, per-action EV, best EV, user EV, and EV loss. Mixed strategies must not be reduced to simplistic correct/incorrect labels.

## Data requirements

Canonical solutions preserve:

- game configuration, pot, positions, street, board, player to act, and complete action history;
- exact two-card combos and suit interactions;
- typed actions and their absolute and pot-relative sizes;
- per-combo action frequency and action EV without unexplained rounding;
- best EV and derivable EV loss;
- solver name/version, source revision, configuration, solve metrics, solution version, and generation time.

Training history must later retain enough of this state to reproduce and reanalyze every answer.

## MVP

The MVP is a usable BTN vs BB SRP trainer backed by a limited but real solver dataset. It includes action choice, immediate frequency/EV/EV-loss feedback, persistent history, 10-question sessions, and a session result. UI implementation begins only after desktop and mobile mocks are approved.

Excluded from the MVP: AI tutor, advanced leak detection, weakness/review algorithms, other positions and pot types, tournaments, accounts, subscriptions, cloud history sync, and on-demand solving.

## Phases

1. GTO Data Foundation — real solver to canonical trainer data.
2. Trainer MVP — approved UI, sessions, feedback, history, results.
3. Leak Detection — statistical analysis centered on EV loss and occurrence.
4. Weakness + Review — personalized selection and spaced review.
5. AI Tutor — grounded question, session, and long-term coaching.

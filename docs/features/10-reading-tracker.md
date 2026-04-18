# 10. Reading Tracker

**Priority:** P2
**Complexity:** S (≤ 2d)
**Depends on:** 02 Profile
**Related tables:** `reading_tracker` (new — see [data-model.md](../data-model.md) Gap 2)
**Related screens:** docx §3.2.7

## Goal

A month-by-month calendar where users mark days they read. Visually simple (day turns green when marked). Encourages habit-building and is the lightest personal feature.

## User stories

- As a user, I can view a calendar for the current month.
- As a user, I can page forward/back to any month.
- As a user, I can toggle a day as "read" / "not read".
- As a user, I can optionally record pages-read for that day.

## Functional requirements

- One row per (user, date); `pages_read` optional.
- Calendar renders a single month at a time; API returns flags for all days of that month.
- Private profiles do not expose tracker to non-followers.

## API surface (sketch)

- `GET /api/tracker?month=YYYY-MM` — returns array of `{ date, pagesRead? }`.
- `PUT /api/tracker/:date` — body `{ pagesRead? }`; upserts.
- `DELETE /api/tracker/:date`

## Out of scope (v1)

- Reading streaks / gamification.
- Goals (e.g. "read 20 books this year").
- Linking tracker entry to a specific book on a shelf.

## Acceptance criteria

- [ ] Toggling a day persists and survives reload.
- [ ] Paging to a month with zero entries returns an empty array (not 404).

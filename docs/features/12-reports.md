# 12. Reports

**Priority:** P3
**Complexity:** S (≤ 2d)
**Depends on:** 04 Posts, 06 Interactions
**Related tables:** `reports`
**Related screens:** docx §2.4.1 (use case), §2.5 (reports table)

## Goal

Let any user flag a post, comment, or user account for moderator review. Feeds the queue consumed by feature 13 (Moderation).

## User stories

- As a user, I can report a post from its overflow menu with a reason.
- As a user, I can report a comment from its overflow menu.
- As a user, I can report a user from their profile.
- As a user, I see a confirmation after submitting; I can only submit one pending report per target.

## Functional requirements

- `reports` row: `reporter_id`, `target_type` (`post`|`comment`|`user`), `target_id`, `reason`, `status = 'pending'`.
- Reason: free text, 10–1000 chars.
- De-dupe: a user cannot have two `pending` reports against the same target.

## API surface (sketch)

- `POST /api/reports` — body `{ targetType, targetId, reason }`.
- `GET /api/reports/me` — reports I've submitted + their current status.

## Out of scope (v1)

- Categorized reasons (enum of reasons).
- Attachments / screenshots.
- Appeals workflow.

## Acceptance criteria

- [ ] Submitting a duplicate pending report returns 409.
- [ ] Reporter receives no sensitive info about the outcome beyond `pending`/`in_review`/`resolved`.
- [ ] Reports are visible in the moderation queue in feature 13.

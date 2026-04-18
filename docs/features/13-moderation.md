# 13. Moderation

**Priority:** P3
**Complexity:** M (3–5d)
**Depends on:** 12 Reports
**Related tables:** `reports`, `moderation_actions`, `posts`, `users`
**Related screens:** docx §2.2.2, §2.4.1

## Goal

Give moderators a queue of incoming reports and a set of actions to resolve each: block a post, warn a user, ban a user, or reject the report.

## User stories

- As a moderator, I see a list of pending reports oldest-first.
- As a moderator, I can open a report, see the target content, and pick an action.
- As a moderator, I must leave a comment explaining the decision.
- As a moderator, my action changes the report status to `resolved` (or `in_review` mid-flow).

## Functional requirements

- Queue: `reports WHERE status IN ('pending','in_review') ORDER BY created_at`.
- Actions (from `moderation_action_type`):
  - `block_post` → hide post from feeds (add `posts.is_blocked` column — schema gap).
  - `warn_user` → send in-app warning (notification system — stub for v1).
  - `ban_user` → flip `users.is_blocked = true`, invalidate sessions.
  - `reject` → dismiss report.
- Taking an action inserts a row in `moderation_actions` and updates `reports.status = 'resolved'` in the same transaction.
- Role-gated: only `moderator` and `admin` can access.

## API surface (sketch)

- `GET /api/moderation/reports?status=&cursor=`
- `GET /api/moderation/reports/:id`
- `POST /api/moderation/reports/:id/claim` — sets `status = 'in_review'`.
- `POST /api/moderation/reports/:id/resolve` — body `{ action, comment }`.

## Out of scope (v1)

- Assigning reports to specific moderators.
- Moderator performance analytics.
- Auto-moderation / ML classifiers.

## Acceptance criteria

- [ ] Non-moderators calling moderation endpoints get 403.
- [ ] Blocking a post hides it from feed, profile, and search but preserves the row for audit.
- [ ] Banning a user blocks login and hides their posts.
- [ ] Every action produces a `moderation_actions` row with author and comment.

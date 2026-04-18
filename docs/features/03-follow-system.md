# 03. Follow System

**Priority:** P1
**Complexity:** M (3–5d)
**Depends on:** 02 User profile
**Related tables:** `follows` (new — see [data-model.md](../data-model.md) Gap 1)
**Related screens:** docx §3.2.2 (follower / following counts)

## Goal

Let users build a reading graph. Public profiles allow instant follow. Private profiles require a follow request that the target can accept or reject. The resulting graph drives feature 05 (Feed).

## User stories

- As a user, I can follow a public profile with one click.
- As a user, I can send a follow request to a private profile.
- As a private-profile owner, I can accept or reject pending requests.
- As a user, I can unfollow anyone at any time.
- As a user, I can see my follower and following lists.

## Functional requirements

- Follow state per pair: `none` | `pending` | `accepted`.
- Unfollow is idempotent and instant; it also cancels a pending request.
- Follower / following counts computed from `follows` with `status = 'accepted'`.
- No self-follow (enforced by CHECK constraint in schema).

## API surface (sketch)

- `POST /api/users/:id/follow`
- `DELETE /api/users/:id/follow`
- `GET /api/users/:id/followers?cursor=`
- `GET /api/users/:id/following?cursor=`
- `GET /api/users/me/follow-requests` — pending incoming.
- `POST /api/users/me/follow-requests/:followerId/accept`
- `POST /api/users/me/follow-requests/:followerId/reject`

## Out of scope (v1)

- Mute / close-friends lists.
- Block list (distinct from moderation ban).
- Follow suggestions / recommendations.

## Acceptance criteria

- [ ] Following a public profile moves to `accepted` immediately.
- [ ] Following a private profile moves to `pending`; target sees it in requests.
- [ ] Accepting a request flips status to `accepted` and increments counts.
- [ ] Unfollowing removes the row; counts update.
- [ ] Self-follow attempt returns 400.

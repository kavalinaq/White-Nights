# 02. User Profile

**Priority:** P0
**Complexity:** M (3–5d)
**Depends on:** 01 Auth
**Related tables:** `users`
**Related screens:** docx §3.2.2

## Goal

Give each user a personal page that reflects who they are and shows their literary posts. Supports avatar, bio, privacy flag, and edit-in-place. Follower/following counts land with feature 03.

## User stories

- As a user, I can view my own profile with nickname, avatar, bio, post count, and my grid of posts.
- As a user, I can edit my nickname (subject to uniqueness), avatar (image upload), and bio.
- As a user, I can toggle my profile privacy between public and private.
- As a user, I can view another user's profile; if private and I do not follow them, I see only the nickname/avatar/bio.
- As a user, I can share a profile link with others via chat (deferred to feature 11).

## Functional requirements

- Avatar upload: image file, stored in object storage, `users.avatar_url` updated.
- Bio: plain text, ≤ 500 chars.
- Privacy: single boolean on `users` (add column `is_private BOOLEAN NOT NULL DEFAULT FALSE`; Appendix А currently omits this — add in migration).
- Profile grid shows the user's posts newest-first with pagination.
- Visiting `/u/:nickname` resolves to the profile.

## API surface (sketch)

- `GET /api/users/me`
- `GET /api/users/:nickname`
- `PATCH /api/users/me` — body: `{ nickname?, bio?, isPrivate? }`.
- `POST /api/users/me/avatar` — multipart image; returns new `avatarUrl`.
- `DELETE /api/users/me/avatar`

## Out of scope (v1)

- Profile cover image.
- Activity feed on profile.
- Custom username (separate from nickname).

## Acceptance criteria

- [ ] Editing nickname to an existing one returns 409.
- [ ] Uploading a non-image file is rejected.
- [ ] Private profile hides posts/shelves/tracker from non-followers.
- [ ] Profile page renders in ≤ 1 round-trip after auth bootstrap.

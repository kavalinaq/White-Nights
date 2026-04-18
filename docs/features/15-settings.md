# 15. Settings

**Priority:** P2
**Complexity:** S (≤ 2d)
**Depends on:** 02 Profile, 06 Interactions
**Related tables:** `users`, `save`
**Related screens:** docx §3.2.2 (settings entry in side nav)

## Goal

One place for account-level preferences, saved-posts list, and support contact. Mostly a UI composition of existing endpoints.

## User stories

- As a user, I can toggle my profile privacy.
- As a user, I can browse the posts I've saved (newest-first).
- As a user, I can change my password.
- As a user, I can send a support message via a form.
- As a user, I can delete my account.

## Functional requirements

- Privacy toggle reuses `PATCH /api/users/me`.
- Saved list = `GET /api/users/me/saved` — joins `save` with `posts`.
- Password change: verifies current password, sets new hash.
- Support form: sends an email to a configured support inbox; no inbox/thread UI in v1.
- Account deletion: soft delete recommended (hide user + blank PII); define exact behavior during implementation.

## API surface (sketch)

- `GET /api/users/me/saved?cursor=`
- `POST /api/users/me/password` — body `{ currentPassword, newPassword }`.
- `POST /api/support` — body `{ subject, message }`.
- `DELETE /api/users/me`

## Out of scope (v1)

- Notification preferences (no notification system yet).
- Data export (GDPR).
- Theme / language switching.
- Connected-devices list.

## Acceptance criteria

- [ ] Saved list reflects saves/unsaves within one refresh.
- [ ] Password change rejects a wrong current password.
- [ ] Account deletion logs the user out and removes them from other users' feeds.

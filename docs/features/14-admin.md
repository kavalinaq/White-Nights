# 14. Admin

**Priority:** P3
**Complexity:** M (3–5d)
**Depends on:** 13 Moderation
**Related tables:** `users`, `moderation_actions`, `reports`
**Related screens:** docx §2.2.3

## Goal

Admins extend moderator powers with user-role management, permanent bans, and a lightweight stats view. Built on top of moderation primitives — this feature is mostly UI + role checks.

## User stories

- As an admin, I can promote a user to moderator or demote a moderator back to user.
- As an admin, I can unban a previously banned user.
- As an admin, I see totals: users, posts, pending reports, active chats.
- As an admin, I can hard-delete a user's content when required by policy.

## Functional requirements

- Role change writes a `moderation_actions` entry for audit.
- Unban flips `users.is_blocked = false`.
- Stats are aggregate counts (cached for 60 s in-memory).
- All endpoints require `role = 'admin'`.

## API surface (sketch)

- `POST /api/admin/users/:id/role` — body `{ role }`.
- `POST /api/admin/users/:id/unban`
- `DELETE /api/admin/users/:id` — hard delete.
- `GET /api/admin/stats`

## Out of scope (v1)

- Feature flags management.
- Content-policy configuration UI.
- Audit-log export.

## Acceptance criteria

- [ ] Non-admin access to any admin endpoint returns 403.
- [ ] Demoting an admin is only possible if another admin remains.
- [ ] Hard-deleting a user cascades / nullifies their content per policy without breaking referential integrity.

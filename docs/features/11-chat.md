# 11. Chat

**Priority:** P2
**Complexity:** XL (> 2w)
**Depends on:** 02 Profile
**Related tables:** `chats`, `chat_members`, `messages`
**Related screens:** docx §3.2.5

## Goal

Real-time 1:1 and group messaging. The largest single feature — carved out of the big-three gaps in competitors identified in the docx (Goodreads and LibraryThing have no DMs).

## User stories

- As a user, I can start a 1:1 chat with another user from their profile.
- As a user, I can create a group chat with a name and a list of members.
- As a group owner, I can add and remove members.
- As a user, I can see a list of my chats with last message preview and unread indicator.
- As a user, I can send a text message in real time.
- As a user, I can see the other participant's last-seen / online status.
- As a user, I can delete my own message (soft delete via `is_deleted`).
- As a user, I can scroll back through message history with pagination.
- As a user, I can search messages within a chat (stretch).

## Functional requirements

- 1:1 chats are deduplicated: starting a chat with user X when one exists returns the existing `chat_id`.
- Group chats: `chats.is_group = true`, `chats.created_by` = owner, one member row with `role = 'owner'`, others `role = 'member'`.
- Message persistence: every WS-delivered message is written to `messages` first, then broadcast.
- Pagination: cursor on `sent_at, message_id`, page size 50.
- Presence (online / last-seen): in-memory store on the backend; not in DB.
- Delivery: best-effort; no read receipts in v1.

## API + WS surface (sketch)

REST:
- `GET /api/chats` — list with previews.
- `POST /api/chats` — body `{ peerId }` or `{ name, memberIds[] }`.
- `GET /api/chats/:id/messages?cursor=`
- `POST /api/chats/:id/members` / `DELETE /api/chats/:id/members/:userId` (owner only).
- `DELETE /api/messages/:id` — sender only.

WebSocket:
- Client connects to `/ws` with JWT.
- `SEND /app/chat/{chatId}` → server broadcasts to all members via `/topic/chat/{chatId}`.
- `/user/queue/presence` → online/offline updates.

## Out of scope (v1)

- Media messages (image / file).
- Message reactions.
- Read receipts.
- Typing indicators (stretch; cheap to add if time).
- End-to-end encryption.

## Acceptance criteria

- [ ] Two browsers logged in as different users see each other's messages in ≤ 500 ms.
- [ ] Closing and reopening a chat shows full history via pagination.
- [ ] Soft-deleted messages render as "deleted message" placeholder.
- [ ] Non-members cannot read or send to a chat (403).
- [ ] A 1:1 chat cannot be created twice between the same pair.

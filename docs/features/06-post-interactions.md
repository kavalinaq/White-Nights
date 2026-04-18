# 06. Post Interactions

**Priority:** P1
**Complexity:** M (3–5d)
**Depends on:** 04 Posts
**Related tables:** `likes`, `save`, `views`, `comments`
**Related screens:** docx §3.2.3 (icons on feed card)

## Goal

Let users react to posts: like, save, view (tracked silently), and comment. These signals power engagement metrics and the saved-posts list in settings.

## User stories

- As a user, I can like/unlike a post; the count updates immediately.
- As a user, I can save/unsave a post; saved posts show under Settings.
- As a user, my view is recorded the first time I open a post-detail page.
- As a user, I can comment on a post and see other comments chronologically.
- As a user, I can delete my own comment.

## Functional requirements

- Like: upsert `likes(user_id, post_id)`; unlike: delete.
- Save: upsert/delete `save(user_id, post_id)`.
- View: insert `views(user_id, post_id)` with `ON CONFLICT DO NOTHING` — unique per user per post.
- Comments: insert `comments` rows; list paginated; `DELETE /comments/:id` author-only (or moderator via feature 13).
- Counts on feed/profile are aggregates over these tables (cached later if needed).

## API surface (sketch)

- `POST /api/posts/:id/like` / `DELETE /api/posts/:id/like`
- `POST /api/posts/:id/save` / `DELETE /api/posts/:id/save`
- `POST /api/posts/:id/view` (idempotent)
- `GET /api/posts/:id/comments?cursor=`
- `POST /api/posts/:id/comments` — body `{ text }`
- `DELETE /api/comments/:id`

## Out of scope (v1)

- Nested replies (threads).
- Reactions beyond like.
- Notifications on like/comment (separate feature later).

## Acceptance criteria

- [ ] Double-clicking like does not create duplicate rows.
- [ ] View is recorded exactly once per (user, post).
- [ ] Deleting a comment removes it from all clients on next fetch.
- [ ] Saved posts appear in Settings → Saved.

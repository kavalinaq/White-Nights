# Data Model

Baseline: the SQL in Appendix А of the docx. Below is the entity list plus the gaps we need to close before v1.

## Entities (from Appendix А)

| Table | PK | Key FKs | Purpose |
|---|---|---|---|
| `users` | `user_id` | — | Accounts, roles, privacy. |
| `posts` | `post_id` | `user_id` | Literary review/quote with optional image. |
| `comments` | `comment_id` | `post_id`, `user_id` | Replies under a post. |
| `tags` | `tag_id` | — | Tag library. |
| `post_and_tag` | (`post_id`, `tag_id`) | — | Many-to-many post↔tag. |
| `likes` | (`user_id`, `post_id`) | — | Like per user per post. |
| `views` | (`user_id`, `post_id`) | — | Unique view per user per post. |
| `save` | (`user_id`, `post_id`) | — | Saved posts per user. |
| `shelves` | `shelf_id` | `user_id` | 3 fixed shelves per user: Read / Reading / Want to Read. |
| `books` | `book_id` | `user_id` | Book entries owned by a user (denormalized — no global book catalog v1). |
| `books_on_shelves` | (`shelf_id`, `book_id`) | — | Placement + ordering. |
| `reports` | `report_id` | `reporter_id` | Reports on posts/comments/users. |
| `moderation_actions` | `action_id` | `report_id`, `moderator_id` | Mod decisions. |
| `chats` | `chat_id` | `created_by` | 1:1 or group. |
| `chat_members` | (`chat_id`, `user_id`) | — | Membership + role. |
| `messages` | `message_id` | `chat_id`, `sender_id` | Chat messages. |

## Enums (from Appendix А)

- `user_role`: `user` | `moderator` | `admin`
- `report_target_type`: `post` | `comment` | `user`
- `report_status`: `pending` | `in_review` | `resolved`
- `moderation_action_type`: `block_post` | `warn_user` | `ban_user` | `reject`
- `chat_member_role`: `member` | `owner`

## Schema gaps to close before v1

### Gap 1 — No `follows` table

The docx describes subscriptions, follower/following counts (§3.2.2), and private profiles with follow requests (§1.1). Appendix А omits this table.

```sql
CREATE TYPE follow_status AS ENUM ('accepted', 'pending');

CREATE TABLE follows (
  follower_id BIGINT REFERENCES users(user_id),
  followee_id BIGINT REFERENCES users(user_id),
  status      follow_status NOT NULL DEFAULT 'accepted',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
CREATE INDEX ON follows(followee_id, status);
```

### Gap 2 — No `reading_tracker` table

§3.2.7 describes a calendar where days are marked as "read that day". Class diagram also mentions `pages_read`. Appendix А has no corresponding table.

```sql
CREATE TABLE reading_tracker (
  user_id    BIGINT REFERENCES users(user_id),
  date       DATE NOT NULL,
  pages_read INT,
  PRIMARY KEY (user_id, date)
);
```

### Gap 3 — Single image per post

Class diagram mentions a `Media` entity (multiple images per post with caption). Appendix А stores a single `image_url` column. Decision for v1: **accept single image**, defer multi-image. If needed later:

```sql
CREATE TABLE post_media (
  post_id  BIGINT REFERENCES posts(post_id) ON DELETE CASCADE,
  position INT NOT NULL,
  url      VARCHAR(255) NOT NULL,
  caption  TEXT,
  PRIMARY KEY (post_id, position)
);
```

### Gap 4 — `is_blocked` on users but no block workflow

`users.is_blocked` exists but `ban_user` in `moderation_action_type` doesn't explicitly toggle it. Convention: processing a `ban_user` action flips `users.is_blocked = TRUE` in the same transaction.

### Gap 5 — Image storage

No storage table — URLs are stored inline. Decision: object storage (MinIO/S3), URLs are public read-only; app server signs uploads.

## Indexes to add (not in Appendix А)

Recommended for v1:

```sql
CREATE INDEX ON posts(user_id, created_at DESC);
CREATE INDEX ON comments(post_id, created_at);
CREATE INDEX ON likes(post_id);
CREATE INDEX ON save(user_id, created_at DESC);
CREATE INDEX ON messages(chat_id, sent_at);
CREATE INDEX ON chat_members(user_id);
CREATE INDEX ON reports(status, created_at);
-- For search (see feature 08):
CREATE INDEX ON posts USING gin (to_tsvector('simple', title || ' ' || author || ' ' || coalesce(description, '')));
CREATE INDEX ON users USING gin (nickname gin_trgm_ops);
```

## Migration plan

- `V1__init.sql` — paste Appendix А verbatim.
- `V2__follows.sql` — Gap 1.
- `V3__reading_tracker.sql` — Gap 2.
- `V4__indexes.sql` — index block above.
- `V5__search.sql` — `pg_trgm` extension + tsvector columns (when feature 08 is built).

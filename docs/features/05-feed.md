# 05. Feed

**Priority:** P1
**Complexity:** M (3–5d)
**Depends on:** 04 Posts, 03 Follows
**Related tables:** `posts`, `follows`
**Related screens:** docx §3.2.3

## Goal

Show each user a personalized, reverse-chronological stream of posts from accounts they follow. Fast, paginated, with interaction affordances (like/comment/save) inline.

## User stories

- As a user, I see a feed composed of posts from everyone I follow, newest first.
- As a new user (not following anyone yet), I see an empty-state prompting me to discover accounts.
- As a user, I can load more posts by scrolling (cursor pagination).

## Functional requirements

- Query: posts from `users` where `follower_id = me AND status = 'accepted'` in `follows`.
- Order by `posts.created_at DESC`, then `post_id DESC` as tiebreaker.
- Page size: 20. Cursor = opaque `{createdAt, postId}`.
- Each feed item DTO includes: post core fields, author (nickname, avatar), counts (likes, comments, views), `liked`/`saved` flags for the current user.
- Phase 1 fallback: global chronological feed (ignore follow graph) until feature 03 ships; then flip behind a feature flag.

## API surface (sketch)

- `GET /api/feed?cursor=&limit=`

## Out of scope (v1)

- Algorithmic ranking.
- Stories / ephemeral posts.
- Recommended accounts block inside the feed.

## Acceptance criteria

- [ ] First load returns ≤ 20 posts within 500 ms for a user following 100 accounts with ~10k posts total.
- [ ] Pagination with a cursor never returns duplicates or gaps.
- [ ] Unfollowing removes posts from the next fetch (current page may keep them).
- [ ] `liked`/`saved` flags are accurate for the requester.

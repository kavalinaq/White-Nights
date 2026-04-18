# 07. Tags

**Priority:** P0
**Complexity:** S (≤ 2d)
**Depends on:** —
**Related tables:** `tags`, `post_and_tag`
**Related screens:** docx §3.2.4 (tag picker), §3.2.3 (tag chips on card)

## Goal

A shared library of tags users can attach to posts and search by. Supports discovery and personalization. Recent-tags suggestions speed up the post-creation form.

## User stories

- As a user, in the post form I can search the tag library by prefix.
- As a user, I see recently-used tags (mine and globally) as quick-pick chips.
- As a user, I can add a new tag by typing a name that doesn't exist yet.
- As any user, I can click a tag chip on a post and see all posts with that tag.

## Functional requirements

- Tag name: unique (case-insensitive), 1–50 chars, no spaces (hyphens/underscores allowed).
- Creation is implicit on post save if the name is new.
- "Recent tags" endpoint returns the last N tags the current user used + globally popular fallback.
- Listing posts by tag uses `post_and_tag` join.

## API surface (sketch)

- `GET /api/tags/search?q=&limit=`
- `GET /api/tags/recent?limit=`
- `GET /api/tags/:name/posts?cursor=`

## Out of scope (v1)

- Tag moderation / merging duplicates.
- Per-user tag following.
- Tag synonyms.

## Acceptance criteria

- [ ] Creating two posts with the same new tag name yields one `tags` row.
- [ ] Tag search is prefix-matched and returns within 100 ms for a 10k-tag DB.
- [ ] Clicking a tag chip navigates to a tag-posts list.

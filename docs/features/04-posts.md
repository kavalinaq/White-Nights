# 04. Posts

**Priority:** P0
**Complexity:** L (1–2w)
**Depends on:** 01 Auth, 02 Profile, 07 Tags
**Related tables:** `posts`, `post_and_tag`
**Related screens:** docx §3.2.4 (add post), §3.2.3 (feed card)

## Goal

Let a user publish a literary post: image (optional), book title, book author, free-text review/quote, tags. The post is the core content unit of the product.

## User stories

- As a user, I can open a form, attach one image, fill in book title/author, write a review, and pick tags.
- As a user, I can save the post; it appears on my profile and on feeds.
- As a user, I can edit my own post (all fields, including replacing the image).
- As a user, I can delete my own post.
- As any user, I can open a post-detail page to see full text, comments, and book metadata.

## Functional requirements

- Image: optional, single file, uploaded to object storage, URL stored in `posts.image_url`.
- Title: required, ≤ 120 chars.
- Author: required, ≤ 120 chars.
- Description: required, plain text (no markdown v1).
- Tags: 0–10 per post; existing tag by ID or new tag by name — when new, create in `tags` first.
- Edit history not tracked in v1.
- Delete is a hard delete (cascades via FKs on `post_and_tag`, `likes`, `views`, `save`, `comments`).

## API surface (sketch)

- `POST /api/posts` — multipart (image + JSON body `{ title, author, description, tagNames[], tagIds[] }`).
- `GET /api/posts/:id`
- `PATCH /api/posts/:id` — author-only.
- `DELETE /api/posts/:id` — author-only or moderator.
- `GET /api/users/:id/posts?cursor=`

## Out of scope (v1)

- Multiple images (see Gap 3 in [data-model.md](../data-model.md)).
- Rich text / markdown.
- Drafts / scheduled posts.
- @-mentions.

## Acceptance criteria

- [ ] A post can be created with or without an image.
- [ ] Tags are de-duplicated: submitting an existing name reuses the tag.
- [ ] Only the author (or a moderator) can edit/delete.
- [ ] Deleting a post removes all related likes/comments/saves/views.
- [ ] Image URL points to object storage; image renders in feed and profile.

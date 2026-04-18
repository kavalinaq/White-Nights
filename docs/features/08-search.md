# 08. Search

**Priority:** P2
**Complexity:** L (1–2w)
**Depends on:** 02 Profile, 04 Posts, 07 Tags
**Related tables:** `users`, `posts`, `tags`
**Related screens:** docx §3.2.2 (search entry in side nav)

## Goal

One search box lets users find other people, posts about a specific book/author, or a tag. Backed by Postgres full-text + trigram.

## User stories

- As a user, I type a query and see grouped results: People / Posts / Tags.
- As a user, I can open any result to navigate to the entity.
- As a user, I can filter results to just one category.

## Functional requirements

- Users: trigram match on `nickname`.
- Posts: `tsvector` over `title`, `author`, `description`.
- Tags: prefix + trigram on `name`.
- Requires `pg_trgm` extension and GIN indexes (see [data-model.md](../data-model.md)).
- Response shape groups by type with a bounded number per group; a category-specific endpoint paginates.

## API surface (sketch)

- `GET /api/search?q=&limit=` — grouped.
- `GET /api/search/users?q=&cursor=`
- `GET /api/search/posts?q=&cursor=`
- `GET /api/search/tags?q=&cursor=`

## Out of scope (v1)

- Elasticsearch or external search service.
- Search history / saved searches.
- Typo tolerance beyond trigram.
- Filters (date, tag combination).

## Acceptance criteria

- [ ] Query of 3 chars returns grouped results within 300 ms on a 100k-posts DB.
- [ ] Empty query returns 400 (not a full listing).
- [ ] Private-profile users surface in user search but expose only public fields.

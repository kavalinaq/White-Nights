# 09. Bookshelves

**Priority:** P1
**Complexity:** M (3–5d)
**Depends on:** 02 Profile
**Related tables:** `shelves`, `books`, `books_on_shelves`
**Related screens:** docx §3.2.6

## Goal

Each user has three fixed shelves — **Read**, **Reading**, **Want to Read** — to organize books they own/plan. Books can be added, removed, and dragged between shelves.

## User stories

- As a new user, I get the three shelves pre-created on first login.
- As a user, I can add a book (title + author) to a specific shelf via a `+` button.
- As a user, I can drag a book between shelves to change its status.
- As a user, I can reorder books within a shelf.
- As a user, I can remove a book from my shelves.
- As a visitor, I can view another user's shelves (unless private).

## Functional requirements

- Shelves bootstrap: on user creation, insert 3 rows into `shelves` with fixed names and positions 0/1/2.
- Books are per-user (no global catalog): `books.user_id` scopes them.
- `books_on_shelves.position` is a monotonically increasing int; reorder updates positions.
- Moving between shelves = delete from source, insert into target with new position.

## API surface (sketch)

- `GET /api/users/:id/shelves` — returns 3 shelves with books.
- `POST /api/shelves/:shelfId/books` — body `{ title, author }`.
- `DELETE /api/books/:bookId`
- `POST /api/books/:bookId/move` — body `{ toShelfId, position }`.
- `POST /api/shelves/:shelfId/reorder` — body `{ bookIds: [] }`.

## Out of scope (v1)

- User-defined extra shelves.
- Book cover images.
- Global book catalog / ISBN lookup.
- Ratings / per-book notes.

## Acceptance criteria

- [ ] A brand-new user has 3 shelves and 0 books.
- [ ] Drag-and-drop on the UI persists position within ≤ 1 round-trip.
- [ ] Viewing a private user's shelves as a non-follower returns 403.

# Overview

## Vision

WHITE NIGHTS is a themed social network for readers. Unlike Goodreads (catalog-heavy, dated UX, no chat) or Wattpad (author-centric, no short-form reviews), it combines:
- Short, visual posts about books (image + book metadata + review/quote + tags).
- Personal reading tools: 3-shelf system (Read / Reading / Want to Read) and a calendar-based reading tracker.
- Full social loop: follows, likes, comments, saves, 1:1 + group chats.

## Scope (v1)

In scope:
- User accounts, profiles, privacy (public/private).
- Posts with image, book title + author, free text, tags.
- Feed from follows, chronological.
- Post interactions: like, comment, save, view counter.
- Tag library with recent-tags suggestions.
- Search across users, posts, books, tags.
- Bookshelves (3 fixed shelves) with drag-and-drop reordering.
- Reading tracker calendar.
- Chat: 1:1 and groups, realtime messaging, history.
- Reports + moderation + admin tooling.

Out of scope (v1):
- Mobile native apps.
- Book-catalog integration (no external ISBN/Goodreads sync).
- Recommendation engine.
- Payments, subscriptions, ads.
- Multiple images per post (may land post-v1 — see [data-model.md](data-model.md) gap #3).

## Personas

From [docx §2.2](../Курсовая%20работа%20(2).docx):

- **Registered user** — posts, follows, chats, maintains shelves and tracker, can report content.
- **Moderator** — reviews reports, blocks posts, issues warnings.
- **Admin** — everything a moderator can do, plus user bans and role management.

## Tech stack

| Layer | Choice | Source |
|---|---|---|
| DB | PostgreSQL | docx §3.1 |
| Backend | Java | docx §3.1 |
| Frontend | JS + TypeScript | docx §3.1 |
| UI prototype | Figma (already done) | docx §3.2 |

Open decisions (see [architecture.md](architecture.md)):
- Java framework (Spring Boot vs. Micronaut vs. Quarkus).
- Frontend framework (React vs. Vue vs. Svelte).
- Realtime (WebSocket via Spring vs. Socket.IO-compatible alternative).
- Image storage (local vs. S3-compatible).

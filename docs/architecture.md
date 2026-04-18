# Architecture

## High-level shape

```
[ Browser SPA (TS) ] --HTTPS--> [ Java API (REST + WS) ] --JDBC--> [ PostgreSQL ]
                                         |
                                         +--> [ Object storage (images) ]
```

A single-page app talks to a Java backend over REST for request/response flows and WebSocket for chat. Postgres is the system of record. Uploaded images (avatars, post photos) live in object storage and are referenced by URL in the DB.

## Modules (backend)

Organize by feature, not by layer, so each feature in [features/](features/) maps to one package:

```
com.whitenights
├── auth           # registration, login, email verification, JWT
├── users          # profile, privacy
├── follows        # follow graph + follow requests
├── posts          # CRUD + tags attach
├── tags           # tag library
├── feed           # timeline query
├── interactions   # like, save, view, comment
├── shelves        # shelves + books + drag ordering
├── tracker        # reading tracker calendar
├── search         # tsvector/trigram search
├── chat           # chats, members, messages, WS
├── reports        # user-submitted reports
├── moderation     # queue + actions
├── admin          # role mgmt, bans
├── common         # shared infra: auth filter, error handling, pagination
└── storage        # image upload abstraction
```

Each module exposes a REST controller, a service, and a repository (JPA or jOOQ).

## Modules (frontend)

```
src/
├── features/
│   ├── auth/
│   ├── profile/
│   ├── feed/
│   ├── post/
│   ├── shelves/
│   ├── tracker/
│   ├── chat/
│   ├── search/
│   ├── settings/
│   └── moderation/
├── shared/            # api client, auth store, components
└── app/               # routing, layout, providers
```

## Cross-cutting concerns

- **AuthN/Z:** JWT in `Authorization: Bearer`. Role check via filter. Route guards on the client.
- **Errors:** problem-details JSON (`type`, `title`, `status`, `detail`) for all 4xx/5xx.
- **Pagination:** cursor-based for feed and chat history (`?after=<id>&limit=N`); offset for everything else.
- **Validation:** Bean Validation on DTOs; Zod on the client.
- **Migrations:** Flyway from Appendix-A SQL as `V1__init.sql`, then incremental Vn files for schema-gap fixes.
- **Testing:** JUnit + Testcontainers (Postgres) for backend, Vitest + Playwright for frontend.
- **Observability:** structured JSON logs, request IDs; metrics optional for v1.

## Open decisions

| Area | Options | Default recommendation |
|---|---|---|
| Java framework | Spring Boot / Micronaut / Quarkus | Spring Boot — widest docs, easy WS support |
| ORM | JPA / jOOQ / JDBC | JPA for CRUD, native SQL for search/feed |
| Frontend framework | React / Vue / Svelte | React + Vite + TS |
| State | TanStack Query + Zustand / Redux | TanStack Query + Zustand |
| Realtime | WS via Spring STOMP / raw WS / SSE | STOMP over WS |
| Image storage | Local disk (dev) + S3-compatible (prod) | MinIO in dev, S3 in prod |
| Auth tokens | Short-lived JWT + refresh / session cookie | JWT access + refresh (httpOnly cookie) |

## Data flow examples

**Create post** (docx §2.4.2 sequence diagram):
1. Client `POST /api/posts` with multipart (image + JSON).
2. Backend validates, uploads image to storage, writes `posts` row, writes `post_and_tag` rows.
3. Response: created post DTO.
4. Fan-out: none for v1 — feed is read-time query, not push.

**Send message** (WS):
1. Client opens `/ws` after auth, subscribes to `/user/queue/messages`.
2. Client sends `SEND /app/chat/{chatId}` with text.
3. Backend persists message, broadcasts to all `chat_members` of that chat.

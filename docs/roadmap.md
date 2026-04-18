# Roadmap

## Priority / complexity legend

- **Priority:** P0 = MVP-blocking, P1 = core differentiator, P2 = rounds out product, P3 = safety/admin.
- **Complexity:** S ≤ 2d, M 3–5d, L 1–2w, XL > 2w. Single-engineer estimates.

## Feature inventory

| # | Feature | Prio | Cplx | Depends on |
|---|---|---|---|---|
| 1 | [Auth](features/01-auth.md) | P0 | M | — |
| 2 | [User profile](features/02-user-profile.md) | P0 | M | 1 |
| 3 | [Posts](features/04-posts.md) | P0 | L | 1, 2, 7 |
| 4 | [Tags](features/07-tags.md) | P0 | S | — |
| 5 | [Feed](features/05-feed.md) | P1 | M | 3, 6 |
| 6 | [Follow system](features/03-follow-system.md) | P1 | M | 2 |
| 7 | [Post interactions](features/06-post-interactions.md) | P1 | M | 3 |
| 8 | [Bookshelves](features/09-bookshelves.md) | P1 | M | 2 |
| 9 | [Search](features/08-search.md) | P2 | L | 3, 4, 2 |
| 10 | [Reading tracker](features/10-reading-tracker.md) | P2 | S | 2 |
| 11 | [Chat](features/11-chat.md) | P2 | XL | 2 |
| 12 | [Settings](features/15-settings.md) | P2 | S | 2, 7 |
| 13 | [Reports](features/12-reports.md) | P3 | S | 3, 7 |
| 14 | [Moderation](features/13-moderation.md) | P3 | M | 13 |
| 15 | [Admin](features/14-admin.md) | P3 | M | 14 |

**Total:** ~12–16 weeks for a single engineer, excluding polish, QA, deployment hardening.

## Phases

### Phase 0 — Scaffolding (week 1)

- Monorepo layout: `backend/` (Java + Gradle), `frontend/` (Vite + React + TS), `db/` (Flyway migrations).
- Docker Compose for Postgres + MinIO.
- CI skeleton (build + test on push).
- Apply Appendix А SQL as `V1__init.sql`; add gap migrations V2–V4 from [data-model.md](data-model.md).
- Frontend shell: router, API client, auth store placeholder.

**Exit:** `docker compose up` yields a running DB + object store; both apps build and a `/health` endpoint returns 200.

### Phase 1 — MVP content loop (weeks 2–5)

Order: **Auth → Profile → Tags → Posts → Feed (public, no follows yet) → Post interactions.**

At phase end a user can register, log in, edit their profile, create a post with tags, view a global chronological feed, and like/comment/save.

### Phase 2 — Social graph & book tools (weeks 6–8)

Order: **Follows → rewire feed to follow-based → Bookshelves → Reading tracker → Settings.**

At phase end the product has social mechanics and personal reading tools.

### Phase 3 — Discovery & communication (weeks 9–12)

Order: **Search → Chat.** Chat is the largest single feature; budget 2–3 weeks.

### Phase 4 — Safety (weeks 13–15)

Order: **Reports → Moderation queue → Admin panel.**

### Phase 5 — Hardening

- Perf pass (feed query, search, chat history pagination).
- Accessibility audit.
- End-to-end tests for critical flows.
- Deployment runbook + staging environment.

## Dependency graph (sanity check)

```
1 Auth
 └─ 2 Profile
     ├─ 6 Follows ──┐
     ├─ 8 Shelves   │
     ├─ 10 Tracker  │
     ├─ 12 Settings │
     └─ 11 Chat     │
4 Tags              │
 └─ 3 Posts ────────┤
     ├─ 7 Interactions
     ├─ 5 Feed ◀────┘
     └─ 13 Reports
         └─ 14 Moderation
             └─ 15 Admin
9 Search ◀── 2, 3, 4
```

No cycles. Feature 5 (Feed) can ship in two flights: first a global chronological list (after Posts), then rewired to follows (after Follows).

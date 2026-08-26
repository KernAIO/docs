---
title: Architecture
description: Services, the kernel runtime, contracts, modules, tenancy and realtime — how Kern fits together.
---

Kern is a small set of Node services sharing one Postgres, one event bus and one **kernel** runtime. The split is driven by runtime needs (long-lived connections, CPU profile, crash isolation), not by team boundaries.

```
                       ┌────────────┐
   browser/PWA ──────▶ │   Caddy    │ ── /            ─▶ app     (SvelteKit, :3000)
                       │ (TLS, L7)  │ ── /api/*       ─▶ core    (Fastify + kernel, :4000)  ─┐
                       │            │ ── /api/chat,/ws─▶ chat    (kernel + WS gateway, :4100)│
                       │            │ ── /api/mail    ─▶ mail    (kernel + IMAP sync, :4200) │ NATS JetStream
                       │            │ ── /collab      ─▶ collab  (Hocuspocus/Yjs, :4300)     │ (events, req/reply, KV)
                       │            │ ── /s3          ─▶ minio                                │
                       └────────────┘                   core-worker (pg-boss jobs) ──────────┘
                                              Postgres 18 (per-module schemas, RLS) · Valkey · MinIO · LiveKit(opt)
```

## Services

| Service | Hosts | Why separate |
|---|---|---|
| `app` | SvelteKit PWA; every module's client part | static/SSR web tier |
| `core` | identity (Better Auth), workspaces, members, roles/permissions, notifications, settings, files, search, webhooks, importers **and** the modules tracker, hr, recruit, crm, time, calendar, automation, docs (meta), drive (meta), ai, calls; `core-worker` runs pg-boss jobs | the default home for modules |
| `chat` | chat module + the realtime WebSocket gateway for all modules | persistent connections, different scaling |
| `mail` | mail module: providers, templates, queue, webhooks, IMAP IDLE sync, intake | long-lived IMAP connections, crash isolation |
| `collab` | Hocuspocus (Yjs) server, persisted to Postgres | CRDT WebSockets, CPU profile |

Moving a module from one service to another is configuration: the kernel routes calls and events transparently.

## Kernel

`@kernhq/kernel` is the runtime every backend service embeds:

- `defineModule()` / `defineServerModule()` — a module's manifest and server extension points.
- **Module registry** — dependency-sorted, exposes permissions, notification types, manifests.
- **Event bus** — typed events, in-process in tests, NATS JetStream in production (durable consumers per service+module).
- **`kernel.call('<module>.<procedure>', input)`** — request/reply; in-process if hosted locally, NATS otherwise.
- **Authz** engine — permission keys, built-in role defaults, custom roles, scoped bindings, Valkey cache.
- **Jobs** — pg-boss queues named `<module>.<job>`, cron, retries; API processes enqueue, worker processes run.
- **Settings / secrets** — module settings and encrypted integrations stored by core, read through the broker with a short cache; AES-256-GCM with keys derived from `KERN_SECRET`.
- **Storage** — S3 client with presigned URLs. **Realtime** — publish to channels/users through NATS.
- **HTTP** — a Fastify server that mounts every hosted module's oRPC router under `/api/<module>` with OpenAPI generation, health endpoints, CORS, helmet and rate limiting.
- **Database** — pg pool + Drizzle, per-module schema migrations, `withWorkspace()` transactions that set the RLS context.

## Contracts

`@kernhq/contracts` is the only thing two modules or services share: Zod schemas, oRPC contracts, event definitions, permission keys, error codes, the realtime protocol. Changing a contract first, publishing, then updating consumers is the rule for cross-repo changes.

## Modules

`@kernhq/module-<id>` packages export `/contract`, `/server` (routes, Drizzle schema in `mod_<id>`, migrations, event subscriptions, jobs, procedures, permissions, automations, search indexers, object resolvers) and `/client` (routes, navigation, presenters, slots, settings pages, i18n). The app and each service list the modules they host in a static registry — tree-shaken, typed, no runtime plugin loading.

## Data and tenancy

- One Postgres 18 cluster (chat/mail may be pointed at their own databases). **One schema per module**; a module's DB role only sees its own schema, so cross-module data access goes through contracts, never SQL.
- Every tenant table has `workspace_id` (uuidv7 keys) and **row-level security** keyed on `SET LOCAL app.workspace_id` as defence in depth; composite indexes start with `workspace_id`.
- Global (non-RLS) tables: users, sessions, workspaces, memberships, notifications, push subscriptions, API keys.
- Custom fields: metadata tables + JSONB `custom` columns with expression indexes; KQL compiles to SQL over both.
- **Activity log** (`activity_events`, partitioned monthly) is the source for history, feeds, automation, webhooks and search indexing (outbox pattern).
- Extensions: pgvector, pg_trgm, ltree, pg_partman. Jobs: pg-boss. Cache/presence/rate-limit: Valkey. Bus: NATS JetStream (`kern.<ws>.<module>.<event>`, request/reply on `kern.rpc.*`, KV for presence). Files: MinIO/S3 with tus uploads.

## Auth

Better Auth in `core` issues JWTs (JWKS at `/api/auth/jwks`). Other services verify tokens against the JWKS and resolve the full principal (memberships, roles) through `core.users.principal`, cached with a `permissionVersion` that bumps on any membership change. Service-to-service calls use short-lived HS256 tokens derived from `KERN_SECRET`.

## Realtime

One WebSocket per client to `chat`; events `{ workspaceId, module, entity, id, op, patch? }` invalidate or patch TanStack Query caches in the app; chat messages, typing and presence stream on the same socket. See [Realtime protocol](/developers/realtime-protocol/).

## Further reading

- `docs/PLAN.md` and `docs/adr/` in the [`app`](https://github.com/KernAIO/app) repository for the full plan and decision records.

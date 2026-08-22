---
title: Dev workspace
description: Set up all Kern repositories as one local workspace with linked packages and local infrastructure.
---

Kern is many repositories, but day to day it feels like one monorepo thanks to the **umbrella workspace** in the `kern` repo.

## Prerequisites

- Node **24** (`nvm use 24`), pnpm **10** (`corepack enable`), Docker with Compose, git.
- `gh` CLI signed in if you want `pnpm setup` to clone private repos.

## Setup

```bash
git clone https://github.com/KernAIO/kern && cd kern
pnpm setup        # clones app core chat mail collab kernel modules docs into ./repos and installs deps
pnpm infra        # Postgres 18 (pgvector) · NATS · Valkey · MinIO · Mailpit  — docker compose -f dev/compose.yml up -d
cp dev/.env.example .env   # (setup does this) shared dev environment
pnpm db:migrate   # run every hosted module's migrations
pnpm dev          # turbo runs everything with hot reload
```

`pnpm-workspace.yaml` lists `repos/*` and `repos/*/packages/*`, so every `@kernaio/*` dependency resolves to the local source — change `kernel` and the services pick it up immediately.

Each repo also works standalone (`pnpm i && pnpm dev`) against the published `@kernaio/*` packages; that is how CI builds them.

## Ports

| Process | Port |
|---|---|
| `app` (SvelteKit dev) | 5173 |
| `core` | 4000 |
| `chat` (+ `/ws`) | 4100 |
| `mail` | 4200 |
| `collab` (`/collab`) | 4300 |
| `docs` (this site) | 4400 |

Infrastructure from `dev/compose.yml`:

| Service | Port(s) |
|---|---|
| Postgres | 5432 (`postgres://kern:kern@localhost:5432/kern`) |
| NATS | 4222 (monitoring 8222) |
| Valkey | 6379 |
| MinIO | 9000 (console 9001, user `kern` / `kernkernkern`) |
| Mailpit | SMTP 1025, UI `http://localhost:8025` |
| LiveKit (`--profile calls`) | 7880–7882 |
| Gotenberg (`--profile preview`) | 3500 |

## Environment

Services load their own `.env` first, then the umbrella `.env` (`dev/.env.example` is the template): `KERN_SECRET`, `DATABASE_URL`, `NATS_URL`, `VALKEY_URL`, S3 settings, `SMTP_URL=smtp://localhost:1025` (Mailpit) and the public URLs for the app.

## Everyday commands

```bash
pnpm dev            # all services (turbo --concurrency 20)
pnpm lint           # biome across repos
pnpm typecheck
pnpm test
pnpm build
pnpm status         # git status of every repo
pnpm pull           # git pull --rebase in every repo
pnpm infra:reset    # drop infra volumes (fresh DB)
```

Work inside a single repo as usual (`cd repos/core && pnpm test`). Commit and push per repository; the umbrella only tracks its own files (`repos/` is git-ignored).

## Tooling

TypeScript (strict, ESM, NodeNext), Biome for lint/format, Vitest, Playwright (app), Testcontainers (core integration tests), Turborepo, Conventional Commits, Changesets for `kernel`/`modules`, Renovate, GitHub Actions.

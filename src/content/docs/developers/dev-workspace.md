---
title: Dev workspace
description: Set up all Kern repositories as one local workspace with linked packages and local infrastructure.
---

Kern is many repositories, but day to day it feels like one monorepo thanks to the **umbrella workspace** in the [`app`](https://github.com/KernAIO/app) repository.

## Prerequisites

- Node **24** (`nvm use 24`), pnpm **10** (`corepack enable`), Docker with Compose, git.

Every repository is public, so the clone needs no credentials.

## Setup

```bash
git clone https://github.com/KernAIO/app && cd app
pnpm setup        # clones every repository into ./repos and installs dependencies
pnpm infra        # Postgres 18 (pgvector) · NATS · Valkey · MinIO · Mailpit  — docker compose -f dev/compose.yml up -d
cp dev/.env.example .env   # (setup does this) shared dev environment
pnpm db:migrate   # run every hosted module's migrations
pnpm dev          # every service with hot reload
```

`pnpm setup` clones fifteen repositories: `kernel`, the eight `module-*` packages, the five services
(`core`, `chat`, `mail`, `collab`, `shell`) and `docs`. The list lives in `scripts/repos.mjs` and
nowhere else, so adding a repository is one edit.

`pnpm-workspace.yaml` lists `repos/*` and `repos/*/packages/*`, so every `@kernhq/*` dependency resolves to the local source — change `kernel` and the services pick it up immediately.

Each repo also works standalone (`pnpm i && pnpm dev`) against the published `@kernhq/*` packages; that is how CI builds them.

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
pnpm dev            # every service, in parallel, with hot reload
pnpm lint           # biome and the range checks across repos
pnpm typecheck
pnpm test
pnpm build
pnpm status         # git status of every checkout; exits 1 when anything is unpushed
pnpm pull           # git pull --rebase in every repo
pnpm infra:reset    # drop infra volumes (fresh DB)
```

Each of these runs `scripts/run-all.sh`, which calls the same script in every repository in
dependency order — kernel, then the modules, then the services, then the shell and the docs. The
umbrella has no turbo task graph and cannot have one: every repository carries its own `turbo.json`
as a *root* config, because CI clones that repository on its own. `run-all.sh` reports every failure
rather than stopping at the first.

Work inside a single repo as usual (`cd repos/core && pnpm test`). Commit and push per repository; the umbrella only tracks its own files (`repos/` is git-ignored).

## Tooling

TypeScript (strict, ESM, NodeNext), Biome for lint/format, Vitest, Playwright (app), Testcontainers (core integration tests), Turborepo inside each repository, Conventional Commits, Changesets in `kernel` and in every `module-*` repository, GitHub Actions.

---
title: Repositories
description: The GitHub repositories that make up Kern and what each contains.
---

Kern lives in the GitHub organisation [`KernALO`](https://github.com/KernALO). All public repositories are AGPL-3.0 with a CLA.

| Repo | What |
|---|---|
| [`kern`](https://github.com/KernALO/kern) | project face: README, **self-host** distribution (`docker-compose.yml`, profiles, `install.sh`, `Caddyfile`), architecture/ADR docs, the **umbrella dev workspace** (`pnpm-workspace.yaml` linking sibling clones), release manifests, CLA |
| [`app`](https://github.com/KernALO/app) | SvelteKit PWA; hosts every module's client part |
| [`core`](https://github.com/KernALO/core) | identity, workspaces, permissions, notifications, settings, files, search + first-party modules (Fastify + kernel); `worker` entrypoint |
| [`chat`](https://github.com/KernALO/chat) | chat module + realtime WebSocket gateway |
| [`mail`](https://github.com/KernALO/mail) | outbound providers, IMAP/SMTP inbox, inbound intake |
| [`collab`](https://github.com/KernALO/collab) | Yjs/Hocuspocus collaborative editing server |
| [`kernel`](https://github.com/KernALO/kernel) | `@kernalo/kernel`, `@kernalo/contracts`, `@kernalo/ui`, `@kernalo/sdk`, `@kernalo/testing` |
| [`modules`](https://github.com/KernALO/modules) | first-party modules monorepo (`@kernalo/module-*`) |
| [`docs`](https://github.com/KernALO/docs) | this documentation site |

A private `cloud` repository (billing, SaaS control plane) is out of scope for v1.

## Packages

Shared packages are published to GitHub Packages under the `@kernalo` scope on every merge to `main` of `kernel` and `modules` (Changesets prereleases); Renovate keeps the service repos bumped. Inside the umbrella workspace they are linked locally so you never wait for a publish while developing.

## Images

Each service repo builds `ghcr.io/kernalo/<service>` on push to `main` and on `v*` tags. The `kern` repository pins the set of tags that form a release.

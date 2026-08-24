---
title: Repositories
description: The GitHub repositories that make up Kern and what each contains.
---

Kern lives in the GitHub organisation [`KernAIO`](https://github.com/KernAIO). Every public repository takes contributions under a CLA. `kernel` is Apache-2.0; the rest are AGPL-3.0-only, except `_template` and `workflow` inside `modules`, which are Apache-2.0. See [Licensing](/developers/licensing/).

| Repo | What |
|---|---|
| [`kern`](https://github.com/KernAIO/kern) | project face: README, **self-host** distribution (`docker-compose.yml`, profiles, `install.sh`, `Caddyfile`), architecture/ADR docs, the **umbrella dev workspace** (`pnpm-workspace.yaml` linking sibling clones), release manifests, CLA |
| [`app`](https://github.com/KernAIO/app) | SvelteKit PWA; hosts every module's client part |
| [`core`](https://github.com/KernAIO/core) | identity, workspaces, permissions, notifications, settings, files, search + first-party modules (Fastify + kernel); `worker` entrypoint |
| [`chat`](https://github.com/KernAIO/chat) | chat module + realtime WebSocket gateway |
| [`mail`](https://github.com/KernAIO/mail) | outbound providers, IMAP/SMTP inbox, inbound intake |
| [`collab`](https://github.com/KernAIO/collab) | Yjs/Hocuspocus collaborative editing server |
| [`kernel`](https://github.com/KernAIO/kernel) | `@kernhq/kernel`, `@kernhq/contracts`, `@kernhq/ui`, `@kernhq/sdk`, `@kernhq/testing` |
| [`modules`](https://github.com/KernAIO/modules) | first-party modules monorepo (`@kernhq/module-*`) |
| [`docs`](https://github.com/KernAIO/docs) | this documentation site |

A private `cloud` repository (billing, SaaS control plane) is out of scope for v1.

## Packages

Shared packages are published to GitHub Packages under the `@kernhq` scope on every merge to `main` of `kernel` and `modules` (Changesets prereleases); Renovate keeps the service repos bumped. Inside the umbrella workspace they are linked locally so you never wait for a publish while developing.

## Images

Each service repo builds `ghcr.io/kernaio/<service>` on push to `main` and on `v*` tags. The `kern` repository pins the set of tags that form a release.

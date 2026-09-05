---
title: Repositories
description: The GitHub repositories that make up Kern and what each contains.
---

Kern lives in the GitHub organisation [`KernAIO`](https://github.com/KernAIO). Every public repository takes contributions under a CLA. `kernel` and `module-template` are Apache-2.0; the rest are AGPL-3.0-only. See [Licensing](/developers/licensing/).

**Every module is its own repository.** The `modules` monorepo is archived. A reference
implementation that lives somewhere structurally special is not a reference, so the first-party
modules have the same shape as one written outside this organisation.

| Repo | What |
|---|---|
| [`app`](https://github.com/KernAIO/app) | project face: README, **self-host** distribution (`docker-compose.yml`, profiles, `install.sh`, `Caddyfile`), architecture and ADR docs, the **umbrella dev workspace** that clones and links every repo below, and the release workflow |
| [`shell`](https://github.com/KernAIO/shell) | SvelteKit PWA; hosts every module's client part. Builds `ghcr.io/kernaio/shell`, which Compose runs as `app`. |
| [`core`](https://github.com/KernAIO/core) | identity, workspaces, permissions, notifications, settings, files, search, MCP + five modules (Fastify + kernel); `worker` entrypoint |
| [`chat`](https://github.com/KernAIO/chat) | chat module + realtime WebSocket gateway |
| [`mail`](https://github.com/KernAIO/mail) | outbound providers, the send queue and provider webhooks |
| [`collab`](https://github.com/KernAIO/collab) | Yjs/Hocuspocus collaborative editing server |
| [`kernel`](https://github.com/KernAIO/kernel) | `@kernhq/kernel`, `@kernhq/contracts`, `@kernhq/ui`, `@kernhq/sdk`, `@kernhq/testing`, `@kernhq/workflow` |
| [`module-template`](https://github.com/KernAIO/module-template) | Apache-2.0 starting point, published as `@kernhq/module-template` |
| `module-tracker`, `module-chat`, `module-quire`, `module-hr`, `module-mail`, `module-billing`, `module-inventory` | the seven first-party modules, one package each |
| [`docs`](https://github.com/KernAIO/docs) | this documentation site |

## Packages

Shared packages are published to **npm** under the `@kernhq` scope, with Changesets. Inside the
umbrella workspace they are linked locally, so you never wait for a publish while developing.

`@kernhq/kernel` and `@kernhq/contracts` are **peer** dependencies of every module, never plain
dependencies: a plain dependency lets a package manager hand a module whatever kernel copy the host
resolved, including one it was never built against.

## Images

Each service repo builds `ghcr.io/kernaio/<service>` on push to `main` and on `v*` tags. The `app`
repository's release workflow tags one version across `core`, `shell`, `chat`, `mail` and `collab`,
so every image and every module in an instance carries the same `KERN_VERSION`.

The published images are **`amd64` only**.

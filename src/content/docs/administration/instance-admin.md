---
title: Instance admin
description: What an instance administrator is, what the admin console has today, and which instance settings exist only on the API.
---

An **instance admin** is a user flagged as administrator of the whole installation. The first one is
created from `KERN_ADMIN_EMAIL` / `KERN_ADMIN_PASSWORD` on first boot.

Instance admins implicitly pass every permission check in every workspace, so grant the flag
sparingly and require 2FA or a passkey on those accounts.

## Opening the console

The console is a section inside a workspace, not a separate site.

1. Sign in as an instance admin.
2. Open the account menu, at your avatar.
3. Select **Admin**.

**Result:** the browser lands on `/<workspace>/admin/updates`. The entry in the account menu is
rendered only for instance admins, so nobody without the flag arrives at a locked page.

There is no `/admin` route. The console lives under the workspace you are standing in
(`/<workspace>/admin/…`) because the shell always has a workspace in the URL; what the pages show is
the instance, not that workspace.

## What is in the console

| Page | What it does |
|---|---|
| **Updates** | What this instance runs, what the newest release changes, and the exact command to upgrade. The update mode — notify or automatic — its window and its settling period are set here. |
| **Modules** | What each module actually registered, checked rather than declared: every procedure, whether it is implemented, and what stands in front of it. Written for somebody building a module. |

The Billing module adds two more pages when it is in your build:

| Page | What it does |
|---|---|
| **Plans** | Define the plans this instance sells and what each one entitles. |
| **Subscriptions** | Which workspace is on which plan. |

Module pages are not filtered by what the workspace you are standing in has enabled. The console is
about the instance, so an operator checking what every workspace is billed still finds the screen
when the module is off where they happen to be.

Nothing else has a screen yet. Users, workspaces, instance-wide mail, sign-up policy, limits and an
instance audit log are **not in the interface** — see [Instance settings](#instance-settings) for
what the API offers instead.

## Impersonation is disabled, deliberately

Kern will not let an instance admin sign in as another user. `POST
/api/auth/admin/impersonate-user` answers **403** with `IMPERSONATION_DISABLED`, and there is no
screen that offers it.

An unaudited way to become any customer, reachable by every instance admin, is not a support tool.
Reading a workspace as an admin is still possible, and it is recorded: core writes a
`core.access.crossed` entry in **that workspace's** audit log, where the customer can see it.

## Instance settings

Instance settings are one typed document (`InstanceSettings` in `@kernhq/contracts`), read and
written over the API at `GET` and `PUT /api/core/admin/settings`. **No screen edits them today.**

Four of the seven fields are stored and not yet read by anything:

| Field | Default | What reads it |
|---|---|---|
| `allowSignup` | `true` | Every sign-up path. Seeded once from `KERN_SIGNUP`; see [Environment reference](/self-hosting/env-reference/#who-may-create-an-account). |
| `allowWorkspaceCreation` | `everyone` | Workspace creation. `admins` restricts it to instance admins. |
| `supportEmail` | `null` | The `mailto:` subject of a Web Push message, when no `VAPID_SUBJECT` is set. |
| `name` | `Kern` | Nothing yet. |
| `baseUrl` | from env | Nothing yet; the services read `KERN_BASE_URL`. |
| `defaultLocale` | `en` | Nothing yet; a user's locale comes from their own preference. |
| `mailFrom` | `null` | Nothing yet; the services read `MAIL_FROM`. |

## Other admin procedures on the API

These answer today and have no screen. They are on the same OpenAPI document as everything else —
see [API & OpenAPI](/developers/api-openapi/).

| Procedure | Route |
|---|---|
| List and search users | `GET /api/core/admin/users` |
| Suspend, reactivate, or grant instance admin | `POST /api/core/admin/users/{id}/status` |
| List workspaces with member counts | `GET /api/core/admin/workspaces` |
| List installed modules and their manifests | `GET /api/core/admin/modules` |

## Operational tasks

- **Health.** Every service answers `/api/health` (the process is up) and `/api/ready` (the database
  is reachable). Caddy routes `/api/health` to `core`; probe the others inside the Docker network,
  for example `docker compose exec chat node -e "fetch('http://127.0.0.1:4100/api/health')"`.
- **Backups and upgrades.** See [Backups](/self-hosting/backups/) and
  [Upgrading](/self-hosting/upgrading/).
- **Logs.** Services log JSON to stdout: `docker compose logs -f core`.

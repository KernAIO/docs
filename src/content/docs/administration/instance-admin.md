---
title: Instance admin
description: What instance administrators manage from the admin console.
---

An **instance admin** is a user flagged as administrator of the whole installation. The first one is created from `KERN_ADMIN_EMAIL` / `KERN_ADMIN_PASSWORD` on first boot; admins can promote others from the console. Instance admins implicitly pass every permission check in every workspace, so grant the flag sparingly and require 2FA/passkeys for those accounts.

## The admin console

Reachable from the user menu (**Instance admin**) or at `/admin`. It covers:

- **Overview & health** — service versions, database/NATS/Valkey/S3 reachability, job queue depth, recent errors.
- **Users** — search, suspend/reactivate, reset 2FA, grant/revoke instance admin, see workspace memberships and sessions.
- **Workspaces** — list, archive, transfer ownership, set per-workspace limits (members, storage), impersonate for support (audited).
- **Modules** — which modules are installed in this build, their versions and manifests; instance-wide defaults for new workspaces.
- **Mail** — the instance default outbound provider (from `SMTP_URL`/`MAIL_FROM` or configured here), test send, delivery log.
- **Sign-up policy** — open sign-up vs invite-only, who may create workspaces (`everyone` or `admins`), allowed email domains, OAuth providers.
- **Instance settings** — instance name, default locale, support email, branding shown on the sign-in page.
- **Limits** — rate limits, upload size caps, retention of activity/audit data.
- **Audit** — an instance-level audit log of admin actions (separate from each workspace's audit log).

## Instance settings schema

Instance settings are a small typed document (`InstanceSettings` in `@kernaio/contracts`):

| Field | Default | Meaning |
|---|---|---|
| `name` | `Kern` | Instance display name |
| `baseUrl` | from env | Public URL |
| `allowSignup` | `true` | Whether anyone can create an account |
| `allowWorkspaceCreation` | `everyone` | `everyone` or `admins` |
| `defaultLocale` | `en` | `en`, `fa`, `ar`, `de` |
| `mailFrom` | `null` | Default sender when no provider override |
| `supportEmail` | `null` | Shown to users in error pages and emails |

## Operational tasks

- **Health endpoints**: every service exposes `/api/health` (liveness) and `/api/ready` (database reachable). Caddy routes `/api/health` to `core`; other services can be probed inside the Docker network.
- **Backups and upgrades**: see [Backups](/self-hosting/backups/) and [Upgrading](/self-hosting/upgrading/).
- **Logs**: services log JSON to stdout; `docker compose logs -f <service>`.

---
title: Install
description: Install Kern on your own server with Docker in a few minutes.
---

Kern ships as a set of Docker images plus a `docker compose` file, a Caddy reverse proxy and an installer script that prepares everything for you.

## Requirements

### The machine

| | Minimum | Comfortable |
|---|---|---|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 20 GB | 40 GB |
| Suits | a team of about twenty, running issues, chat, the wiki and mail | office previews switched on, heavy document collaboration, or more than fifty people |

The minimum is the smallest tier at most hosts. Disk is about 1.5 GB of images plus your database
and your files — what people upload decides the real number.

### The software

- **Docker 24 or newer**, with the Compose plugin. Any Linux distribution. macOS runs it for a look,
  not for a team.
- **x86-64.** The published images are `amd64`. An arm64 server — Ampere, Graviton, a Raspberry Pi —
  needs images built for it.
- A **domain name** pointing at the host, for automatic HTTPS. An IP address works for a machine on
  your network; Caddy then issues a self-signed certificate.
- Ports **80** and **443** open. Nothing else.
- No outbound access, once the images are pulled. An instance with no route to the internet runs the
  same — it only loses the update check.

### How much memory it uses

Measured on a fresh instance with no traffic:

| Container | At rest | What it is |
|---|---|---|
| `minio` | 81 MB | file storage |
| `core` | 67 MB | accounts, permissions and most modules |
| `postgres` | 35 MB | the database |
| `caddy` | 12 MB | TLS and routing |
| `gotenberg` | 11 MB | office and PDF previews (optional) |
| `valkey` | 9 MB | cache, presence, rate limits |
| `nats` | 8 MB | events |

`core` is the largest of the six Kern services — it hosts the most modules. `app`, `chat`, `mail`,
`collab` and `core-worker` each host less and use less. The whole base stack idles under 700 MB.

So the 4 GB is not for idling. It is the room Postgres uses to cache your data, and the room the
services use while your team is working.

## Install

Goal: a running Kern at your domain, ready for the first sign-in.

1. Install Docker with the Compose plugin, if the machine does not have it. Docker's own
   instructions are at [docs.docker.com/engine/install](https://docs.docker.com/engine/install/).

   **Result:** `docker compose version` prints a version.

2. Run the installer:

   ```bash
   curl -fsSL https://get.kernaio.com | bash
   ```

   It asks for a domain, an admin email and an admin password.

   Piping into `bash` is supported. The installer reads every answer from `/dev/tty` rather than
   from its standard input, so the pipe carrying the script cannot answer its own questions. If
   there is no terminal at all — a CI job, `ssh host 'curl … | bash'` — it changes nothing and stops
   with instructions.

   To read the script before running it, download it instead. It is short and has no hidden steps:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/KernAIO/app/main/selfhost/install.sh -o install.sh
   less install.sh
   bash install.sh
   ```

**Result:** the installer prints the address of your new Kern. The first boot runs the database
migrations and creates the admin user from the email address and password you gave.

What the installer does:

1. Creates `~/kern` (override with `KERN_DIR`) and downloads `docker-compose.yml`, `Caddyfile`,
   `livekit.yaml`, `.env.example`, the Postgres init SQL, the three scripts — `kern-upgrade.sh`,
   `kern-rollback.sh`, `kern-backup.sh` — and four systemd user units from the `app` repository. A
   file that is already there is left alone.
2. Checks that Docker is available, and stops if it is not.
3. Reads the [release feed](/developers/releases-and-migrations/#the-release-feed) and pins
   `KERN_VERSION` to the newest stable release. It never writes `latest`: a rollback records the
   version it came from, and `latest` is not one.
4. If no `.env` exists yet, copies `.env.example` to `.env` and asks you for:
   - the **domain or IP** users will open,
   - an **admin email**, used for Let's Encrypt and as the first admin account,
   - an **admin password**.

   It then generates `KERN_SECRET`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`,
   `KERN_DB_APP_PASSWORD` and `S3_SECRET_KEY` with `openssl rand`, and `MAIL_WEBHOOK_TOKEN`, which
   provider bounce webhooks must present. It fills in `KERN_BASE_URL`, `KERN_DIR`,
   `S3_PUBLIC_ENDPOINT` and `MAIL_FROM` for your domain. If the domain is an IP or `localhost`,
   `ACME_EMAIL` is set to `internal` so Caddy uses its internal CA.
5. If `.env` already exists, it changes nothing except to fill in `KERN_DIR`,
   `KERN_DB_APP_PASSWORD` and `MAIL_WEBHOOK_TOKEN` when they are missing.
6. Asks whether to start office and PDF previews (Gotenberg, the `preview`
   [Compose profile](/self-hosting/compose-profiles/)). That is the only profile it offers; it no
   longer asks about video calls, because nothing in Kern places one.
7. Asks whether to install two user timers: one that lets the instance
   [upgrade itself](/self-hosting/upgrading/) once you switch that on in **Admin → Updates**, and
   one that runs [`kern-backup.sh`](/self-hosting/backups/) nightly.
8. Runs `docker compose pull` and `docker compose up -d`.

The script needs `curl`, `openssl` and `python3` (to read the feed); all three are on a stock
Ubuntu or Debian server.

Two things it deliberately does **not** do. It never connects to the database as the Postgres
superuser: `db-init` creates `kern_app` as `NOSUPERUSER NOBYPASSRLS`, which is what makes every
module's row-level security apply. And it never overwrites a value already in `.env`, so anything you
have set by hand survives a re-run and every upgrade.

## Manual install

If you prefer not to run a script at all:

```bash
mkdir -p ~/kern/postgres-init && cd ~/kern
RAW=https://raw.githubusercontent.com/KernAIO/app/main/selfhost
for f in docker-compose.yml Caddyfile livekit.yaml .env.example postgres-init/01-extensions.sql \
         kern-upgrade.sh kern-rollback.sh kern-backup.sh; do
  curl -fsSL "$RAW/$f" -o "$f"
done
chmod +x kern-upgrade.sh kern-rollback.sh kern-backup.sh
cp .env.example .env
chmod 600 .env
```

Then edit `.env`. These are the fields with no usable default:

| Field | Set it to |
|---|---|
| `KERN_DOMAIN` | the host name users open, for example `kern.example.com` |
| `KERN_BASE_URL` | `https://` plus that host name |
| `ACME_EMAIL` | your email, or `internal` for an IP or LAN install |
| `KERN_VERSION` | a release number from [the releases page](https://github.com/KernAIO/app/releases). **Not `latest`** — a rollback records the version you came from, and `latest` is not one. |
| `KERN_DIR` | the absolute path of this directory |
| `S3_PUBLIC_ENDPOINT` | the same value as `KERN_BASE_URL`. A bare origin with **no path**. |
| `MAIL_FROM` | a sender address on your domain |
| `KERN_ADMIN_EMAIL`, `KERN_ADMIN_PASSWORD` | the first instance admin |
| `KERN_SECRET`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`, `KERN_DB_APP_PASSWORD`, `S3_SECRET_KEY`, `MAIL_WEBHOOK_TOKEN` | a fresh `openssl rand -hex 32` each |

Leave `KERN_SIGNUP` commented out. A blank value is not "unset": core rejects the empty string and
refuses to start, and four other services wait on core.

Then start the stack:

```bash
docker compose up -d
```

**Result:** `docker compose ps` shows every service `running`, `db-init` `exited (0)`, and `caddy`
holding ports 80 and 443.

See the [Environment reference](/self-hosting/env-reference/) for every variable.

## Install on a PaaS

If your server is already managed by [Coolify](https://coolify.io), neither the installer nor the
manual steps above apply — Coolify holds the ports, issues the certificate and keeps the
environment. Kern ships a Compose file written for it, and there is no script to pipe into bash.
See [Install on Coolify](/self-hosting/coolify/).

## What gets started

Every Kern image is tagged `${KERN_VERSION}`, so an instance runs one version across all of them.

| Service | Image | Role |
|---|---|---|
| `caddy` | `caddy:2-alpine` | TLS termination and routing (ports 80/443) |
| `app` | `ghcr.io/kernaio/shell` | SvelteKit PWA (:3000) |
| `core` | `ghcr.io/kernaio/core` | identity, workspaces, permissions, notifications + the tracker, quire, hr, billing and inventory modules (:4000) |
| `core-worker` | `ghcr.io/kernaio/core` | background jobs (pg-boss) |
| `chat` | `ghcr.io/kernaio/chat` | chat + realtime WebSocket gateway (:4100) |
| `mail` | `ghcr.io/kernaio/mail` | outbound providers and provider webhooks (:4200) |
| `collab` | `ghcr.io/kernaio/collab` | Yjs collaborative editing (:4300) |
| `postgres` | `pgvector/pgvector:pg18` | database |
| `db-init` | `pgvector/pgvector:pg18` | runs to completion on every `up`: creates the extensions, and creates `kern_app` — the non-superuser role the services connect as |
| `nats` | `nats:2.11-alpine` | event bus (JetStream) |
| `valkey` | `valkey/valkey:8-alpine` | cache, presence, rate limits |
| `minio` | `minio/minio:RELEASE.2025-09-07T16-13-09Z` | object storage for files |
| `minio-init` | `minio/mc:RELEASE.2025-08-13T08-35-41Z` | runs to completion: creates the bucket |

`minio` and `minio-init` are pinned rather than following `latest`, because this artifact's promise
is a reproducible install and MinIO has changed its licence and dropped features across releases.

Three more services exist behind a profile and none of them starts by default: `livekit`
(`--profile calls`), `gotenberg` (`--profile preview`) and `updater` (`--profile autoupdate`). See
[Compose profiles](/self-hosting/compose-profiles/).

## First steps after install

1. Open `https://<your-domain>` and sign in with the admin credentials.
2. Create your first workspace.
3. Invite teammates from **Settings → Members**.
4. Switch on the modules you want in **Settings → Modules**.
5. Configure an outbound email provider in **Settings → Email**, or set `SMTP_URL` and `MAIL_FROM`
   in `.env` as the instance default.
6. Register your provider's bounce webhook, if it has one — see
   [Provider webhooks](/self-hosting/env-reference/#provider-webhooks).

**Result:** **Settings → Email** sends a test message, and it arrives.

## Useful commands

```bash
cd ~/kern
docker compose ps                 # status
docker compose logs -f core       # logs for one service
./kern-upgrade.sh --check         # is the instance ready to upgrade, and to what
./kern-upgrade.sh                 # upgrade to the newest release (snapshot first)
./kern-rollback.sh                # undo the last upgrade
./kern-backup.sh                  # back up the database, the files and the configuration
docker compose down               # stop (data volumes are kept)
```

`docker compose pull` on its own upgrades nothing: `KERN_VERSION` is pinned, and only
`kern-upgrade.sh` moves it. See [Upgrading](/self-hosting/upgrading/).

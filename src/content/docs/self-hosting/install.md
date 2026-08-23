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
| Suits | a team of about twenty, running issues, chat, docs and mail | calls and office previews switched on, mail syncing several accounts, or more than fifty people |

The minimum is the smallest tier at most hosts. Disk is about 1.5 GB of images plus your database
and your files — what people upload decides the real number.

### The software

- **Docker 24 or newer**, with the Compose plugin. Any Linux distribution. macOS runs it for a look,
  not for a team.
- **x86-64.** The published images are `amd64`. An arm64 server — Ampere, Graviton, a Raspberry Pi —
  needs images built for it.
- A **domain name** pointing at the host, for automatic HTTPS. An IP address works for a machine on
  your network; Caddy then issues a self-signed certificate.
- Ports **80** and **443** open. Calls add **7881/tcp** and **50000–50200/udp**.
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

## One-line install

```bash
curl -fsSL https://raw.githubusercontent.com/KernAIO/kern/main/selfhost/install.sh | bash
```

The script is short and readable; you are encouraged to inspect it first. It does the following:

1. Creates `~/kern` (override with `KERN_DIR`) and downloads `docker-compose.yml`, `Caddyfile`, `livekit.yaml`, `.env.example` and the Postgres init SQL from the `kern` repository.
2. Checks that Docker is available.
3. If no `.env` exists yet, copies `.env.example` to `.env` and asks you for:
   - the **domain or IP** users will open,
   - an **admin email** (used for Let's Encrypt and as the first admin account),
   - an **admin password**.
   It then generates `KERN_SECRET`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`, `S3_SECRET_KEY` and LiveKit keys with `openssl rand`, and fills in `KERN_BASE_URL`, `S3_PUBLIC_ENDPOINT` and `MAIL_FROM` for your domain. If the domain is an IP or `localhost`, `ACME_EMAIL` is set to `internal` so Caddy uses its internal CA.
4. Asks whether to enable the optional **calls** (LiveKit) and **preview** (Gotenberg) profiles.
5. Runs `docker compose pull` and `docker compose up -d`.

When it finishes it prints the URL to open. The first boot runs database migrations and creates the admin user from `KERN_ADMIN_EMAIL` / `KERN_ADMIN_PASSWORD`.

## Manual install

If you prefer not to pipe a script into bash:

```bash
mkdir -p ~/kern/postgres-init && cd ~/kern
RAW=https://raw.githubusercontent.com/KernAIO/kern/main/selfhost
for f in docker-compose.yml Caddyfile livekit.yaml .env.example postgres-init/01-extensions.sql; do
  curl -fsSL "$RAW/$f" -o "$f"
done
cp .env.example .env
# edit .env: KERN_DOMAIN, KERN_BASE_URL, ACME_EMAIL, secrets (openssl rand -hex 32), admin credentials
docker compose up -d
```

See the [Environment reference](/self-hosting/env-reference/) for every variable.

## Install on a PaaS

If your server is already managed by [Coolify](https://coolify.io), neither the installer nor the
manual steps above apply — Coolify holds the ports, issues the certificate and keeps the
environment. Kern ships a Compose file written for it, and there is no script to pipe into bash.
See [Install on Coolify](/self-hosting/coolify/).

## What gets started

| Service | Image | Role |
|---|---|---|
| `caddy` | `caddy:2-alpine` | TLS termination and routing (ports 80/443) |
| `app` | `ghcr.io/kernaio/app` | SvelteKit PWA (:3000) |
| `core` | `ghcr.io/kernaio/core` | identity, workspaces, permissions, notifications + most modules (:4000) |
| `core-worker` | `ghcr.io/kernaio/core` | background jobs (pg-boss) |
| `chat` | `ghcr.io/kernaio/chat` | chat + realtime WebSocket gateway (:4100) |
| `mail` | `ghcr.io/kernaio/mail` | outbound providers, IMAP sync, inbound intake (:4200) |
| `collab` | `ghcr.io/kernaio/collab` | Yjs collaborative editing (:4300) |
| `postgres` | `pgvector/pgvector:pg18` | database (pgvector, pg_trgm, ltree) |
| `nats` | `nats:2.11-alpine` | event bus (JetStream) |
| `valkey` | `valkey/valkey:8-alpine` | cache, presence, rate limits |
| `minio` | `minio/minio` | object storage for files |

Optional: `livekit` (`--profile calls`), `gotenberg` (`--profile preview`). See [Compose profiles](/self-hosting/compose-profiles/).

## First steps after install

1. Open `https://<your-domain>` and sign in with the admin credentials.
2. Create your first workspace; invite teammates by email.
3. In **Workspace settings → Modules**, enable the modules you want.
4. In **Workspace settings → Mail**, configure an outbound provider (or set `SMTP_URL`/`MAIL_FROM` in `.env` as the instance default).
5. Optionally configure an AI provider key and LiveKit for calls.

## Useful commands

```bash
cd ~/kern
docker compose ps                 # status
docker compose logs -f core       # logs for one service
docker compose pull && docker compose up -d   # upgrade
docker compose down               # stop (data volumes are kept)
```

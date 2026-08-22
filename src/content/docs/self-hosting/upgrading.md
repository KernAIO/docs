---
title: Upgrading
description: How to move a self-hosted Kern instance to a newer release.
---

Kern images are published to GHCR per service and tagged per release (`v1.2.3`, `1.2`, `latest`). The `kern` repository pins the versions that are tested together in each release.

## Standard upgrade

```bash
cd ~/kern
docker compose pull
docker compose up -d
```

`core` applies database migrations on start-up; other services wait for `core` to report healthy. Migrations are per-module and forward-only, so a normal upgrade needs no manual SQL.

## Pinning a version

`KERN_VERSION` in `.env` selects the image tag for all Kern services. `latest` follows the newest stable release; set it to a specific tag to control when you upgrade:

```bash
sed -i 's/^KERN_VERSION=.*/KERN_VERSION=1.1.0/' .env
docker compose pull && docker compose up -d
```

## Before upgrading

1. Read the release notes on GitHub for breaking changes and new required environment variables. New variables always have safe defaults or are documented in the [Environment reference](/self-hosting/env-reference/).
2. Take a [backup](/self-hosting/backups/) — at least a `pg_dump`.
3. If you customised `Caddyfile` or `docker-compose.yml`, diff them against the new versions in the `kern` repository.

## Rolling back

Rolling back an image is `KERN_VERSION=<previous>` + `docker compose up -d`. Because migrations are forward-only, roll back the **database** from your pre-upgrade dump if the schema changed; minor releases avoid destructive schema changes, so in most cases the older images run fine against the newer schema.

## Zero-downtime notes

- Web and API containers are stateless; Compose restarts them one by one, and Caddy retries upstreams briefly.
- WebSocket clients reconnect automatically and resume their subscriptions.
- Long-running jobs are retried by pg-boss if a worker stops mid-job.

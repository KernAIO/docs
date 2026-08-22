---
title: Compose profiles
description: Which containers run by default, and which optional profiles you can enable.
---

The self-host `docker-compose.yml` uses [Compose profiles](https://docs.docker.com/compose/how-tos/profiles/) so the default installation stays small and optional services are opt-in.

## Base (no profile)

Always started: `caddy`, `app`, `core`, `core-worker`, `chat`, `mail`, `collab`, `postgres`, `nats`, `valkey`, `minio` (plus a one-shot `minio-init` that creates the bucket).

This is everything needed for issues, chat, docs & drive, HR, recruiting, CRM, automation, mail and the AI assistant.

## `--profile calls` — LiveKit

Adds `livekit` (`livekit/livekit-server`), configured by `livekit.yaml` and the `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` variables that `install.sh` generates. Required for audio/video calls, huddles and interview calls.

Open **7881/tcp** and **50000–50200/udp** on your firewall. For clients behind strict NATs you may additionally want a TURN server; `livekit.yaml` is the place to configure it.

```bash
docker compose --profile calls up -d
```

## `--profile preview` — Gotenberg

Adds `gotenberg` (`gotenberg/gotenberg:8`), used by Drive to render office documents and other formats to PDF/thumbnails. Image, video and PDF previews work without it.

```bash
docker compose --profile preview up -d
```

## `--profile search` — Meilisearch (*v1.x*)

Kern v1.0 searches with Postgres full-text search and trigram indexes, which needs no extra service. A Meilisearch provider is planned for v1.x and will be enabled with this profile.

## `--profile observability` — GlitchTip + OpenTelemetry (planned)

Error tracking and traces for operators who want them. Not required for normal operation.

## Combining profiles

Profiles are additive and must be repeated on every `docker compose` invocation that should include them (or exported once):

```bash
export COMPOSE_PROFILES=calls,preview
docker compose pull && docker compose up -d
```

## Scaling notes

- `core-worker` can be scaled (`docker compose up -d --scale core-worker=2`); jobs are claimed through pg-boss so workers do not collide.
- `chat` instances fan out through NATS; run more than one behind Caddy when you have thousands of concurrent WebSocket clients.
- `mail` keeps one IMAP IDLE connection per active inbox account; raise its memory limit if many users connect mailboxes.
- Postgres, NATS, Valkey and MinIO can all be replaced with external managed services by pointing the corresponding URLs in `.env` at them and removing the bundled containers.

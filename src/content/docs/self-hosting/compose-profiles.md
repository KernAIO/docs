---
title: Compose profiles
description: Which containers run by default, which optional profiles exist, and which of them have anything behind them yet.
---

The self-host `docker-compose.yml` uses
[Compose profiles](https://docs.docker.com/compose/how-tos/profiles/) so the default installation
stays small and optional services are opt-in.

## Base (no profile)

Always started: `caddy`, `app`, `core`, `core-worker`, `chat`, `mail`, `collab`, `postgres`, `nats`,
`valkey` and `minio`, plus two one-shot containers — `db-init`, which creates the extensions and the
`kern_app` role, and `minio-init`, which creates the bucket.

That is everything Kern ships: issues, chat, the wiki, people, outbound mail, the asset register and
billing. Every module runs inside `core`, `chat` or `mail`; none of them needs a container of its
own. See [Feature overview](/introduction/feature-overview/).

## `--profile preview` — Gotenberg

Adds `gotenberg` (`gotenberg/gotenberg:8`). **Quire's PDF export** is the one thing that uses it: the
export job renders a page to HTML and posts it to Gotenberg's Chromium.

Quire's other export formats — Markdown and HTML, either of them as a ZIP when the export covers
more than one page — work without it. So does everything else in Kern.

```bash
docker compose --profile preview up -d
```

**Result:** `docker compose ps` lists `gotenberg` as `running`, and a PDF export in Quire finishes
instead of failing with "could not reach Gotenberg".

Without the profile a PDF export fails cleanly and says which container is missing; nothing else
degrades. `core` reads `GOTENBERG_URL` and defaults to `http://gotenberg:3000`, which is this
container — so there is nothing to configure.

## `--profile autoupdate` — the updater

Adds `updater` (`docker:27-cli`), which runs `kern-upgrade.sh --auto` hourly. It exists for a host
with no systemd, and it does nothing at all until an admin switches automatic updates on in
**Admin → Updates**.

```bash
docker compose --profile autoupdate up -d
```

:::caution
This container mounts the Docker socket, which gives it control of the whole host — a compromise of
Kern becomes a compromise of everything Docker runs here. Prefer the systemd timer `install.sh`
offers when the machine has systemd.
:::

## `--profile calls` — LiveKit

Adds `livekit` (`livekit/livekit-server`), configured by `livekit.yaml` and the `LIVEKIT_API_KEY` /
`LIVEKIT_API_SECRET` variables.

**Nothing uses it.** No calls module ships, and no code in any Kern service or module places a call,
mints a room token or renders a call surface — so this profile starts a server no part of the
product talks to. It is here for the release that ships calls. Leave it off; see
[Calls](/modules/calls/).

## There are three profiles, and no others

`preview`, `autoupdate` and `calls` are the whole list. A `--profile` naming anything else — the
`search` and `observability` profiles earlier versions of this page described — matches no service,
so Compose starts nothing extra and reports no error. Kern searches with Postgres full-text search
and trigram indexes and needs no search container; error tracking is not bundled.

## Combining profiles

Profiles are additive and must be repeated on every `docker compose` invocation that should include
them — or exported once:

```bash
export COMPOSE_PROFILES=preview
docker compose pull && docker compose up -d
```

Forget the flag on one command and Compose treats those containers as not part of the project, so
`docker compose up -d` stops them.

## Scaling notes

- `core-worker` can be scaled (`docker compose up -d --scale core-worker=2`); jobs are claimed
  through pg-boss so workers do not collide.
- `chat` instances fan out through NATS; run more than one behind Caddy when you have thousands of
  concurrent WebSocket clients.
- Postgres, NATS, Valkey and MinIO can all be replaced with external managed services by pointing
  the corresponding URLs in `.env` at them and removing the bundled containers. For Postgres, read
  [External Postgres](/self-hosting/external-postgres/) first — the `kern_app` role that `db-init`
  creates is what makes row-level security apply.

---
title: Reverse proxy & TLS
description: How Caddy routes requests to Kern services and how HTTPS certificates are obtained.
---

Kern bundles [Caddy](https://caddyserver.com/) as its edge: it terminates TLS, compresses responses, sets security headers and routes paths to the right service. Everything is served from **one domain** — there are no separate API or WebSocket hostnames to configure.

## Routing

The shipped `Caddyfile` routes as follows (first match wins):

| Path | Upstream | What |
|---|---|---|
| `/api/chat/*`, `/ws`, `/ws/*` | `chat:4100` | chat API and the realtime WebSocket |
| `/api/mail/*` | `mail:4200` | mail module API and provider webhooks |
| `/collab*` | `collab:4300` | Yjs/Hocuspocus collaborative editing WebSocket |
| `/s3/*` | `minio:9000` | presigned object-storage URLs (path prefix stripped) |
| `/api/*` | `core:4000` | auth, workspaces and every other module's API, OpenAPI docs |
| everything else | `app:3000` | the SvelteKit web app |

Responses also get `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that allows camera/microphone/screen capture for calls, and the `Server` header removed.

## Certificates

Caddy obtains and renews certificates automatically:

- **Real domain** — set `KERN_DOMAIN=kern.example.com` and `ACME_EMAIL=you@example.com`. Caddy uses Let's Encrypt (HTTP-01 on port 80 and TLS-ALPN on 443). Make sure DNS points at the host *before* the first start.
- **IP address or `localhost`** — set `ACME_EMAIL=internal`. Caddy signs a certificate with its own local CA. Browsers will warn once; you can trust the CA from the `caddy_data` volume (`/data/caddy/pki/authorities/local/root.crt`) on client machines.

Certificates and the CA live in the `caddy_data` volume — back it up with the rest of your data to avoid re-issuing after a restore.

## Running behind another proxy

If you already have nginx, Traefik or a cloud load balancer in front, you have two options:

1. **Keep Caddy, pass through TCP 443** (SNI passthrough) so Caddy still handles certificates. Simplest.
2. **Terminate TLS at your proxy** and forward plain HTTP to Caddy on port 80. Remove the `email` global option and change the site address in `Caddyfile` to `:80` (or `http://kern.example.com`) so Caddy does not try to obtain certificates. Ensure your proxy forwards `Upgrade`/`Connection` headers for `/ws` and `/collab`, and sets `X-Forwarded-Proto: https` so the app generates correct links.

In both cases `KERN_BASE_URL` must be the public `https://` URL users see.

## Timeouts and WebSockets

The chat gateway and collab server hold long-lived WebSocket connections. Caddy handles these without tuning. If you add another proxy, raise its idle/read timeouts (e.g. nginx `proxy_read_timeout 3600s`) for `/ws` and `/collab`.

## Large uploads

File uploads use the resumable **tus** protocol in chunks, so you rarely need to raise body-size limits. The API itself accepts bodies up to 25 MB.

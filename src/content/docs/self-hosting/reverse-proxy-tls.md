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
| `/kern/*` | `minio:9000` | presigned object-storage URLs, path untouched |
| `/mcp`, `/mcp/*`, `/.well-known/oauth-protected-resource*`, `/.well-known/oauth-authorization-server` | `core:4000` | the MCP endpoint and the discovery documents an MCP client reads first |
| `/api/*` | `core:4000` | auth, workspaces and every other module's API, OpenAPI docs |
| everything else | `app:3000` | the SvelteKit web app |

Responses also get `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, a `Permissions-Policy` allowing camera, microphone and screen capture from the app's own origin, and the `Server` header removed.

### The storage route is the bucket name, and nothing may strip it

`/kern/*` is `S3_BUCKET`, not a prefix Kern invented, and the path reaches MinIO byte-identical.

A presigned URL is a SigV4 signature over the canonical path, so MinIO recomputes the signature from
the path it receives. Strip anything, and the two paths differ and MinIO answers **403
SignatureDoesNotMatch** — on every upload and every download, with the browser reporting only a
failed request. This is why `S3_PUBLIC_ENDPOINT` is a bare origin (`https://kern.example.com`) with
no path of its own.

If you write your own proxy configuration, do not add a prefix, a rewrite or a strip on this route.
`kern` is a reserved slug in core, so no workspace can ever live at `/kern` and shadow it.

### MCP is served from the root, not from `/api`

Core serves `/mcp` and the two OAuth discovery documents at the root of its own app, because the MCP
and RFC 8414/9728 specifications fix those paths. A proxy that routes only `/api/*` to core sends
them to the web app instead, which answers HTML — and an MCP client reads that as a malformed
discovery document and gives up.

These routes are newer than some instances. An upgrade brings `Caddyfile` forward for you — but only
while your copy still matches the one your current version shipped, because it cannot tell an edit of
yours from a file it may safely replace. If you have edited it, the upgrade leaves it alone and
prints the release's diff instead.

To bring the routes in by hand, take the current file and reload Caddy:

```bash
cd ~/kern
./kern-upgrade.sh --stack-files
docker compose up -d caddy
```

`--stack-files` refreshes the distribution files and nothing else: no images, no migrations, no
downtime.

**Result:** `curl -s -o /dev/null -w '%{http_code}\n' https://<your-domain>/mcp` prints `405`. That
answer comes from core and proves the route reaches it; a `200` means the web app is still
answering.

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

Forward **every** path to Caddy and let it do the routing. A front proxy that forwards only `/api`
and `/` misses `/ws`, `/collab*`, `/kern/*` and `/mcp`, which is four broken features rather than an
error anyone can see.

If you terminate TLS at your own proxy, add the trusted-proxy line to the global block of
`Caddyfile`:

```caddy
{
	email {$ACME_EMAIL}
	servers {
		trusted_proxies static private_ranges
	}
}
```

Without it Caddy overwrites `X-Forwarded-Proto` with `http` and replaces the client IP with your
proxy's, so every service believes the request arrived unencrypted. A host install does not need
this line, because there Caddy is the edge.

## Timeouts and WebSockets

The chat gateway and collab server hold long-lived WebSocket connections. Caddy handles these without tuning. If you add another proxy, raise its idle/read timeouts (e.g. nginx `proxy_read_timeout 3600s`) for `/ws` and `/collab`.

## Large uploads

A file upload is **one presigned PUT** straight to object storage. It is not chunked, and resumable
(tus) uploads are not built — so the whole file crosses every proxy in front of Kern in a single
request body.

Core signs a URL for any file up to `UPLOAD_MAX_PUT_BYTES`, which defaults to **500 MB**. Every
proxy between the browser and MinIO has to accept a body that large, or the upload fails at the
proxy and the browser reports only a network error.

| Proxy | What to do |
|---|---|
| Kern's own Caddy | nothing; the shipped `Caddyfile` sets no body limit |
| nginx | raise `client_max_body_size` to at least `500m` — the default is `1m` |
| Cloudflare | Free and Pro reject a body over **100 MB**, and that cap cannot be raised on those plans |
| anything else | find its request-body limit and raise it to at least 500 MB |

Lowering the cap instead means setting `UPLOAD_MAX_PUT_BYTES` on `core`, and the shipped
`docker-compose.yml` does not pass that variable through — see
[Environment reference](/self-hosting/env-reference/#variables-the-compose-file-does-not-pass).

Kern's own API is a different path and a different limit: `/api/*` accepts bodies up to **25 MB**,
which is the Fastify body limit every service is built with. Uploads never go through it.

If your CDN or WAF caps request bodies below 500 MB, keep storage off the app domain rather than
lowering the cap. Add a second site block for the storage host, give it its own DNS record, and
point `S3_PUBLIC_ENDPOINT` at it:

```caddy
files.kern.example.com {
	reverse_proxy minio:9000
}
```

That makes the upload cross-origin, so the bucket then needs a CORS rule allowing your app origin
with `ETag` exposed. Kern Cloud runs exactly this arrangement, because Cloudflare's 100 MB body
limit is below the 500 MB core signs for.

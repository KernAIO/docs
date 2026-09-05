---
title: API & OpenAPI
description: How to call Kern's HTTP API — oRPC and REST endpoints per module, authentication, errors and OpenAPI documents.
---

Every module's router is mounted by the hosting service under **`/api/<module>`** in two flavours plus a generated OpenAPI document.

| URL | What |
|---|---|
| `/api/<module>/rpc/*` | **oRPC** protocol — used by the SvelteKit app through `@kernhq/sdk` (typed client, batching, streaming) |
| `/api/<module>/<path>` | **REST / OpenAPI-style** routes from the contract's `route({ method, path })` — for curl, scripts, third parties, webhooks |
| `/api/<module>/openapi.json` | OpenAPI **3.1** document for that module (Zod schemas converted to JSON Schema) |

Because Caddy routes by path, `/api/chat/*` reaches the chat service, `/api/mail/*` the mail service, and everything else under `/api/*` goes to core — clients never need to know which service hosts what.

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://kern.example.com/api/tracker/issues?workspaceId=0192…&limit=20"
```

## Authentication

- **Bearer JWT** — issued by core (Better Auth) for sessions; verified by every service against core's JWKS (`/api/auth/jwks`).
- **API tokens** — personal or workspace-scoped tokens created in settings; sent the same way (`Authorization: Bearer`).
- **Service tokens** — short-lived HS256 tokens for service-to-service calls (`x-kern-service` header); not for third parties.

All procedures that touch tenant data take a `workspaceId`; the server checks active membership, that the module is enabled in that workspace, and the required permission.

## Errors

```json
{ "code": "FORBIDDEN", "message": "Forbidden", "details": { "permission": "tracker.issue.edit" } }
```

| Code | HTTP |
|---|---|
| `BAD_REQUEST`, `VALIDATION` | 400 / 422 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN`, `MODULE_DISABLED` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `RATE_LIMITED` | 429 |
| `INTERNAL`, `UNAVAILABLE` | 500 / 503 |

Some errors carry a stable `reason` (e.g. `tracker.issue.key_taken`) for i18n.

## Pagination

List endpoints accept `cursor` and `limit` (1–200, default 50) and return `{ items, nextCursor, total? }`.

## System endpoints

| URL | Purpose |
|---|---|
| `GET /api/health` | liveness: `{ ok, service, version, modules }` |
| `GET /api/ready` | readiness: database reachable (503 otherwise) |

## Rate limiting

600 requests per minute per IP by default (service calls exempt). Responses include `x-request-id` for support.

## Webhooks

**Outgoing webhooks are not built** — nothing in Kern calls out to a URL you register.

Two modules accept an **incoming** one, and each authenticates it in its own way because neither
caller can present a Kern session:

| Endpoint | Who posts to it | How it is authenticated |
|---|---|---|
| `POST /api/chat/webhooks/{token}` | anything you want to post into a channel | the token in the path, which is bound to one channel |
| `POST /api/mail/webhooks/{provider}` | Mailgun, Postmark, SES or Resend | `?token=` or `x-kern-webhook-token`, matched against `MAIL_WEBHOOK_TOKEN`; SES events are also SNS-signature checked |
| `POST /api/billing/webhook` | Stripe | the Stripe signature, against `STRIPE_WEBHOOK_SECRET` |

## Generating clients

Point any OpenAPI 3.1 generator at `/api/<module>/openapi.json`, or use `@kernhq/sdk` from TypeScript for end-to-end types.

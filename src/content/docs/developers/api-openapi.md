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

Outgoing and incoming are separate questions, and Kern answers them differently. Read the one you
need.

### Outgoing

There is no workspace-level webhook registry. Nothing lets you register a URL and receive every
event, and no screen anywhere in Kern lists your outgoing webhooks.

One feature does call out to an address you choose: Tracker's **Call webhook** workflow
post-function. Put it on a transition, and Tracker sends an HTTP request every time that transition
runs.

| Question | Answer |
|---|---|
| What it sends | `POST` by default, or `PUT` or `GET`, to the URL in the post-function's config, with the headers it names |
| What is in the body | the post-function's `payload`, or the issue when the post-function sets none |
| Whether it is signed | **no.** Kern adds no signature header, so the receiver has to authenticate the call from a header you set yourself |
| Who can add one | anyone with `tracker.workflow.manage` — owner and admin by default |
| What happens when it fails | nothing to the issue. The transition is committed first and the call is fire-and-forget; a refusal or a transport failure is logged by the service hosting Tracker |

Adding one is an API call today. **Settings → Workflows** shows a transition's rules as sentences
and does not edit them, so you send the whole workflow definition to
`POST /api/tracker/workflows` or `PATCH /api/tracker/workflows/{id}` with a
`{"type": "webhook", "config": {"url": "..."}}` entry in the transition's `postFunctions`. No
workflow template Kern ships contains one, so nothing calls out until you add it.

Where it may point is not up to the URL alone. Tracker refuses anything but `http` and `https`,
refuses credentials in the URL, resolves the hostname before opening a socket and refuses the call
when any address it answers with is loopback, private, link-local, unique-local, multicast or
reserved. The socket then goes to the address that was checked, so a second lookup cannot answer
differently. Redirects are not followed. The response is read to 64 KB and the call gives up after
10 seconds.

:::caution[A refused webhook is silent to the person who moved the issue]
The transition succeeds either way. If a workflow webhook stops arriving, read the log of the
service hosting Tracker — `core` in the shipped stack — for `tracker: workflow webhook refused`,
which carries the address and the reason.
:::

### Incoming

Two modules accept an incoming webhook, and each authenticates it in its own way because neither
caller can present a Kern session:

| Endpoint | Who posts to it | How it is authenticated |
|---|---|---|
| `POST /api/mail/webhooks/{provider}` | Mailgun, Postmark, SES or Resend | `?token=` or `x-kern-webhook-token`, matched against `MAIL_WEBHOOK_TOKEN`; SES events are also SNS-signature checked |
| `POST /api/billing/webhook` | Stripe | the Stripe signature, against `STRIPE_WEBHOOK_SECRET` |

Chat has none. Earlier documentation described `POST /api/chat/webhooks/{token}`; nothing could ever
create a token for it, so it answered 404 to everyone, and it was removed rather than left
advertised.

## Generating clients

Point any OpenAPI 3.1 generator at `/api/<module>/openapi.json`, or use `@kernhq/sdk` from TypeScript for end-to-end types.

---
title: Collab protocol
description: How collaborative editing works — Hocuspocus/Yjs at /collab, document naming, access checks, persistence, snapshots and the procedures a module can call.
---

Rich text in Kern — Quire pages and issue descriptions — is edited collaboratively with **Yjs**
through the `collab` service, a [Hocuspocus](https://tiptap.dev/docs/hocuspocus) server behind
`/collab`.

## Connecting

Clients use `@hocuspocus/provider`, wrapped by the editor in `@kernhq/ui`:

```ts
new HocuspocusProvider({
  url: 'wss://kern.example.com/collab',
  name: 'ws:0192…:quire:page:0192…',   // document name
  document: ydoc,
})
```

**A browser sends no token.** The session cookie (`kern.session_token`, `__Secure-` prefixed over
TLS) is `HttpOnly`, so the page cannot read it to hand to the provider — but it rides on the
WebSocket upgrade request, and the gateway reads it there. This is the same handshake the chat
gateway uses, deliberately parsed the same way so the two agree about what a session is.

An API client or a native app that holds a bearer token passes it as `token`. When both a token and
a cookie arrive, the token wins.

Resolved principals are cached for 60 seconds, so a session revoked during that window can hold an
open socket for up to a minute.

## Document naming

```
ws:<workspaceId>:<module>:<type>:<id>
ws:0192…:quire:page:0192…       a wiki page
ws:0192…:tracker:issue:0192…    an issue description
```

The name encodes enough for the server to authorise and persist without a lookup. Build and parse it
with `formatCollabDocument` and `parseCollabDocument` from `@kernhq/contracts`: the gateway parses
with the same function, and a name it cannot parse is a rejected connection with no useful error.

## Authentication and access

On `onAuthenticate` the server resolves the principal, parses the document name, and requires
**active membership** in the workspace. It then asks the owning module for fine-grained access:

```
kernel.call('<module>.collab.access', { workspaceId, type, id, userId })
→ { canRead: boolean, canWrite: boolean }
```

If `canRead` is false the connection is rejected. If `canWrite` is false the connection is
**read-only**: the server drops incoming updates, and strips the cursor and selection out of that
connection's awareness, so a reader appears in the presence list without a caret.

Both shapes are declared once in `@kernhq/contracts` — `CollabAccessInput` and `CollabAccess`. Use
them rather than retyping the fields. The first module to implement this procedure was written
against a different signature from the one the gateway calls, so the call threw on every request and
the fallback below made it look exactly like a module that worked.

If the module does not answer — not installed, or no `collab.access` procedure — the server falls
back to workspace membership: **an active member may read and write, and a member whose role is
`guest` may read only.** That keeps documents usable while a module is still being built, and it is
why a module that owns collaborative content must implement the procedure rather than relying on it.

`quire` implements it for `page`, and `tracker` for `issue`.

## Persistence

- `onLoadDocument` loads the stored Yjs update for the name, if any, into the in-memory document.
- `onStoreDocument` upserts `Y.encodeStateAsUpdate(doc)` into **`kern_collab.documents`**: `name`
  (pk), `workspace_id`, `module`, `type`, `object_id`, `state bytea`, `size`, `updated_at`. It is
  debounced by `COLLAB_DEBOUNCE_MS` (2 s) with a ceiling of `COLLAB_MAX_DEBOUNCE_MS` (15 s), so a
  document somebody is typing in continuously is still written down every 15 seconds.
- `COLLAB_MAX_DOCUMENT_BYTES` (8 MiB) is both the WebSocket maximum payload and the point at which a
  store is refused. A document over the limit is logged and **not written**; the connection stays
  up, so the people editing keep working against a state that has stopped being persisted.

Row-level security is forced on `kern_collab.documents`, so every read and write runs inside
`withWorkspace`. Outside it the policy matches nothing and a query returns no rows rather than
failing, which is the failure mode worth being explicit about.

Awareness — cursors, selections, user colour — is relayed between clients and never persisted.

## Snapshots and search

While a document is loaded the service publishes a **`collab.document.updated`** event carrying a
plain-text export of it, at most once per `COLLAB_SNAPSHOT_INTERVAL_MS` (5 minutes) per document.
The interval is tracked per document and forgotten when the last client disconnects.

```
{ name?, workspaceId, module, type, objectId, text, updatedAt? }
```

Modules subscribe to it to index the text for search, mirror the prose onto their own row, or take a
version. `name` and `updatedAt` are optional so that during a rolling deploy an older `collab`
publishing without them is still indexed, rather than dropped by a subscriber that validated them as
required — fall back to the envelope's `occurredAt` and to `formatCollabDocument`.

The exporter walks every top-level shared type in the document, which is where Tiptap keeps its
ProseMirror content, and caps the result at 100,000 characters. Shapes it does not recognise
contribute nothing rather than being guessed at.

## Procedures a module can call

The gateway is otherwise write-only from the outside: clients push updates over the socket and
nothing else can see them. A module that keeps version history, restores a version, renders a page
nobody has open or deletes an object reaches the document through the procedure broker — in-process
when it is co-hosted, a NATS request otherwise.

| Procedure | Input | Output |
|---|---|---|
| `collab.document.state` | `{ name }` | `{ name, state, size, updatedAt }` |
| `collab.document.apply` | `{ name, update }` | `{ ok, size }` |
| `collab.document.replace` | `{ name, state }` | `{ ok, size }` |
| `collab.document.snapshot` | `{ name }` | `{ snapshot, state }` |
| `collab.document.delete` | `{ name }` | `{ ok }` |
| `collab.document.presence` | `{ name }` | `{ users, connections }` |

Three things hold for all of them.

They hand out document contents, so every one **refuses a caller that is not another Kern service or
an instance admin.**

Yjs state is binary and the broker speaks JSON, so `state`, `update` and `snapshot` cross the
boundary base64-encoded. That encoding is declared once in `@kernhq/contracts`, and both sides
use it.

`document.state` prefers the live copy whenever anybody has the document open, because persistence
is debounced and the stored state lags a whole debounce window behind what the people typing can
see. `updatedAt` stays the *stored* timestamp all the same: it says when the document was last
written down, and answering "now" because a tab is open would be a lie a caller deciding whether it
already has this version would act on.

`document.delete` is the only thing that removes a row from `kern_collab.documents`. A module that
deletes the object behind a document calls it, or the state outlives the object for ever.

### Why `replace` exists and `apply` will not do

`Y.applyUpdate` **merges**. Feeding an old version back through `collab.document.apply` produces the
union of the old document and the new one — every paragraph somebody deleted comes back beside the
paragraphs that replaced it.

Restoring a version means replacing, so `collab.document.replace` empties each top-level shared type
and re-inserts the content from the state it was given. It runs through a direct connection, which
means the people currently editing see the result and it is persisted by the normal store hook,
rather than being written to storage behind their backs and overwritten by their next keystroke.

It handles XML fragments only. A shared type holding keyed content is refused rather than replaced
wrongly and silently.

Quire's `versions.restore` and `versions.revert` both go through it.

## Operations

- Health: `GET /api/health` on the collab service.
- Metrics: `GET /api/collab/metrics` returns the same JSON, including `documents` and `connections`.
- Scale horizontally behind a sticky load balancer. Multi-instance sync through the Hocuspocus Redis
  extension is not implemented.

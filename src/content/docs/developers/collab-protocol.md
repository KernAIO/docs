---
title: Collab protocol
description: How collaborative editing works — Hocuspocus/Yjs at /collab, document naming, access checks, persistence and snapshots.
---

Rich text in Kern (docs pages, issue descriptions, comments) is edited collaboratively with **Yjs** through the `collab` service, a [Hocuspocus](https://tiptap.dev/docs/hocuspocus) server behind `/collab`.

## Connecting

Clients use `@hocuspocus/provider` (wrapped by the app's editor setup):

```ts
new HocuspocusProvider({
  url: 'wss://kern.example.com/collab',
  name: 'ws:0192…:docs:page:0192…',   // document name
  token: sessionJwt,
  document: ydoc,
})
```

## Document naming

```
ws:<workspaceId>:<module>:<type>:<id>
ws:0192…:docs:page:0192…        a wiki page
ws:0192…:tracker:issue:0192…    an issue description
```

The name encodes enough for the server to authorise and persist without a lookup.

## Authentication and access

On `onAuthenticate` the server resolves the token via `core.users.principal`, parses the document name, and requires **active membership** in the workspace. It then asks the owning module for fine-grained access:

```
kernel.call('<module>.collab.access', { workspaceId, type, id, userId })
→ { canRead: boolean, canWrite: boolean }
```

If `canRead` is false the connection is rejected; if `canWrite` is false the connection is **read-only** (the server drops incoming updates). If the module does not expose a `collab.access` procedure, the server falls back to membership only (read/write for members). Modules that own collaborative content should implement this procedure.

## Persistence

- `onLoadDocument` loads the stored Yjs update for the name (if any) into the in-memory document.
- `onStoreDocument` (debounced ~2 s, max 10 s) upserts `Y.encodeStateAsUpdate(doc)` into **`kern_collab.documents`**: `name` (pk), `workspace_id`, `module`, `type`, `object_id`, `state bytea`, `updated_at`.
- A maximum document size guards against runaway documents.

Awareness (cursors, selections, user colour) is relayed between clients and not persisted.

## Snapshots and search

Periodically (every few minutes for documents that changed) the service publishes a **`collab.document.updated`** event with a plain-text export of the document (`{ name, workspaceId, module, type, objectId, text, updatedAt }`). Modules subscribe to index the text for search, produce version history entries, or trigger automations. The exporter is pluggable; the default walks the Yjs XML fragment that Tiptap uses.

## Operations

- Health: `GET /api/health` on the collab service.
- Scale horizontally behind a sticky load balancer or use the Hocuspocus Redis extension (planned) for multi-instance sync.

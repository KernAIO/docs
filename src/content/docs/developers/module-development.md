---
title: Module development
description: Build a Kern module — package shape, contract, server, schema, migrations, client — by walking through the template module.
---

Every feature in Kern is a module, and first-party modules use exactly the same shape you would. The quickest start is to copy `packages/_template` in the [`modules`](https://github.com/KernAIO/modules) repository. This page walks through it file by file.

## Package shape

A module is an npm package named `@kernhq/module-<id>` that exports three entry points (plus its SQL migrations):

```json title="package.json"
{
  "name": "@kernhq/module-template",
  "type": "module",
  "files": ["dist", "migrations"],
  "exports": {
    "./contract": { "types": "./dist/contract.d.ts", "import": "./dist/contract.js" },
    "./server": { "types": "./dist/server/index.d.ts", "import": "./dist/server/index.js" },
    "./client": { "types": "./dist/client/index.d.ts", "svelte": "./dist/client/index.js", "import": "./dist/client/index.js" },
    "./migrations": "./migrations"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate"
  },
  "dependencies": { "@kernhq/contracts": "^0.1.0", "@kernhq/kernel": "^0.1.0", "@orpc/contract": "^1.15.0", "@orpc/server": "^1.15.0", "drizzle-orm": "^0.45.0", "zod": "^4.1.0" }
}
```

- `./contract` is imported by **both** server and client (and by other modules): schemas, the oRPC contract, events, permissions. No Node-only code.
- `./server` is imported by the service that hosts the module.
- `./client` is imported by the app.

## 1. Contract

```ts title="src/contract.ts"
import { baseContract, PageInput, WorkspaceId, page, defineEvent, definePermissions } from '@kernhq/contracts'
import { z } from 'zod'

export const MODULE_ID = 'template'
export const Widget = z.object({ id: z.uuid(), workspaceId: WorkspaceId, name: z.string().min(1).max(120), createdAt: z.string() })
export type Widget = z.infer<typeof Widget>
const ws = z.object({ workspaceId: WorkspaceId })

export const templateContract = {
  widgets: {
    list: baseContract.route({ method: 'GET', path: '/widgets', tags: ['template'] }).input(ws.extend(PageInput.shape)).output(page(Widget)),
    create: baseContract.route({ method: 'POST', path: '/widgets', tags: ['template'] }).input(ws.extend({ name: z.string().min(1) })).output(Widget),
  },
}

export const templateEvents = {
  widgetCreated: defineEvent('template.widget.created', z.object({ widgetId: z.uuid(), workspaceId: WorkspaceId })),
}
export const templatePermissions = definePermissions([
  { key: 'template.widget.view', label: 'View widgets', scope: 'workspace', defaultRoles: ['owner', 'admin', 'member', 'guest'], dangerous: false },
  { key: 'template.widget.manage', label: 'Create/edit widgets', scope: 'workspace', defaultRoles: ['owner', 'admin', 'member'], dangerous: false },
])
```

Conventions:

- **Module id**: lowercase identifier (`/^[a-z][a-z0-9_]*$/`), 2–32 chars. It names the API prefix (`/api/template`), the Postgres schema (`mod_template`), job and event prefixes.
- **Procedures** take `workspaceId` in the input; `baseContract` carries the shared error vocabulary (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `MODULE_DISABLED`, …) and oRPC `route()` metadata produces REST paths and OpenAPI.
- **Events** are `<module>.<entity>.<action>` with a Zod payload; `defineEvent` validates the name.
- **Permissions** are `<module>.<resource>.<action>` with label, narrowest scope, default built-in roles and a `dangerous` flag.

## 2. Server module

```ts title="src/server/index.ts"
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineModule, defineServerModule, implement_ } from './_impl.js'
import { MODULE_ID, templateEvents, templatePermissions } from '../contract.js'
import { schema } from './schema.js'

export const templateModule = defineServerModule({
  definition: defineModule({
    id: MODULE_ID,
    name: 'Template',
    version: '0.1.0',
    description: 'Example module',
    icon: 'puzzle',
    permissions: templatePermissions,
    events: templateEvents,
  }),
  schema,
  migrationsFolder: join(dirname(fileURLToPath(import.meta.url)), '../../migrations'),
  router: implement_,
  subscriptions: {
    'core.workspace.created': async (e, kernel) => { kernel.log.info({ e: e.name }, 'template saw workspace created') },
  },
})
export default templateModule
```

`defineServerModule` accepts, besides `definition`, `schema`, `migrationsFolder` and `router`:

| Field | Purpose |
|---|---|
| `subscriptions` | event name (or `module.*`) → handler; durable NATS consumers in production |
| `jobs` | pg-boss job definitions `{ name, schema, handler, options, cron }` — enqueue with `kernel.jobs.send('template.reindex', data)` |
| `procedures` | callable by other modules/services via `kernel.call('template.<name>', input)` |
| `automations` | triggers / conditions / actions registered with the Automation module |
| `search` | indexers per object type; `resolvers` render object references (title, url, icon) |
| `onBoot`, `onWorkspaceEnabled`, `onWorkspaceDisabled`, `onShutdown` | lifecycle hooks |

The definition can also declare `dependsOn`, `defaultHost` (`core` by default), `notificationTypes`, `objectTypes` (for mentions/links/object channels) and a `settings` Zod schema that becomes the workspace settings form.

## 3. Schema and migrations

```ts title="src/server/schema.ts"
import { moduleSchema } from '@kernhq/kernel'
import { index, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const schema = moduleSchema('template')          // pgSchema('mod_template')
export const widgets = schema.table(
  'widgets',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    workspaceId: uuid('workspace_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('widgets_ws_idx').on(t.workspaceId, t.createdAt)],
)
```

Rules:

- Every table lives in **`mod_<id>`** — the kernel creates the schema and applies `migrations/` into it (bookkeeping table `__migrations` inside the same schema).
- Every tenant table has `workspace_id` and a composite index starting with it.
- Add **row-level security** to generated migrations with the helper:

```ts
import { rlsPolicySql } from '@kernhq/kernel'
// emits: enable/force RLS + policy using current_setting('app.workspace_id')
rlsPolicySql('mod_template', 'widgets')
```

Queries run inside `kernel.database.withWorkspace(workspaceId, tx => …)`, which sets `app.workspace_id` (and `app.user_id`) for the transaction.

Generate migrations with `pnpm db:generate` (`drizzle.config.ts` filters to `mod_template`).

## 4. Router implementation

```ts title="src/server/_impl.ts"
import { type Kernel, defineModule, defineServerModule, workspaceScoped, requires, uuidv7 } from '@kernhq/kernel'
import { implement } from '@orpc/server'
import { desc, eq } from 'drizzle-orm'
import { MODULE_ID, templateContract, templateEvents } from '../contract.js'
import { widgets } from './schema.js'

const os = implement(templateContract).$context<import('@kernhq/kernel').RequestContext>()

export function implement_(kernel: Kernel) {
  const scoped = os.use(workspaceScoped(MODULE_ID))      // membership + "module enabled" check
  return os.router({
    widgets: {
      list: scoped.widgets.list.use(requires('template.widget.view')).handler(async ({ input }) =>
        kernel.database.withWorkspace(input.workspaceId, async (tx) => {
          const rows = await tx.select().from(widgets).where(eq(widgets.workspaceId, input.workspaceId)).orderBy(desc(widgets.createdAt)).limit(input.limit)
          return { items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), nextCursor: null }
        }),
      ),
      create: scoped.widgets.create.use(requires('template.widget.manage')).handler(async ({ input, context }) => {
        const row = await kernel.database.withWorkspace(input.workspaceId, async (tx) => {
          const [r] = await tx.insert(widgets).values({ id: uuidv7(), workspaceId: input.workspaceId, name: input.name }).returning()
          return r!
        })
        await kernel.emit(templateEvents.widgetCreated, { widgetId: row.id, workspaceId: input.workspaceId }, { workspaceId: input.workspaceId, actorId: context.principal.userId })
        await kernel.realtime.change(input.workspaceId, { module: MODULE_ID, entity: 'widget', id: row.id, op: 'created' })
        return { ...row, createdAt: row.createdAt.toISOString() }
      }),
    },
  })
}
```

Middleware from `@kernhq/kernel`: `authed` (any authenticated principal), `workspaceScoped(moduleId)` (active membership + module enabled → sets `context.workspaceId`), `requires(permission)` (workspace-scope permission). For object/project scope call `kernel.authz.require(principal, key, { kind: 'project', id, workspaceId, parents })` directly.

After a mutation: **emit an event** (activity, automation, webhooks, other modules) and **publish a realtime change** (clients invalidate their caches).

## 5. Client module

```ts title="src/client/index.ts"
import { defineClientModule } from '@kernhq/kernel/client'
export const templateClient = defineClientModule({
  id: 'template',
  name: 'Template',
  icon: 'puzzle',
  nav: [{ id: 'template', label: 'Widgets', icon: 'puzzle', href: '/template', permission: 'template.widget.view' }],
})
export default templateClient
```

A client module can contribute `routes` (under `/(app)/[workspace]/<module>`), `nav`, `commands` (⌘K actions), `presenters` (how an object renders inline / as a card), `slots` (sidebar widgets, right-panel tabs, settings pages, notification renderers, chat message actions…), `shortcuts`, `notifications`, `settingsPages` and `messages` (i18n bundles). Components are Svelte 5 and loaded lazily.

## 6. Hosting the module

Add the package to the host service's static registry (e.g. `core`'s `kern.modules.ts`) and to the app's module list. The kernel applies migrations, mounts `/api/template` (+ `/api/template/openapi.json`), registers procedures, jobs and subscriptions at start-up. Per-workspace enablement is handled by core — nothing to do in the module.

## Testing

Unit-test contract logic with Vitest. For integration, boot `createKernel({ service: 'test', modules: [templateModule] })` against the dev Postgres; stub core procedures by registering them locally: `kernel.broker.register('core', { 'users.principal': { handler: async () => testPrincipal() } })`. `@kernhq/kernel/testing` exports `InMemoryEventBus` and `testPrincipal()`.

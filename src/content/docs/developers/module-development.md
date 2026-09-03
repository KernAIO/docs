---
title: Module development
description: Build a Kern module of your own from the published template, run it inside a local Kern, then build a shell and core image pair that carries it and run that on a self-hosted instance.
---

Every feature in Kern is a module, and the first-party modules use exactly the shape you will. When
you finish this page you have a module of your own — contract, server, screens and strings in one
package — running inside a Kern on your machine, and a pair of container images that carry it to a
server.

:::note[Your module is yours]
The template and everything a module imports — `@kernhq/kernel`, `@kernhq/contracts`,
`@kernhq/sdk`, `@kernhq/ui`, `@kernhq/workflow` — are Apache-2.0. Licence your module however you
like, keep it private, keep it closed, sell it. See [Licensing](/developers/licensing/).
:::

## You need

- Node **24** and pnpm **10** (`corepack enable`).
- Docker with the Compose plugin.
- A Postgres 18 the module's tests can create databases in. The
  [dev workspace](/developers/dev-workspace/) starts one with `pnpm infra`.
- For step 3, the dev workspace itself: `git clone https://github.com/KernAIO/app && cd app && pnpm setup`.

## 1. Start from the template

1. Copy the template into a directory of your own:

   ```bash
   npx degit KernAIO/module-template module-crm
   cd module-crm
   ```

   **Result:** a package with `src/contract.ts`, `src/server/`, `src/client/`, `migrations/` and a
   `STRUCTURE.md` that says what every directory is for. It is a complete, working module — a `Note`
   entity with list, create, archive and delete, its own schema, row-level security, permissions,
   capabilities, events, screens and strings.

2. Give it its identity. The id must agree in **four places**, and each has been got wrong before:

   | Where | Change |
   |---|---|
   | `package.json` | `name` — `@acme/module-crm` or any name; **delete `"private": true`** or nothing will ever publish |
   | `src/contract.ts` | `MODULE_ID`, and the prefix of every permission key and event name |
   | `src/server/schema.ts` | `moduleSchema('crm')` — the Postgres schema becomes `mod_crm` |
   | `drizzle.config.ts` | `schemaFilter` |

3. Install and prove the starting point is green:

   ```bash
   pnpm install
   DATABASE_URL=postgres://kern:kern@localhost:5432/kern pnpm typecheck && pnpm lint && pnpm test && pnpm build
   ```

   **Result:** every command exits 0. `src/module.test.ts` walks the contract and the router and
   fails when a procedure exists in one and not the other, or reaches the database without the
   workspace gate — keep it.

## 2. Make it yours

Rename the `Note` entity and grow from there. The template's README and `STRUCTURE.md` are the
reference; the rules that matter most:

- **Version comes from the package**, never a literal: `packageVersion(import.meta.url)`.
- **Write the RLS migration by hand.** `pnpm db:generate` emits tables and indexes, never a policy.
  Copy `migrations/0001_rls.sql` and change the table names; every tenant table carries
  `workspace_id` and a policy, and the kernel refuses to start in production under a role that
  bypasses them.
- **Every migration survives being applied twice.** `drop policy if exists` before every
  `create policy`, `drop constraint if exists` before every `add constraint`. The kernel migrates
  every hosted module at boot, so a migration that throws stops the whole service, not your module.
- **A screen reaches the shell only through `@kernhq/ui`** — `session`, `navigation`, `getHost`,
  `t`, the formatters, the components. `$app/*`, `$lib/*` and `$msg` are the application's and do
  not exist in a package built on its own. `pnpm typecheck` here is the only thing that sees that.
- **Strings ship in `src/client/i18n.ts`.** The platform's locales are `en`, `de`, `fa`, `ar` and
  `tr`; the starter is English only.

What the two halves may declare:

- The **server** — tables, migrations, a router, `procedures` other modules call through
  `kernel.call()`, `jobs`, `subscriptions`, search indexers, object resolvers, `httpRoutes` for a
  webhook that needs the raw body, and lifecycle hooks.
- The **client** — `nav`, `routes`, `commands`, `settingsPages`, `widgets` for the dashboard,
  `sidebar` for the column beside the rail, `presenters` for rendering your objects inside somebody
  else's screen, and `messages`.

Both entry points export the module as their **default export**. That is what the next two steps
rely on.

## 3. Run it inside a local Kern

The umbrella workspace links any package under `repos/`, and the two host images take a list of
extra modules — the same mechanism the images use in step 4, so nothing is forked.

1. Put your module where the workspace sees it, and link it:

   ```bash
   mv ../module-crm repos/module-crm          # inside the app checkout
   ```

   Add `"@acme/module-crm": "workspace:*"` to `dependencies` in **both** `repos/core/package.json`
   and `repos/shell/package.json`, then:

   ```bash
   scripts/pnpm-install-locked.sh
   ```

   **Result:** `readlink repos/shell/node_modules/@acme/module-crm` prints a path under `repos/`.

   `core` reads your package's `./server` and `./contract` from its **`dist/`**, so run
   `pnpm build` in the module after every server change; the shell reads `./client` as source and
   sees an edit immediately.

2. Generate the wiring in both hosts:

   ```bash
   (cd repos/core  && KERN_EXTRA_MODULES=@acme/module-crm node scripts/extra-modules.mjs)
   (cd repos/shell && KERN_EXTRA_MODULES=@acme/module-crm node scripts/extra-modules.mjs)
   ```

   **Result:** each prints `extra-modules: @acme/module-crm`. `repos/core/src/extra-modules.ts`
   and `repos/shell/src/lib/modules/extra.ts` now import your package. Do not commit those two
   files; running the script with the variable empty writes them back.

3. Start everything:

   ```bash
   pnpm infra && pnpm dev
   ```

   **Result:** `curl -s localhost:4000/api/health` lists `crm` among the modules, and
   `/api/crm/openapi.json` describes your router.

4. Open http://localhost:5173, sign in, and switch the module on in **Settings → Modules**.

   **Result:** your navigation entry appears in the rail, your settings pages under Settings, your
   widgets in the dashboard's *add widget* list, and your strings in whichever language the
   workspace uses.

A module that has never served a request is not finished, whatever the type-checker says.

## 4. Build the images that carry it

A self-hosted instance runs the two images Kern publishes — `ghcr.io/kernaio/shell` and
`ghcr.io/kernaio/core` — and a module has to be *inside* them: modules are composed at build time
(see [ADR 0002](https://github.com/KernAIO/app/blob/main/docs/adr/0002-platform-versioning-and-updates.md)).
Both Dockerfiles take `KERN_EXTRA_MODULES`, a space-separated list of npm package specs, install
them, and generate the same two files as step 3.

1. Publish the module to a registry the build can reach — `pnpm publish` to npm, or a registry your
   build context's `.npmrc` points at.

2. Build **both** images from the same Kern release tag, with the same list. A shell that knows a
   module its core does not have calls procedures nobody serves:

   ```bash
   KERN=v0.2.1
   MODS="@acme/module-crm@1.2.0"
   docker build --build-arg KERN_VERSION=${KERN#v} --build-arg KERN_EXTRA_MODULES="$MODS" \
     -t registry.example.com/acme/kern-core:${KERN#v}  https://github.com/KernAIO/core.git#$KERN
   docker build --build-arg KERN_VERSION=${KERN#v} --build-arg KERN_EXTRA_MODULES="$MODS" \
     -t registry.example.com/acme/kern-shell:${KERN#v} https://github.com/KernAIO/shell.git#$KERN
   ```

   **Result:** the build log shows `extra-modules: @acme/module-crm` in each. A package the build
   cannot find fails the build there, by name, rather than producing an image without it.

3. Push both images to your registry.

## 5. Run them on a self-hosted instance

1. In the instance's `.env`, point the two image variables at your registry and pin the version the
   pair was built from:

   ```dotenv
   KERN_IMAGE_CORE=registry.example.com/acme/kern-core
   KERN_IMAGE_SHELL=registry.example.com/acme/kern-shell
   KERN_VERSION=0.2.1
   ```

2. Pull and restart:

   ```bash
   docker compose pull && docker compose up -d
   ```

   **Result:** `curl -s https://kern.example.com/api/health` lists your module, and it appears in
   **Admin → Modules** with the version your package declares.

Two things follow from carrying your own images:

- **Every Kern release needs a rebuild of the pair** before `KERN_VERSION` moves. The updater will
  not do it for you — leave *Admin → Updates* on *notify* rather than *auto*, rebuild when a release
  arrives, then upgrade.
- **`KERN_VERSION` is still the version of Kern**, baked into the image at build time. Your module's
  own version is what `/api/health` and Admin → Modules show beside its id.

## Testing

Unit-test contract logic with Vitest. For integration, boot the kernel against a scratch database —
`createKernel({ service: 'test', modules: [crmModule] })` — and stub the core procedures your module
calls by registering them locally:
`kernel.broker.register('core', { 'users.principal': { handler: async () => testPrincipal() } })`.
`@kernhq/testing` carries `permissionMatrixDiff`, which the first-party modules use to pin which
built-in role holds each permission, and the tracker's `src/server/isolation.test.ts` is the shape
of a cross-tenant test worth copying.

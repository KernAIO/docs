---
title: Conventions
description: Commit messages, code style, testing and release conventions across Kern repositories.
---

## Commits and pull requests

- **Conventional Commits**: `feat(tracker): add cycle carry-over`, `fix(chat): unread counter drift`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`. Scope = module or area. Breaking changes use `!` and a `BREAKING CHANGE:` footer.
- Small, focused PRs; CI must be green (`lint`, `typecheck`, `test`, `build`).
- Contract changes first: change `@kernhq/contracts` (or a module's `/contract`), publish, then update consumers.

## Code style

- **TypeScript strict**, ESM with `NodeNext` resolution, explicit `.js` extensions in relative imports, `import type` for types.
- **Biome** for linting and formatting (2-space indent, single quotes, no semicolons, trailing commas, 110 columns). Run `pnpm lint` / `pnpm format`.
- Zod for all external input; oRPC contracts for every HTTP procedure.
- Per-module Postgres schemas, `workspace_id` on tenant tables, RLS in migrations, composite indexes starting with `workspace_id`.
- Events `<module>.<entity>.<action>`; permissions `<module>.<resource>.<action>`; jobs `<module>.<job>`.

## Testing

- **Vitest** everywhere; unit tests next to the code (`*.test.ts`).
- Integration tests boot a kernel against the dev Postgres (Testcontainers in `core`), stub core procedures through the broker, and assert on events/rows. RLS leak tests and authz matrix tests are required for new tenant tables and permissions.
- Every first-party module carries `src/server/migrations.test.ts`, which applies its migration folder to a database created from nothing, applies it a **second** time, and asserts each policy exists once. Copy it into a module of your own: the kernel migrates every hosted module at boot, so a migration that throws on replay stops the whole service, not just your feature.
- **Playwright** for the app, run in CI. `tests/e2e/ux.spec.ts` is the one that looks at the rendered interface: it sweeps every route in four renderings — light and dark, LTR and RTL — against the rules in `ux-audit.ts`. Adding a route means adding it there.

## Releases

- `kernel` and each `module-*` repository publish `@kernhq/*` with **Changesets**. Add a changeset to any PR that changes a published package; a breaking change must have one written by hand, because no commit subject can say that an exported type changed shape.
- Services build Docker images on `main` and on `v*` tags. The nightly workflow in `app` advances every service to the newest compatible set, tags one version across `core`, `shell`, `chat`, `mail` and `collab`, and publishes the release — nothing is tagged or version-bumped by hand. See [Releases and migrations](/developers/releases-and-migrations/).

## Licensing

The framework — the `kernel` repository and `module-template` — is Apache-2.0; the product is AGPL-3.0-only. The file you are editing tells you which applies — see [Licensing](/developers/licensing/). Dependencies must be MIT/Apache/BSD/ISC. Contributions require the [CLA](/contributing/cla/).

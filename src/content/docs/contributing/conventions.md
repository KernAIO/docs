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
- **Playwright** for the app; Lighthouse PWA score ≥ 90; RTL screenshot tests.

## Releases

- `kernel` and `modules` publish `@kernhq/*` with **Changesets** (prereleases on every merge to `main`). Add a changeset to any PR that changes a published package.
- Services build Docker images on `main` and on `v*` tags; the `kern` repo pins a tested set per release.
- Renovate keeps dependencies current; review its PRs like any other.

## Licensing

All code is AGPL-3.0-only; dependencies must be MIT/Apache/BSD-compatible. Contributions require the [CLA](/contributing/cla/).

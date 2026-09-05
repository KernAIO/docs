# CLAUDE.md — Kern project rules

Rules for anyone (human or AI agent) working on Kern repositories. These apply to every repo in the KernAIO org.

## We build in the open
The repositories are **public**, so every commit is visible the moment it is pushed:
- Never commit secrets, tokens, personal data, or machine-specific paths. Use `.env` (gitignored) + `.env.example`.
- Write READMEs, docs, and issue/PR text for external contributors, not for ourselves.
- Keep commit history clean and meaningful — it is part of what people judge the project by.
- Every repo carries LICENSE, CLA.md, CODE_OF_CONDUCT.md, SECURITY.md, CONTRIBUTING.md.
- **Two licences, split at the framework boundary.** The `kernel` repo (which now holds `workflow`)
  and `KernAIO/module-template` are **Apache-2.0** so anyone can write a closed module; the product —
  `shell`, `core`, `chat`, `mail`, `collab`, `docs`, this umbrella, the first-party modules — is
  **AGPL-3.0-only**. A new package inherits its repo's licence unless it is something a third-party
  module must import, and then it is Apache-2.0 with its own LICENSE file. Apache-2.0 packages take
  only permissive dependencies. If a module author has to import an AGPL package to get something
  done, move the API — never the licence. See `LICENSING.md` and
  `docs/adr/0005-licensing-and-the-module-boundary.md`.

## Git
- Author identity: `Navid Mirzaaghazadeh <mirzaaghazadeh@icloud.com>` (already set in each repo's local git config — plain `git commit` is correct; do not override with `-c`).
- **Do not add `Claude-Session:`, `Co-Authored-By: Claude`, "Generated with", or any AI trailer/branding to commit messages, PRs, or code comments.**
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, with optional scope). Imperative mood, ≤ 72-char subject.
- Push to `origin main`. Never force-push. If `git pull --rebase` complains about unstaged files that aren't yours (parallel agents share worktrees), use `git -c rebase.autoStash=true pull --rebase`.
- **Never `git add -A` or `git add .`. Stage the paths you changed, by name.** Several agents share
  these checkouts, and another one is very often part-way through a new package in the same repo.
  `git add -A` sweeps their half-finished files into your commit and pushes them — under your commit
  message, without their lockfile entry, so CI fails at install for everyone. It happened on
  2026-08-24: a contact-address fix carried two unfinished modules into `main`. Run
  `git status --porcelain` first and stage from it; if you cannot name every path you are about to
  commit, you are not ready to commit. When it does happen, do not revert the other agent's files —
  they are still working on them; tell them instead, and repair what you broke.

## Layout & workflow
- Umbrella dev workspace: `app/` with sibling repos cloned under `app/repos/<name>` (gitignored there). pnpm links all `@kernhq/*` packages via the umbrella workspace.
- Install dependencies ONLY via `app/scripts/pnpm-install-locked.sh` (serialises pnpm at the umbrella root).
- Node 24 (`nvm use 24`), pnpm 10, TypeScript ~5.9, ESM/NodeNext, Biome for lint+format (run `pnpm exec biome check --write <paths>` before committing), Vitest.
- Contracts first: changes to `@kernhq/contracts` / module contracts land (and build) before their consumers.
- Modules own their data: Postgres schema `mod_<id>`, `workspace_id` + RLS on every tenant table, cross-module access only via `kernel.call()` and events. See `modules` repo `packages/_template`.
- Ports: shell 5173 · core 4000 · chat 4100 · mail 4200 · collab 4300 · docs 4400.
- Dev DB on this machine: Homebrew Postgres 18 at `localhost:5432` (`kern`/`kern`); the compose Postgres listens on `${KERN_PG_PORT:-5432}` (5433 here).

## CI
Every service repository's CI runs the real suites, so the workflow starts the infrastructure they
need as service containers: Postgres (`pgvector/pgvector:pg18`) everywhere, Valkey for `chat`,
Mailpit for `mail`. Things learned the hard way:
- Address a service container as **127.0.0.1**, never `localhost` — a runner resolves `localhost` to
  `::1` first, where the published port is not listening, and `fetch` does not retry over IPv4.
- Do not set `registry-url` on `actions/setup-node` in an install job. It writes an `.npmrc` with a
  placeholder token, and npm answers a bad token with **404**, so public packages appear to vanish.
- A repository is built **standalone** in CI. `workspace:*` only resolves inside the umbrella
  workspace; depend on the published version instead.
- **Each repository's own `pnpm-lock.yaml` is what CI installs from, and you cannot refresh it from
  inside the umbrella.** Add a dependency to a package and the umbrella install updates the *umbrella*
  lockfile, leaving the repo's committed one stale — CI then fails every job at
  `ERR_PNPM_OUTDATED_LOCKFILE`, install-time, before a single test runs. Plain `pnpm install` in
  `repos/<name>` walks up and attaches to the umbrella; `--ignore-workspace` skips `packages/*` and
  cheerfully reports nothing to do. Clone the repo somewhere outside the workspace and run
  `pnpm install --lockfile-only` there, then copy the lockfile back.
- Skipping a test because its infrastructure is missing is fine on a laptop and dishonest in CI.
  Fail when `process.env.CI` is set.

## Writing
Documentation — READMEs, guides, runbooks, `docs/`, ADRs, and any procedure someone follows — uses
the `kern-writing` skill in `.claude/skills/`: decide where it belongs first, goal before steps, one
action per step, conditions before commands, an observable result after every important action, and
never the present tense for something that is not built. It governs documents for readers. Code
comments and commit messages keep the voice they have; user-facing strings belong to `kern-language`.

## Quality bar
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` must pass before pushing.
- UI follows `shell/DESIGN.md` (Ink/paper design system) and must work in RTL (fa/ar) and dark mode.
- All user-facing strings go through i18n (Paraglide) — no hardcoded English in components.

## Keeping this file current
This file is how the next person — or the next agent — avoids repeating what we already worked out.
When you learn something durable, add it here **in the same commit as the change that taught you**:
- a trap that cost you time (a silent failure, a misleading error, a tool that lies about success)
- a convention you had to infer from reading several files
- a decision and the reason behind it, especially where the obvious choice is wrong
Keep it specific and short. Delete anything that stops being true — a stale note is worse than none.

---

# This repository: docs (documentation site)

Astro Starlight, themed with the Kern paper palette. Runs on **:4400**.

**Things worth knowing**
- Content lives in `src/content/docs/`. The sidebar is configured in `astro.config.mjs`; a new page
  needs an entry there.
- **Starlight checks a sidebar `slug` and nothing checks a Markdown link**, so `pnpm build` used to
  pass over a link that 404s for every reader. `scripts/check-links.mjs` runs as the second half of
  `build`: it walks the emitted HTML and fails when an internal href — or a `#fragment` — resolves
  to nothing. It reads `DOCS_BASE` the way `astro.config.mjs` does, so it is the *built* layout it
  checks, not the source. Run it alone with `pnpm check:links` against an existing `dist/`.
- **Renaming a content file changes a live URL on docs.kernaio.com, and nothing redirects.** No
  `redirects` are configured. Retitle a page and relabel it in the sidebar; leave the filename
  alone. `modules/docs-drive.md` is titled "Drive & Calendar" for exactly this reason.
- **Serving: docs.kernaio.com, fronted by Navid's own Cloudflare — not GitHub Pages.** The old
  `pages.yml` (GitHub Actions → actions/deploy-pages) was removed on 2026-09-01: GitHub Pages was
  never enabled on this repository (Pages API 404) and the live domain is served outside it.
  Deployment of new builds happens outside this repository's workflows.
- Write for someone who has never seen Kern. Anything that assumes context from the other repositories
  belongs in the Developers section, with a link to the source.
- **Nothing here is checked against the product, so every page rots silently.** `pnpm build` proves
  the links resolve and says nothing about whether a sentence is true, and a page describing a
  feature that was never built reads exactly like one describing a feature that was. On 2026-09-05 a
  sweep against the code found ten pages describing a different product: five planned modules listed
  as shipping, a `/s3` storage route that returns 403 on every upload, an admin console with nine
  areas where two exist, `docs.page.*` permission keys for a module now called `quire`, a turbo task
  graph the umbrella cannot have, `--profile search` and `--profile observability` for services no
  Compose file contains, and a link to an ADR 0011 that does not exist. Re-derive a claim from the
  code before you edit the sentence around it: `grep` the contract for the procedure, the Caddyfile
  for the route, `docker-compose.yml` for the profile, the module's `capabilities` for the switch.
  Two claims in particular pull the whole page out of date when a feature lands — what a module
  imports and exports, and what an admin can reach from a screen.
- **A page in this site can only be as current as the page it contradicts.** `feature-overview.md`
  and `workspaces.md` both described Quire's importers, and both were wrong in the same way while
  `modules/quire.md` was right — because whoever fixed the module page did not grep for the other
  two. When you correct a fact, grep the whole `src/content/docs` tree for it.
- **"Not built" rots exactly like a feature description, and an under-claim is as wrong as an
  over-claim.** Five pages said outgoing webhooks were not built and that "nothing in Kern calls out
  to a URL you register", while `module-tracker`'s workflow **Call webhook** post-function had been
  sending one since 2026-08-22 — and had been hardened against SSRF hours earlier *because* it is
  real and reachable. The source of the error was another page in this site: `modules/tracker.md`
  said post-functions were "declared in the model and not executed yet", and the round copied that
  outwards instead of reading `transitions.ts`, which applies every one of them, and the shipped
  workflow templates, which all use `resolution.set`. A negative claim needs the same re-derivation
  as a positive one, and a denial is the shape nobody re-checks, because it reads as caution.
- **Four distinctions decide whether a capability sentence is true, and dropping one makes it
  false.** Outgoing or incoming; which module; whether a customer can actually reach it; and whether
  a workspace admin can configure it, or only an operator, or nobody. Tracker's webhook needs all
  four: outgoing, Tracker, reachable, and admin-configurable *through the API only* — **Settings →
  Workflows** renders a transition's rules as sentences and edits none of them. A feature with an
  endpoint and no way to switch it on is the same defect pointed the other way: chat's incoming
  webhook had a route and no procedure to create a token, so it answered 404 to everyone for as long
  as it existed. Ask "who turns this on, and from where" before writing that something exists.
- `src/styles/kern.css` maps Starlight's variables onto the Ink/Paper tokens from `shell/DESIGN.md`,
  in the proportions the marketing site uses. Change a colour there, not here.
- The fonts are served from `public/fonts` and declared in `src/styles/fonts.css`, copied from the
  website repository (which generates it with `scripts/fetch-fonts.mjs`). A Google Fonts `<link>`
  blocks the first paint and hands every reader's IP to Google — do not put one back.
- The mark in `src/assets/` carries the "K" as an **outline**, not `<text>`. Starlight renders the
  logo as `<img>`, and an SVG loaded as an image cannot reach a web font, so lettering falls back to
  whatever the reader has. There is a light pair and a dark pair; the square and the letter swap.

**Two traps, both of which look like a broken theme**
- Expressive Code parses colour-valued `styleOverrides` at build time and **silently drops anything
  it cannot read, `var(--x)` included** — the result is code blocks with no background and no syntax
  colour. Keep colours in `kern.css` and leave only metrics (radius, font, padding) in the config.
- `astro dev` is daemonised: `pkill` does not stop it, `pnpm exec astro dev stop` does. A build run
  while it is up can leave `dist/` referencing an `ec.*.css` that was never emitted, which strips
  every code block of its theme. If code blocks look unstyled, `rm -rf dist .astro` and build again.

<p align="center">
<img src="https://raw.githubusercontent.com/KernAIO/kern/main/assets/kern-mark.svg" width="56" alt="">
</p>

# docs

**Kern's documentation site: how to install it, run it, and build modules for it.**

[![CI](https://img.shields.io/github/actions/workflow/status/KernAIO/docs/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/KernAIO/docs/actions/workflows/ci.yml)
[![Licence](https://img.shields.io/badge/licence-AGPL--3.0-blue?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/status-pre--1.0-orange?style=flat-square)](https://github.com/KernAIO/kern#what-works-today)
[![Last commit](https://img.shields.io/github/last-commit/KernAIO/docs?style=flat-square)](https://github.com/KernAIO/docs/commits/main)
[![Website](https://img.shields.io/badge/docs.kernaio.com-1f2328?style=flat-square)](https://docs.kernaio.com)

The site people read is built from the Markdown in this repository. If something about
[Kern](https://github.com/KernAIO/kern) was hard to work out, it belongs here.

## Work on the documentation

Goal: see your change in the documentation site on your own machine.

You need:

- Node 24 and pnpm 10.

### 1. Install and start

```bash
pnpm install
pnpm dev
```

**Expected result:** the site is at http://localhost:4400 and reloads as you type.

### 2. Write a page

1. Add a Markdown file under `src/content/docs/`.
2. Add it to the sidebar in `astro.config.mjs`.

**Expected result:** your page appears in the sidebar and opens.

### 3. Check the build before you push

```bash
pnpm build
```

**Expected result:** a static site in `dist/`, with no broken links reported.

## How it is published

The site's address is **[docs.kernaio.com](https://docs.kernaio.com)**. It is **not live yet**: the
DNS record and GitHub Pages both still have to be switched on. Until then, build it locally.

| Where | How |
|---|---|
| GitHub Pages | `.github/workflows/pages.yml`, started by hand from the Actions tab |
| Docker | `docker build -t kern-docs .` serves the built site on port 80 |

To publish it the first time:

1. Point a `CNAME` record for `docs.kernaio.com` at `kernaio.github.io`.
2. In Settings → Pages, set the source to **GitHub Actions** and the custom domain to
   `docs.kernaio.com`.
3. Run the **GitHub Pages** workflow from the Actions tab.

**Expected result:** `https://docs.kernaio.com` serves this site. `public/CNAME` keeps the custom
domain across later deploys, and the site is built at the root — there is no `/docs` path prefix.

## How to write here

Documentation follows the house style in [CLAUDE.md](CLAUDE.md). Say the goal first. Put one action
in each step. Keep sentences short. Put the condition before the command. After every important
action, say what the reader should see.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Licence: [AGPL-3.0](LICENSE).

---

**Kern** — one place for your team's work: issues, conversations, documents and people.
Open source, self-hosted. [kernaio.com](https://kernaio.com) · [github.com/KernAIO](https://github.com/KernAIO)

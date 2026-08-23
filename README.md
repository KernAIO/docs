# docs

**Kern's documentation site: how to install it, run it, and build modules for it.**

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

The site is **not published yet**. GitHub Pages has to be switched on for this repository first.

| Where | How |
|---|---|
| GitHub Pages | `.github/workflows/pages.yml`, started by hand from the Actions tab |
| Docker | `docker build -t kern-docs .` serves the built site on port 80 |

## How to write here

Documentation follows the house style in [CLAUDE.md](CLAUDE.md). Say the goal first. Put one action
in each step. Keep sentences short. Put the condition before the command. After every important
action, say what the reader should see.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Licence: [AGPL-3.0](LICENSE).

Website: [kernaio.com](https://kernaio.com).

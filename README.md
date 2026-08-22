# Kern Docs

Documentation site for [Kern](https://github.com/KernAIO/kern) — built with [Astro Starlight](https://starlight.astro.build).

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:4400
pnpm build      # static site → dist/
pnpm preview
```

Content lives in `src/content/docs/` (Markdown/MDX); the sidebar is configured in `astro.config.mjs`; the Kern "paper" theme in `src/styles/kern.css`.

## Deploy

- **GitHub Pages**: `.github/workflows/pages.yml` builds with `DOCS_BASE=/docs` and deploys on every push to `main`.
- **Docker**: `docker build -t kern-docs .` → nginx serving the static build on port 80 (`--build-arg DOCS_BASE=/` to change the base path).

## License

AGPL-3.0 — see `LICENSE`. Contributions are accepted under `CLA.md`.

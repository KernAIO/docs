/**
 * Every internal link in the built site resolves to something that was actually emitted.
 *
 * Starlight validates a sidebar `slug` at build time and stops on a typo there. It does not look at
 * links inside Markdown, and nothing else does either — so a page could link to `/modules/quire/`
 * for months while the file was called something else, and the only symptom was a reader's 404.
 * This runs after `astro build` and fails it, which is the only place the answer exists: the check
 * is about the emitted directory layout, not about the source.
 *
 * It reads `DOCS_BASE` the same way `astro.config.mjs` does, because a base prefixes every href and
 * a checker that ignored it would report the whole site as broken.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const base = process.env.DOCS_BASE ?? '/'

/** Every emitted HTML file, as a site path (`/modules/quire/`) alongside its file path. */
function pages(dir = dist, prefix = '/') {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...pages(full, `${prefix}${entry.name}/`))
    else if (entry.name === 'index.html') out.push({ path: prefix, file: full })
  }
  return out
}

const emitted = pages()
if (emitted.length === 0) {
  console.error('check-links: dist/ holds no pages — run `pnpm build` first')
  process.exit(1)
}

const byPath = new Map(emitted.map((p) => [p.path, p.file]))
/** The `id` attributes on a page, so a `#fragment` can be checked rather than assumed. */
const anchors = new Map()
for (const { path, file } of emitted) {
  const html = readFileSync(file, 'utf8')
  anchors.set(path, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])))
}

/** A link may also point at a file in `public/` — an image, a font, the sitemap. */
function assetExists(sitePath) {
  try {
    return statSync(join(dist, sitePath.replace(/^\//, ''))).isFile()
  } catch {
    return false
  }
}

const failures = []
for (const { path, file } of emitted) {
  const html = readFileSync(file, 'utf8')
  for (const [, href] of html.matchAll(/\shref="([^"]+)"/g)) {
    if (!href.startsWith('/')) continue
    if (href.startsWith('//')) continue
    const [target, fragment] = href.split('#')
    // Strip the base the same way the browser resolves it, so the lookup is against dist's layout.
    const stripped = base !== '/' && target.startsWith(base) ? `/${target.slice(base.length)}` : target
    const normalised = stripped.endsWith('/') ? stripped : `${stripped}/`

    if (!target || target === base) continue
    if (byPath.has(normalised)) {
      if (fragment && !anchors.get(normalised)?.has(decodeURIComponent(fragment))) {
        failures.push(`${path} → ${href} (page exists, no element with id "${fragment}")`)
      }
      continue
    }
    if (assetExists(stripped)) continue
    failures.push(`${path} → ${href}`)
  }
}

if (failures.length > 0) {
  console.error(`check-links: ${failures.length} internal link(s) resolve to nothing:`)
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}
console.log(`check-links: ${emitted.length} pages, every internal link resolves`)

---
title: Releases and migrations
description: How a Kern release is put together, and the rule every migration has to follow.
---

Kern releases as one platform. Every service image and every module inside it carries the same
version, and an upgrade replaces all of them together.

This page is for people writing migrations and cutting releases. Admins want
[Upgrading](/self-hosting/upgrading/) instead.

## Why one version

The parts cannot move separately, for three reasons:

- The module clients are compiled into the app bundle. A module's interface cannot be replaced
  without rebuilding the app.
- `kernel.call()` and the event contracts are checked at compile time against `@kernhq/contracts`. A
  module a version ahead of its host is not degraded — it does not type-check.
- Everything shares one Postgres. Two modules at two versions means two migration histories against
  one database.

npm versions still matter, but as a packaging unit for developers. `KERN_VERSION` is the only
version an instance has.

## The expand/contract rule

**A migration has to leave the database readable by the image before it.**

This is the rule that makes rollback real. Roll an image back, and it runs against a schema that
moved forwards — that only works when the change was additive.

Within a release:

- **Add** nullable columns, new tables, new indexes.
- **Backfill** in a job or a later release, never in the migration that adds the column.
- **Do not** drop a column, rename one, add a `NOT NULL` without a default, or narrow a type.

Destructive changes land one release later, after every supported instance has taken the release
that stopped using the thing:

| Release | What it does |
|---|---|
| 1.2.0 | Adds `new_column`. Code writes both, reads either. |
| 1.3.0 | Code reads and writes `new_column` only. `old_column` is still there. |
| 1.4.0 | Drops `old_column`. |

On our cloud the rule is not a nicety but the correctness condition: a rolling deploy runs the old
and new images against one schema at the same time, on purpose.

When a release genuinely cannot follow the rule, it is marked `schemaChanges: breaking` in the
release feed, and rolling it back needs the database restored with it.

## What the kernel does at boot

1. Checks every module's `minKernel` against the running version, and refuses to start when one is
   not satisfied — before touching the database.
2. Takes a Postgres advisory lock per module, then applies that module's migrations into `mod_<id>`.

The lock matters because several processes migrate at once as a matter of course: Compose starts
`core` and `core-worker` together, and a cloud rollout starts several replicas. Without it they
interleave and one fails on a relation another has just created. `create ... if not exists` races
the same way, which is why schema creation happens inside the lock too.

## Migrating outside a boot

A rolled deployment migrates once, on its own, before any new image serves traffic:

```bash
node dist/migrate.js            # apply everything pending
node dist/migrate.js --check    # report what is pending, apply nothing
node dist/migrate.js --maintenance on|off
```

`--check` is what makes an upgrade refusable: it answers before anything has been touched.
`kern-upgrade.sh` runs it in its preflight.

## Maintenance mode

While an upgrade applies migrations, the API answers `503` with `Retry-After`, and `/api/health` and
`/api/ready` keep answering — they are how the upgrade knows when a service is back.

The flag lives in a kernel-owned schema, not in core's, because the services that read it are
running while core is down migrating. It expires after 30 minutes, so an upgrade that dies between
"on" and "off" costs a window rather than an instance nobody can get into.

## How a release is cut

Nobody tags by hand. `release.yml` in the `app` repository runs every night at 02:00 UTC and:

1. Advances every service to the newest `@kernhq` packages that are compatible with each other,
   and commits that with a lockfile. Each service's own CI has to pass on that commit before it
   lands on `main`; if one fails, no service takes the change and the run ends red naming the
   module that fell behind.
2. Works the version out of the commits (`feat:` is a minor, `!` is a major, below 1.0.0 a major is
   a minor) and out of how far each module moved.
3. Waits for every service's CI to be green on `main`, tags the same version in every service
   repository, and waits for every image to exist.
4. Writes the release notes — each service's commits, and each module's changelog entries between
   the version the previous release carried and this one — and creates the GitHub release as a
   **draft**.
5. Hands the version to `release-feed.yml`, which signs the feed, attaches it, publishes the draft
   and rolls the cloud onto it.

A draft cannot be seen by an instance, so `releases/latest` never points at a version whose feed
does not exist yet.

**Result:** the release appears at [github.com/KernAIO/app/releases](https://github.com/KernAIO/app/releases)
with `releases.json` attached, and app.kernaio.com reports the version at `/api/health`.

## When the nightly is red

A red `release.yml` or `rollout.yml` opens an issue labelled `release-failure` in the `app`
repository (or comments on the one already open), which GitHub emails to everyone watching the
repository. When you finish this procedure the next nightly is green, or the reason it cannot be is
written in that issue.

1. Open the run the issue links to and read the **step conclusions**, not the run's conclusion:

   ```bash
   gh run view <run-id> --repo KernAIO/app --json jobs --jq '.jobs[].steps[] | select(.conclusion != "success") | "\(.name): \(.conclusion)"'
   ```

   **Result:** one or more steps named as `failure` or `skipped`.

2. If the failed step is **the reach** — the message names a module whose peer ranges have not
   caught up with the framework — republish that module: bump its `peerDependencies` on
   `@kernhq/contracts` and `@kernhq/kernel` to what is published, `scripts/relock.sh module-<id>`,
   commit with a changeset, push. The release still went out from `main` as it was; the next
   nightly picks the module up.

3. If the failed step is **a service's CI on the reach branch**, open that repository's
   `release/reach` branch run. The fix is in the module the reach moved (a client calling a
   procedure the server renamed, a mock manifest that still says last week's counts), never in
   moving the host down.

4. If the failed step is **the pin check** — "core and shell resolve a module differently" —
   somebody edited a range by hand. Move the one that is behind to the other's version with
   `node scripts/reach.mjs --write repos/core/package.json repos/shell/package.json`, then
   `scripts/relock.sh core shell`, commit both, push.

5. If **`rollout.yml`** failed, `app.kernaio.com/api/health` tells you what is live. A rollback
   already happened if the version is the previous one; if the API answers 503, the instance is in
   maintenance mode and the run's *Open the API if this run closed it* step says why it could not
   reopen it — do that by hand on the host with `kern-rollback.sh`, then read the migration dry run
   in the log for the cause.

6. Dispatch the release again by hand once the cause is fixed, rather than waiting for the next
   night:

   ```bash
   gh workflow run release.yml --repo KernAIO/app
   ```

   **Result:** a green run, a new release, and the issue closed with a comment naming the cause.

## The release feed

A published release produces a signed `releases.json`, attached to the GitHub release and served
from a stable URL. Each entry is generated by asking the published images what they contain, not
written by hand. Each feed extends the previous release's feed, so an instance several versions
behind can see the one it is allowed to step to.

```json
{
  "version": "1.2.0",
  "channel": "stable",
  "publishedAt": "2026-08-22T09:00:00.000Z",
  "notesUrl": "https://github.com/KernAIO/app/releases/tag/v1.2.0",
  "services": { "app": "1.2.0", "core": "1.2.0" },
  "modules": { "core": "0.3.0", "tracker": "0.2.0", "chat": "0.2.1" },
  "minPreviousVersion": "1.0.0",
  "schemaChanges": "additive",
  "requiredEnv": []
}
```

`minPreviousVersion` and `schemaChanges` are what make the preflight and the rollback honest rather
than decorative. The nightly release marks every release `additive`, which is what the expand/contract
rule guarantees. When a release cannot follow the rule, re-sign its feed by hand:

```bash
gh workflow run release-feed.yml --repo KernAIO/app \
  --field version=1.2.0 --field previous=1.1.0 --field schema=breaking --field rollout=false
```

The document served is `{ "payload": "<base64 of the exact JSON bytes>", "signature": "<base64>" }`.
The signature covers those bytes, and an instance verifies them before parsing — re-encoding JSON is
not guaranteed to reproduce the same bytes, and a signature that only usually verifies is worse than
none.

## Adding a module version requirement

```ts
defineModule({
  id: 'tracker',
  version: packageVersion(import.meta.url),
  minKernel: '>=1.2.0',
})
```

Use `packageVersion(import.meta.url)` for the version, never a string literal. A literal is not
bumped when changesets releases the package, and it is what the admin console shows.

Unreleased builds report `0.0.0-dev` and skip the `minKernel` check, so local development still
starts.

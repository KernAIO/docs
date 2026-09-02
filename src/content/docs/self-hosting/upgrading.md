---
title: Upgrading
description: How to move a self-hosted Kern instance to a newer release, and how to undo it.
---

Kern is released as one platform. Every service image and every module inside it carries the same
version, and an upgrade moves all of them together. There is no per-module upgrade.

A release is cut every night that something changed. It carries the newest version of every module
that works with that platform, and its
[release notes](https://github.com/KernAIO/app/releases) list what each service and each module
changed since the release before it. **Admin → Updates** shows the same list for the release your
instance would move to.

`kern-upgrade.sh` does the whole upgrade. It checks the instance first, takes a snapshot, applies the
migrations, and confirms every service came back on the new version. If a step fails, it stops and
prints the command that undoes it.

## Upgrade to the newest release

1. Open a terminal on the host.
2. Go to your Kern directory:

   ```bash
   cd ~/kern
   ```

3. Run the upgrade:

   ```bash
   ./kern-upgrade.sh
   ```

**Result:** the script prints `✔ Kern is on <version>`, and the path of the snapshot it took.

## Upgrade to a specific version

Give the version as an argument:

```bash
./kern-upgrade.sh 1.2.0
```

## Check without changing anything

To see whether the upgrade would work, and stop before it changes anything:

```bash
./kern-upgrade.sh --check
```

**Result:** the script prints `✔ Preflight passed. Nothing was changed.`, or the first problem it
found.

## What the script does

| Step | What it means for you |
|---|---|
| Preflight | The compose file is valid, Postgres answers, there is disk space for a snapshot, and the migrations run cleanly in a dry run. |
| Snapshot | A `pg_dump`, your `.env` and your compose files are copied to `snapshots/<from>-to-<to>-<time>/`. |
| Maintenance mode | The API answers 503 with `Retry-After` while the database changes, so the interface shows a maintenance screen instead of failed requests. |
| Migrate | Migrations are applied once, before any new container serves traffic. |
| Start and verify | `core` comes up first and must report ready. Then everything else starts, and every service must report the new version. |

The last five snapshots are kept. Set `KERN_KEEP_SNAPSHOTS` to keep a different number.

## Choose how this instance updates

An instance admin sets this under **Admin → Updates**. There is one setting for the whole platform,
because a release moves every service and every module together.

| Mode | What happens |
|---|---|
| **Off** | Kern does not check for releases. Nothing leaves the instance. |
| **Notify me** | Kern checks, and tells your instance admins. A person applies it. This is the default. |
| **Update automatically** | Kern applies stable releases itself, inside the window you choose. |

The same screen shows the version this instance runs, the version of every module in it, the newest
stable release and what it moves each module to, and anything that blocks the upgrade.

Kern checks every six hours. The check is a plain HTTPS GET for a signed list of releases and
**sends nothing about your instance** — no identifier, no version, no usage.

## Update automatically

Choose **Update automatically**, then set:

- **Update window** — an upgrade only starts inside it. It may cross midnight (22:00 → 02:00).
- **Time zone** — the window is read in this zone, not the server's.
- **Wait after release** — how long a release must be out before this instance takes it. The default
  is 3 days, so you are never the instance that finds the problem on release day.

An automatic upgrade does exactly what `kern-upgrade.sh` does by hand: preflight, snapshot,
maintenance mode, migrate, verify. It stops on the same blockers.

**It will not retry a release that failed.** After a failed automatic upgrade, Kern notifies your
admins and stands down. Apply it by hand to see why, or — once you have fixed the cause — set the
mode to **Update automatically** again, which clears the hold.

### The upgrade runs on the host

Kern never upgrades itself from inside its own container. Something on the host has to do it, and it
asks the instance for permission first. There are two ways to provide it.

**A timer (recommended).** `install.sh` offers to install one. It checks hourly and does nothing
unless the instance says the window is open.

```bash
systemctl --user list-timers kern-auto-update    # is it armed?
journalctl --user -t kern-auto-update            # what did it decide, and when?
```

To install it later:

```bash
cd ~/kern
mkdir -p ~/.config/systemd/user
cp systemd/kern-auto-update.* ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now kern-auto-update.timer
loginctl enable-linger "$USER"     # so it runs when you are not logged in
```

**An updater container.** For a host with no systemd:

```bash
cd ~/kern
docker compose --profile autoupdate up -d
```

:::danger
The updater container mounts the Docker socket. That gives it control of everything Docker runs on
this host, so a compromise of Kern becomes a compromise of the host. Use the timer when you have
systemd. Do not enable this on a host that runs anything else you care about.
:::

Without one of these, **Update automatically** has nothing behind it. The panel says so on that
screen.

### What it does not cover

A preflight failure — no disk space, Postgres not answering — is logged and retried at the next
window rather than recorded as a failed upgrade. Those conditions usually clear on their own, and
locking the instance out of updates because a disk was briefly full would be worse than trying
again.

## Update by hand anyway

Automatic updates being on does not stop you. `./kern-upgrade.sh` works whatever the mode is.

## Undo an upgrade

```bash
cd ~/kern
./kern-rollback.sh
```

**Result:** the images go back to the version in the newest snapshot.

Images roll back on their own. The database does not, because migrations only go forwards. Within a
release, a migration must stay readable by the image before it, so the older images run against the
newer schema. When the release notes say the schema changed in a way that breaks this, restore the
database as well:

```bash
./kern-rollback.sh snapshots/1.1.0-to-1.2.0-20260822-140301 --database
```

:::caution
`--database` replaces the database with the snapshot. Everything written since the snapshot is lost.
The script asks you to type `restore` before it does this.
:::

## Before a large upgrade

1. Read the release notes for the version you are moving to.
2. Check whether the release lists new environment variables. The preflight also refuses to run when
   one is missing.
3. If you customised `Caddyfile` or `docker-compose.yml`, compare them with the new versions in the
   [`app` repository](https://github.com/KernAIO/app/tree/main/selfhost).

## Skipping versions

A release can declare the oldest version that may upgrade straight to it. If your instance is older
than that, the upgrade refuses to run and names the version to step through first. Take that
intermediate version, then upgrade again.

## Upgrading by hand

The script is the supported path. If you have to do it by hand:

```bash
cd ~/kern
docker compose exec -T postgres pg_dump -U kern -Fc kern > kern-$(date +%F).dump
sed -i 's/^KERN_VERSION=.*/KERN_VERSION=1.2.0/' .env
docker compose pull
docker compose run --rm core node dist/migrate.js
docker compose up -d
```

This skips the preflight, maintenance mode and the verification step. Take the dump.

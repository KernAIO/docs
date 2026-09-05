---
title: Backups
description: What to back up, the script that does it, how to restore, and the drill that proves a backup is worth having.
---

A Kern instance's state lives in three places. A backup is all three, taken at the same moment.

| What | Where | Why it matters |
|---|---|---|
| Database (everything except file contents) | `pgdata` volume | every issue, message, page and person |
| File contents (uploads, attachments, avatars) | `miniodata` volume, or your external S3 | the bytes the database rows point at |
| Configuration and secrets | `~/kern/.env`, `Caddyfile`, `livekit.yaml`, `caddy_data` (certificates) | `KERN_SECRET` derives the keys that encrypt stored secrets — **losing `.env` makes those unreadable even with a perfect dump** |

NATS and Valkey hold only transient data (event stream retention, cache, presence) and need no backup.

## The backup script

`kern-backup.sh`, installed beside `docker-compose.yml`, takes all three at once:

```bash
cd ~/kern
./kern-backup.sh                 # take a backup into ./backups, prune old ones (14 kept)
./kern-backup.sh --list          # what you have
./kern-backup.sh --keep 30       # keep 30
./kern-backup.sh --to /mnt/nas   # write somewhere other than ./backups
```

**Result:** a dated directory holding `database.dump` (a `pg_dump` custom-format archive),
`files/` (a mirror of the object storage bucket), `.env` and the compose files, and a
`RESTORE.txt` that says how to put each back.

The installer offers a timer that runs it nightly. Copy `./backups` off the host — restic, rclone,
an S3 bucket in another region — because a backup on the disk that fails is not a backup.

This is not the upgrade snapshot. `kern-upgrade.sh` snapshots the database and the compose files
before every release so `kern-rollback.sh` can undo a bad one in a hurry; it does not copy object
storage. `kern-backup.sh` is what you restore from when the disk fails rather than when a release
did. See [Upgrading](/self-hosting/upgrading/).

## Restore

Goal: a working Kern from a backup, on a fresh machine or the same one.

1. Install Docker on the target machine. Put the backup's `.env`, `docker-compose.yml`, `Caddyfile`
   and `livekit.yaml` into a new directory and download the scripts as the install page shows —
   but **do not run `install.sh`**: it would generate new secrets, and the ones the dump was
   written under are in the `.env` you just copied.
2. Start only the infrastructure, so nothing migrates before the data is back:

   ```bash
   docker compose up -d postgres minio
   ```

3. Create the application role, then restore the dump:

   ```bash
   docker compose up db-init
   docker compose exec -T postgres pg_restore -U kern -d kern --clean --if-exists < database.dump
   ```

   **Result:** `pg_restore` exits 0. A warning about an existing extension is normal.

4. Put the files back — `RESTORE.txt` in the backup gives the exact `mc mirror` command for the
   bundled MinIO, with the bucket name filled in; for an external S3 provider, upload `files/`
   with that provider's tool.
5. `docker compose up -d`.

**Result:** the instance answers at its address with the version the dump was taken under, and a
file uploaded before the backup opens.

## The restore drill

A backup that has never been restored is a hope. Once, and then after any change to how backups
are taken, restore the newest dump into a scratch database on the same host and compare it with
what is live:

```bash
cd ~/kern
DUMP=$(ls -1t backups/*/database.dump | head -1)
docker compose exec -T postgres psql -U kern -d postgres -c 'CREATE DATABASE kern_restore'
docker compose exec -T postgres pg_restore -U kern -d kern_restore --exit-on-error < "$DUMP"

# the row count of every table, in both databases, then the difference
Q="select n.nspname||'.'||c.relname, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text::bigint from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname like 'mod\_%' order by 1"
docker compose exec -T postgres psql -U kern -d kern -Atc "$Q" > /tmp/live.txt
docker compose exec -T postgres psql -U kern -d kern_restore -Atc "$Q" > /tmp/restored.txt
diff /tmp/live.txt /tmp/restored.txt && echo identical

docker compose exec -T postgres psql -U kern -d postgres -c 'DROP DATABASE kern_restore'
```

**Result:** `identical` — or, on a busy instance, differences only in tables written since the dump.
`pg_restore --exit-on-error` stopping is a backup that would not have saved you; find out why
before the night it matters.

This is the drill Kern Cloud ran on 2026-09-03: 150 tables, identical counts, every restored table
owned by the application role so row-level security survived the restore.

## Getting a workspace out

A workspace export is separate from an infrastructure backup. Anyone holding `core.export.run` in
the workspace can request one from **Settings → Data and privacy** and download it there when it is
ready; see [Workspaces](/administration/workspaces/#workspace-settings).

The same thing over the API, for a script:

```bash
# start an export
curl -X POST https://kern.example.com/api/core/exports \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"workspaceId":"<workspace-id>"}'

# poll until status is "ready", then get a download link
curl "https://kern.example.com/api/core/exports/<id>?workspaceId=<workspace-id>" \
  -H "authorization: Bearer $TOKEN"
curl "https://kern.example.com/api/core/exports/<id>/download?workspaceId=<workspace-id>" \
  -H "authorization: Bearer $TOKEN"
```

**Result:** a presigned URL for a gzipped JSON archive. It stays downloadable for 72 hours.

Know what it does and does not contain before you rely on it:

- **Core's data.** Members, groups, roles, bindings, invitations, module state, dashboards, search
  documents and the recent tail of the activity log (50,000 rows).
- **Files as a manifest, not bytes.** Every file's id, name, size, checksum and storage key, each one
  downloadable through the normal API. A workspace's attachments can be hundreds of gigabytes, and
  streaming them into one archive turns a background job into an outage.
- **No module data.** Core asks each enabled module for its own rows through `<module>.export`, and
  **no module implements that procedure yet**, so every one of them is listed in the archive's
  `followUps`. Your issues, pages, messages and assets are not in this file.

So this is a start on data portability, not a migration between instances, and not a substitute for
the database backup above.

An API key is the easiest way to get `$TOKEN`: **Settings → MCP & AI access** creates one, if an
admin has switched the core **API keys** capability on.

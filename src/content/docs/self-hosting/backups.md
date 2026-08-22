---
title: Backups
description: What to back up, how, and how to restore.
---

A Kern instance's state lives in three places. Back up all three.

| What | Where | How |
|---|---|---|
| Database (everything except file contents) | `pgdata` volume | `pg_dump` from the `postgres` container |
| File contents (uploads, attachments, avatars, mail bodies cache) | `miniodata` volume (or your external S3) | `mc mirror`, volume snapshot, or your S3 provider's versioning |
| Configuration and secrets | `~/kern/.env`, `Caddyfile`, `livekit.yaml`, `caddy_data` (certificates) | copy the files |

`KERN_SECRET` is used to derive the keys that encrypt stored secrets (SMTP passwords, API keys, IMAP credentials). **Losing `.env` makes those unreadable even with a perfect database dump**, so keep it with your backups.

## Database dump

```bash
cd ~/kern
docker compose exec -T postgres pg_dump -U kern -Fc kern > kern-$(date +%F).dump
```

Restore into a fresh instance:

```bash
docker compose up -d postgres
docker compose exec -T postgres pg_restore -U kern -d kern --clean --if-exists < kern-2026-08-21.dump
docker compose up -d
```

NATS and Valkey hold only transient data (event stream retention, cache, presence) and do not need backups.

## Files (MinIO)

Either snapshot the `miniodata` volume while MinIO is stopped, or mirror continuously with the MinIO client:

```bash
docker run --rm --network kern_default -v $PWD/backup:/backup minio/mc \
  sh -c "mc alias set local http://minio:9000 kern \$S3_SECRET_KEY && mc mirror local/kern /backup/kern"
```

If you pointed `S3_ENDPOINT` at an external provider, use that provider's versioning/replication instead.

## Automating

A simple nightly cron job that runs the `pg_dump` above and syncs `~/kern` plus the MinIO mirror to off-host storage (restic, rclone, an S3 bucket in another region) is enough for most teams. Test a restore on a scratch VM at least once — the [install](/self-hosting/install/) flow works fine for that.

## Workspace export

Independently of infrastructure backups, workspace admins can export a workspace's data (JSON + files) from **Workspace settings → Export**. This is meant for migrations between instances, not as a replacement for database backups.

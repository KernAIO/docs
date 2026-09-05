---
title: Install on Coolify
description: Deploy Kern as a Coolify Docker Compose resource, without the installer script.
---

[Coolify](https://coolify.io) already does the things `install.sh` does for you: it holds the
server, issues the certificate, keeps the environment and redeploys on a button. So on Coolify you
do not run the installer. You add one Docker Compose resource, give it a domain, and deploy.

Kern ships a Compose file written for this:
[`selfhost/coolify/docker-compose.yml`](https://github.com/KernAIO/app/blob/main/selfhost/coolify/docker-compose.yml).
It is the normal stack with the host-shaped parts removed — nothing is published on port 80 or 443,
no files are mounted, and every secret comes from a Coolify magic variable.

:::caution
The container images are still private, so a deploy cannot pull them yet. This page is ready for the
first release. Until then, use [Develop Kern](/developers/dev-workspace/), which runs from source.
:::

## Requirements

- A Coolify instance, version 4 or newer, with a server attached.
- A domain name pointing at that server, or Coolify's wildcard domain.
- **4 GB of RAM free after Coolify's own containers**, and 20 GB of disk. Coolify, its database and
  its proxy take a few hundred megabytes before Kern starts, so a 4 GB server that already runs
  Coolify is tighter than a 4 GB server that does not. 8 GB is the comfortable size here.

Kern itself needs what it needs anywhere else — x86-64, Docker 24 or newer, and about 700 MB at
rest. See [Requirements](/self-hosting/install/#requirements) for the full table and where the
memory goes.

## 1. Add the resource

You can deploy straight from the Kern repository, which is the path that keeps updating simple.

1. In Coolify, open your project and choose **+ New** → **Public Repository**.
2. Enter the repository URL:

   ```
   https://github.com/KernAIO/app
   ```

3. Set **Build Pack** to **Docker Compose**.
4. Set **Base Directory** to `/selfhost/coolify`.
5. Leave **Docker Compose Location** as `/docker-compose.yml`.
6. Select **Continue**.

**Result:** Coolify reads the Compose file and lists the services it found — `caddy`, `app`, `core`,
`core-worker`, `chat`, `mail`, `collab`, `postgres`, `nats`, `valkey`, `minio`, `minio-init` and
`gotenberg`.

### Or paste the file instead

If you would rather not track the repository, choose **+ New** → **Docker Compose Empty** and paste
the contents of `selfhost/coolify/docker-compose.yml` into the editor. Everything below works the
same way. The difference is that updating means pasting the file again.

## 2. Set the domain

Kern serves six services behind one hostname, so it needs exactly one domain.

1. Open **Configuration** → **Domains**.
2. Set the domain for the **caddy** service, for example `https://kern.example.com`.
3. Leave every other service without a domain.

**Result:** Coolify fills in `SERVICE_URL_CADDY`, and the Compose file derives `KERN_BASE_URL`,
`BETTER_AUTH_URL`, the app's origin and the S3 public endpoint from it.

:::note
Give the **caddy** service the domain, not `app`. Kern's own Caddy is what routes `/api` and `/mcp`
to core, `/api/chat` and `/ws` to chat, `/collab` to collab and `/kern/*` to MinIO. Pointing the
domain at `app` reaches the interface and nothing behind it.
:::

## 3. Set the first admin

1. Open **Environment Variables**.
2. Add `KERN_ADMIN_EMAIL` with the address you want to sign in as.

**Result:** the first boot creates an instance admin with that address.

Kern reads this on the first boot only. After an admin exists it is ignored, and the password is
changed in the interface.

:::caution
`KERN_ADMIN_EMAIL` has to be a real address or `core` refuses to start. The Compose file defaults it
to `admin@example.com` so a deploy without this step still comes up — but then you sign in as
`admin@example.com`, which is not an address you can receive mail at.
:::

## 4. Deploy

Select **Deploy**.

The first deploy pulls about 1 GB of images and runs the database migrations, so give it a few
minutes. `minio-init` creates the storage bucket and then exits — that is expected, not a failure.

**Result:** the resource goes green and your domain answers.

## 5. Sign in

1. Open **Environment Variables** and copy the generated value of `SERVICE_PASSWORD_ADMIN`.
2. Open your domain.
3. Sign in with `KERN_ADMIN_EMAIL` and that password.
4. Change the password under your account settings.

**Result:** Kern opens on your first workspace.

## What Coolify generates for you

The Compose file asks Coolify for every secret, so there is nothing to run `openssl rand` for. Each
value is generated once and kept in the resource's environment.

| Variable | Becomes | Used for |
|---|---|---|
| `SERVICE_URL_CADDY` | your domain, with scheme | `KERN_BASE_URL`, `BETTER_AUTH_URL`, the app's origin, `S3_PUBLIC_ENDPOINT` |
| `SERVICE_BASE64_64_KERNSECRET` | 64 characters | `KERN_SECRET` — derives the keys that encrypt stored secrets |
| `SERVICE_BASE64_64_AUTHSECRET` | 64 characters | `BETTER_AUTH_SECRET` — signs sessions |
| `SERVICE_PASSWORD_POSTGRES` | a password | the Postgres role and `DATABASE_URL` |
| `SERVICE_PASSWORD_MINIO` | a password | the MinIO root user and `S3_SECRET_KEY` |
| `SERVICE_PASSWORD_ADMIN` | a password | the first admin's password |

:::danger
**Back up these values with your database.** `KERN_SECRET` derives the keys that encrypt stored
secrets — SMTP passwords, provider API keys, workspace integrations. A database dump restored without the same
`KERN_SECRET` leaves all of them unreadable. If you ever delete and recreate the resource, Coolify
generates new values.
:::

Export them from **Environment Variables** and keep them wherever you keep your other secrets.

## How this differs from a host install

| | Host install | Coolify |
|---|---|---|
| Setup | `install.sh` writes `~/kern/.env` | Coolify keeps the environment |
| TLS | Kern's Caddy, on ports 80 and 443 | Coolify's proxy; Kern's Caddy serves plain HTTP inside the network |
| Routing | Kern's Caddy | Kern's Caddy, unchanged |
| Upgrades | `./kern-upgrade.sh` — snapshot, maintenance mode, verify | **Redeploy** in Coolify |
| Automatic updates | systemd timer or updater container | not available |
| PDF export from Quire | `--profile preview` starts Gotenberg | always on |
| Postgres init script | mounted | not needed; core's first migration creates the extensions |

## Upgrading

Kern is released as one platform: every service image carries the same version and they move
together.

1. Open **Environment Variables**.
2. Set `KERN_VERSION` to the release you want, for example `1.2.0`. Leave it unset to follow
   `latest`.
3. Select **Redeploy**.

`core` applies the pending migrations while it starts, before the other services come up.

**Take a database dump first.** Redeploying does none of what `kern-upgrade.sh` does — there is no
preflight, no snapshot, no maintenance mode and no rollback.

Under **Admin → Updates**, keep the mode on **Notify me**. Kern still checks for releases and tells
your admins. **Update automatically** has nothing behind it here: it needs a script on the host, and
on Coolify the host is Coolify's.

## Backups

Coolify's scheduled database backups cover databases it manages. This Postgres is a service inside
your Compose resource, so it is not one of them. Back it up yourself.

Open the resource's **Terminal**, choose the `postgres` container, and run:

```bash
pg_dump -U kern -Fc kern > /tmp/kern.dump
```

Then copy it off the server. A **Scheduled Task** on the resource can run the same command on a
cron. See [Backups](/self-hosting/backups/) for what else to keep — the file contents in MinIO, and
the environment variables above.

## Email

Set `SMTP_URL` and `MAIL_FROM` in **Environment Variables** to give the instance a default outbound
provider. Workspaces can override it with their own. See the
[Environment reference](/self-hosting/env-reference/).

## Provider webhooks

`MAIL_WEBHOOK_TOKEN` is required for a provider's bounce and complaint webhooks to be accepted at
all; without it `mail` answers every one `401`. On Coolify it comes from
`SERVICE_PASSWORD_MAILWEBHOOK`, which Coolify generates for you.

1. Open **Environment Variables**.
2. Copy the value of `SERVICE_PASSWORD_MAILWEBHOOK`.
3. Register `https://<your-domain>/api/mail/webhooks/<provider>?token=<that value>` with your email
   provider.

**Result:** bounces appear in the workspace's delivery log, and the addresses appear on the
suppression list. See [Provider webhooks](/self-hosting/env-reference/#provider-webhooks).

## Problems

### The deploy finishes but the domain returns 502

**Cause:** the domain is on the wrong service, or `core` has not come up yet.

**Solution:**

1. Check that the domain is set on **caddy**, not on `app`.
2. Open the logs for `core`. It has to report ready before the app is useful.
3. If `core` is restarting, read the first lines of its log — it prints exactly which environment
   variable it rejected.

### `core` restarts with `Invalid core environment`

**Cause:** an environment variable is present but empty or malformed. An empty `KERN_ADMIN_EMAIL` is
the usual one — an address that is not an address fails validation, and so does a blank.

**Solution:** set `KERN_ADMIN_EMAIL` to a real address, or remove it entirely so the default
applies, and redeploy.

### `minio-init` shows as exited

**Cause:** it is a one-shot container. It creates the storage bucket and stops.

**Solution:** nothing. If uploads fail, check its log — it should have printed the bucket it created.

### Sign-in redirects back to the sign-in page

**Cause:** `KERN_BASE_URL` does not match the address in the browser, so the session cookie is set
for a different host.

**Solution:** confirm the domain under **Configuration** → **Domains** is the one you open, including
`https://`, then redeploy so the services pick it up.

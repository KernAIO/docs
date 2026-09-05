---
title: Environment reference
description: Every variable in the self-host .env file, what it controls, and which variables the shipped compose file does not pass through.
---

`install.sh` creates `~/kern/.env` from `.env.example` and fills in the secrets. `docker-compose.yml`
reads that file and passes the variables to the services.

After changing any variable, apply it:

```bash
cd ~/kern
docker compose up -d
```

**Result:** Compose recreates the containers whose environment changed and leaves the rest running.

Two things are worth knowing before you edit anything here:

- **An upgrade barely touches `.env`.** `kern-upgrade.sh` changes `KERN_VERSION`, backfills
  `KERN_DIR`, `KERN_DB_APP_PASSWORD` and `MAIL_WEBHOOK_TOKEN` when they are missing, and comments out
  a blank `KERN_SIGNUP=`. A value you set is never overwritten. It does refresh `.env.example`, which
  is the only place a new optional key is ever described.
- **A blank value is not the same as an absent one.** Compose passes an empty string, and the
  services validate what they are given, so `KERN_SIGNUP=` is a value core rejects rather than a
  setting it ignores. Comment a line out instead of blanking it.

## Public URL & TLS

| Variable | Example | Purpose |
|---|---|---|
| `KERN_DOMAIN` | `kern.example.com` | Host name Caddy serves. Use an IP for LAN installs. |
| `KERN_BASE_URL` | `https://kern.example.com` | Public URL users open. Used in emails, OAuth callbacks, CORS and the PWA. Must match `KERN_DOMAIN`. |
| `ACME_EMAIL` | `admin@example.com` | Contact email for Let's Encrypt. Set to `internal` for a self-signed certificate on IP/LAN installs. |

## Release and images

| Variable | Default | Purpose |
|---|---|---|
| `KERN_VERSION` | written by `install.sh` | Image tag for every Kern service. Always a concrete version. |
| `KERN_IMAGE_SHELL` | `ghcr.io/kernaio/shell` | The shell image, without its tag. Point it at your own registry when you have built the image with modules of your own — see [Module development](/developers/module-development/). |
| `KERN_IMAGE_CORE` | `ghcr.io/kernaio/core` | The core image, without its tag; `core` and `core-worker` both run it. Build it from the same release and with the same modules as the shell. |
| `KERN_DIR` | written by `install.sh` | Absolute path of the install directory. Only the optional `updater` container reads it: it runs `docker compose` against the host's daemon, so the bind mounts must resolve to the same path inside the container and out. |
| `KERN_API_ORIGIN` | `http://core:4000` | Where the web app reaches core when it renders a page **itself**. Leave it alone. |
| `TZ` | `UTC` | Time zone the optional `updater` container reads the update window in. The window itself is set in **Admin → Updates**. |

`KERN_API_ORIGIN` is not the same as `PUBLIC_API_URL`. The `PUBLIC_*` addresses are what the app
tells a *browser* to open; a server-side render that used one would send the shell container out
through Caddy and back in to reach a service one hop away on the same network. On an IP or LAN
install that also fails outright — `ACME_EMAIL=internal` means Caddy issues a certificate from a CA
nothing trusts, and Node's `fetch` rejects it.

**Do not set `KERN_VERSION` back to `latest`.** A rollback is recorded as "the version we came
from", so an instance on `latest` snapshots `from-version: latest`, and `kern-rollback.sh` then
re-pins the version you have just moved to — a rollback that reports success and changes nothing.
`latest` also lets a pull landing mid-release give five services five different builds.

Kern checks for new releases every six hours. The check is a plain HTTPS GET for a signed static
file. It sends nothing about the instance — no identifier, no version, no usage — and an instance
admin can switch it off under **Admin → Updates**, which stops the request being made at all.

## Secrets

`install.sh` generates all of these with `openssl rand -hex 32`. Generate a replacement the same way.

| Variable | Purpose |
|---|---|
| `KERN_SECRET` | Master secret from which per-purpose keys are derived (AES-256-GCM for stored secrets, HS256 for service-to-service tokens). **Do not lose or rotate casually** — stored provider passwords are encrypted with keys derived from it. |
| `BETTER_AUTH_SECRET` | Session/JWT signing secret for the identity layer. |
| `POSTGRES_PASSWORD` | Password of the Postgres **bootstrap superuser**. Used for administration only: migrations run by hand, backups, and the `db-init` service. |
| `KERN_DB_APP_PASSWORD` | Password of `kern_app`, the role every service actually connects as. |
| `S3_SECRET_KEY` | MinIO root password / S3 secret key. |
| `MAIL_WEBHOOK_TOKEN` | Shared secret your email provider's bounce and complaint webhooks must present. Required — see [Provider webhooks](#provider-webhooks). |

Keep every one of these hex or alphanumeric. `KERN_DB_APP_PASSWORD` goes into a `DATABASE_URL`,
where a `@`, `:`, `/` or `#` is parsed as URL syntax.

`LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are in `.env.example` and are **not** secrets of yours to
generate. They ship empty, `install.sh` no longer offers to fill them in, and no Kern service reads
either one — there is no calls module. Leave them empty; the `calls` Compose profile is there for
the release that ships calls.

## Postgres

| Variable | Default | Purpose |
|---|---|---|
| `POSTGRES_USER` | `kern` | The bootstrap superuser the Postgres image creates. Administration only. |
| `POSTGRES_DB` | `kern` | Database name. Each module uses its own schema (`mod_<id>`) inside it. |

**The services do not connect as `POSTGRES_USER`.** The compose file assembles
`DATABASE_URL=postgres://kern_app:$KERN_DB_APP_PASSWORD@postgres:5432/$POSTGRES_DB`, and the
`db-init` service creates `kern_app` as `NOSUPERUSER NOBYPASSRLS` before anything starts.

That distinction is the whole point of `db-init`. A superuser bypasses row-level security
unconditionally, so every tenant-isolation policy in every module does nothing while the services
connect as one. `db-init` also hands `kern_app` ownership of the database and everything already in
it, which is what makes the policies start applying on an instance that already has data.

To use an external Postgres 18 (with `pgvector`, `pg_trgm`, `ltree`, `pgcrypto` and `btree_gist`),
see [External Postgres](/self-hosting/external-postgres/).

## Object storage

| Variable | Default | Purpose |
|---|---|---|
| `S3_ENDPOINT` | `http://minio:9000` | Internal S3 endpoint the services upload to. |
| `S3_PUBLIC_ENDPOINT` | `https://kern.example.com` | Origin embedded in the presigned URLs handed to browsers. **A bare origin, with no path.** |
| `S3_REGION` | `us-east-1` | Region (any value for MinIO). |
| `S3_BUCKET` | `kern` | Bucket name, created by `minio-init`. |
| `S3_ACCESS_KEY` | `kern` | Access key / MinIO root user. |

`S3_PUBLIC_ENDPOINT` carries no path of its own, and that is not a style choice. A presigned URL is a
SigV4 signature over the canonical path, so MinIO has to receive the byte-identical path core signed.
Caddy routes `/kern/*` to MinIO without stripping anything. Giving this variable a `/s3` prefix signs
`/s3/<bucket>/<key>` and delivers `/<bucket>/<key>`, which is what made every upload and download
fail with **403 SignatureDoesNotMatch**.

`S3_BUCKET` therefore has to stay `kern` while you use the bundled MinIO: the bucket name *is* the
Caddy route, and `kern` is reserved in core so no workspace can live at `/kern` and shadow it. An
external S3 is reached directly and has no such constraint.

Point these at AWS S3, R2, GCS (S3 mode) or any compatible store to run without MinIO.

## Outbound email

| Variable | Example | Purpose |
|---|---|---|
| `SMTP_URL` | `smtps://user:pass@smtp.example.com:465` | Instance default, used for sign-in emails, invitations and any workspace that has not configured its own provider. |
| `MAIL_FROM` | `"Kern <no-reply@kern.example.com>"` | Default sender. |

Workspaces can override both with their own SMTP, Mailgun, SES, Postmark or Resend configuration
under **Settings → Email**, the page the Mail module contributes to workspace settings.

### Provider webhooks

`MAIL_WEBHOOK_TOKEN` is the shared secret Mailgun, Postmark, SES and Resend must present when they
report a bounce or a complaint. It is **not optional**: with no token configured, `mail` answers
every webhook `401` rather than trusting one.

That is the safe direction to fail in. The endpoint writes suppressions, and a suppression a
stranger wrote silently stops that person's password resets, magic links and invitations for good —
so an open endpoint lets anyone permanently block any address on your instance.

Register this URL with your provider, and put the value of `MAIL_WEBHOOK_TOKEN` in the `token`
parameter:

```
https://kern.example.com/api/mail/webhooks/<provider>?token=<MAIL_WEBHOOK_TOKEN>
```

`<provider>` is one of `mailgun`, `postmark`, `ses` or `resend`. Note the plural in `webhooks`;
anything else is a 404. A provider that can send custom headers instead of a query parameter may
send `x-kern-webhook-token` with the same value.

**Result:** bounces and complaints appear in the workspace's delivery log, and the addresses appear
on the suppression list. While the token is wrong or missing, deliveries stop being marked bounced
and nothing else changes.

`install.sh` generates this secret on a new install, and `kern-upgrade.sh` generates one for an
instance that predates it. If your instance was installed before the token existed, re-point your
provider at the URL above after the upgrade.

## First admin

| Variable | Purpose |
|---|---|
| `KERN_ADMIN_EMAIL` | If set, an instance admin with this email is created on first boot. |
| `KERN_ADMIN_PASSWORD` | Its initial password, at least 8 characters. Change it after signing in; you may then blank both variables. |

## Who may create an account

`KERN_SIGNUP` seeds the sign-up policy on the very first boot and is ignored afterwards. Once the
instance exists, core owns the setting.

| Value | Meaning |
|---|---|
| `open` | Anyone may create an account. |
| `invite` | An invitation or an administrator only. |
| commented out | Invite-only whenever `KERN_ADMIN_EMAIL` is configured. |

**Leave the line commented out unless you mean to set a real value.** `KERN_SIGNUP=` sets the
variable to the empty string, core parses it with `z.enum(['open','invite']).optional()`, and an
empty string is "Invalid option" rather than "absent". Core then throws during boot — and
`core-worker`, `chat`, `mail` and `collab` all wait on core being healthy, so the whole stack comes
up with nothing running.

## Sign in with Google, GitHub or Microsoft

Social sign-in ships in every image and is off until you fill this section in. Passwords, magic
links and passkeys keep working either way, so leaving it empty is the normal install.

**Two things have to agree, and configuring only the first is the mistake worth naming.** The
credentials make a provider *work*; `PUBLIC_AUTH_PROVIDERS` is what puts its button on the sign-in
and sign-up screens. The web app cannot ask core what is configured, so a provider missing from the
list has no button however complete its credentials are — and a provider in the list with no
credentials draws a button that fails when it is pressed.

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client (Web) |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth app |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | Microsoft Entra app registration |
| `MICROSOFT_TENANT_ID` | Unset admits any Microsoft account; a directory id admits one tenant |
| `PUBLIC_AUTH_PROVIDERS` | Which buttons the app draws. A comma-separated subset of `google,github,microsoft`. |

Register this redirect URI with each provider, replacing the host with your `KERN_DOMAIN`. The path
is the same for all three, with the provider's name at the end:

```
https://kern.example.com/api/auth/callback/google
https://kern.example.com/api/auth/callback/github
https://kern.example.com/api/auth/callback/microsoft
```

Every line of this section ships **commented out**, and it has to stay that way until you have both
halves of a pair. `GOOGLE_CLIENT_ID=` is the empty string, not an absence, and a blank assignment
defeats the pass-through in `docker-compose.yml`. Core builds its provider list with `if (clientId &&
clientSecret)`, so a half-configured pair leaves that provider off rather than registering one that
cannot complete a sign-in.

**Result:** after `docker compose up -d`, the sign-in screen draws a button for each provider named
in `PUBLIC_AUTH_PROVIDERS`, and pressing it completes a sign-in.

## Billing

Kern ships a billing module in every image. It does nothing until you both define plans in
**Admin → Plans** and set a Stripe key here, so leaving this section empty is the normal
self-hosted install: unlimited seats, unlimited storage, every module, no payment.

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe API key. Use a test key (`sk_test_…`) until you are ready to take real money. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the endpoint you point at `https://<domain>/api/billing/webhook`. |
| `KERN_DEFAULT_PLAN_SLUG` | Slug of the plan a newly created workspace starts on. Empty means no plan and no limits. |

## Derived / internal variables

The compose file also sets, for every service: `NODE_ENV=production`, `DATABASE_URL`,
`NATS_URL=nats://nats:4222`, `VALKEY_URL=redis://valkey:6379`, `BETTER_AUTH_URL=$KERN_BASE_URL`,
`CORE_URL`, `CHAT_URL`, `MAIL_URL`, `COLLAB_URL` (internal service addresses) and
`LIVEKIT_URL=ws://livekit:7880`. The web app additionally receives `PORT`, `ORIGIN`,
`PUBLIC_API_URL`, `PUBLIC_WS_URL` and `PUBLIC_COLLAB_URL`, all derived from `KERN_BASE_URL`. You
normally never edit these.

## Variables the compose file does not pass

Core reads several more variables, and **the shipped `docker-compose.yml` does not pass any of
them** — putting one in `.env` alone has no effect at all. To use one, add it to the `core`
service's `environment:` block in `docker-compose.yml` and then run `docker compose up -d core`.

| Variable | What it does |
|---|---|
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Your own Web Push keys. Not needed to switch Web Push on: core generates a pair on first use and stores it in instance settings. Set these to keep a pair you already have. |
| `PASSKEY_RP_ID` | Passkey relying-party id. Defaults to the hostname of `KERN_BASE_URL`, which is correct for a normal install. |
| `UPLOAD_MAX_PUT_BYTES` | Largest single-PUT upload core will sign, in bytes. Default `524288000` (500 MB). |
| `KERN_UPDATE_FEED_KEY` | Base64 ed25519 public key the release feed is verified with. Only needed when you publish your own feed. |
| `GOTENBERG_URL` | Where Quire's PDF export sends its HTML. Defaults to `http://gotenberg:3000`, which is the container the `preview` profile starts. |

:::caution
Editing `docker-compose.yml` has a cost. An upgrade brings the release's stack files forward only
when your copy still matches the one your current version shipped — it cannot tell your edit from a
file it may safely replace. Once you have edited it, `kern-upgrade.sh` leaves it alone, prints the
release's diff for you to merge, and ends with a warning instead of a green tick.
:::

## Variables the host scripts read

These are read from the shell environment of `kern-upgrade.sh`, `kern-rollback.sh` and
`kern-backup.sh`. They are **not** read from `.env` — the scripts pull individual keys out of that
file rather than sourcing it.

| Variable | Default | Read by |
|---|---|---|
| `KERN_SNAPSHOT_DIR` | `<install dir>/snapshots` | `kern-upgrade.sh`, `kern-rollback.sh` |
| `KERN_KEEP_SNAPSHOTS` | `5` | `kern-upgrade.sh` |
| `KERN_BACKUP_DIR` | `<install dir>/backups` | `kern-backup.sh` |
| `KERN_FEED_URL` | the GitHub release feed | `install.sh`, `kern-upgrade.sh` |

Set one on the command line for a single run:

```bash
KERN_KEEP_SNAPSHOTS=10 ./kern-upgrade.sh
```

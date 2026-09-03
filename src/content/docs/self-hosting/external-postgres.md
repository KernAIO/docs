---
title: External Postgres
description: Run Kern against your own managed Postgres — the role Kern must connect as, the one extension you create by hand, and the recipe for a new or an existing database.
---

Kern can run against a Postgres you already operate — Amazon RDS or Aurora, Google Cloud SQL, Azure
Database for PostgreSQL, or your own server — instead of the `postgres` container in the shipped
stack. When you finish this page, `DATABASE_URL` points at that server and Kern boots against it.

## Why the role matters

Kern's services must connect as a role that is **neither a superuser nor `BYPASSRLS`**. Postgres
skips every row-level security policy for such a role, so every tenant-isolation policy Kern defines
would be inert and a query for one workspace could read another workspace's rows.

The kernel asks the database which role it authenticated as, and **refuses to start in production**
when policies would not bind it. The message names the role and points back here.

In the shipped Compose stack the `db-init` service arranges this for you. On your own Postgres you
do it once, by hand, and this page is that procedure.

## Requirements

- **Postgres 18**, with the `vector` extension available to install.
- An **admin role** on that server — the RDS master user, the Cloud SQL default user, or the Azure
  administrator. It needs `CREATEROLE` and `CREATEDB`; all three providers' admin roles have both.
- A password you choose for the new `kern_app` role. Keep it hex or alphanumeric: it goes into
  `DATABASE_URL`, where `@`, `:`, `/` or `#` would be read as URL syntax.
- No superuser. Nothing on this page needs one.

Only one extension needs your admin role: **`vector`**. It is the one untrusted extension Kern uses,
so the application role cannot create it itself. `pg_trgm`, `pgcrypto`, `ltree` and `btree_gist` are
trusted, and Kern's own migrations create them on first boot.

## A new database

This is the recommended path, and it needs no superuser anywhere.

1. Connect to the server as your provider's admin role.
2. Create the role Kern will connect as, with a password of your own:

   ```sql
   create role kern_app login password '…' nosuperuser nobypassrls nocreatedb nocreaterole;
   ```

3. Make the admin role a member of it, so the admin may create a database owned by it:

   ```sql
   grant kern_app to current_user;
   ```

4. Create the database:

   ```sql
   create database kern owner kern_app;
   ```

5. Connect to the new database and create the one extension Kern cannot create for itself:

   ```sql
   \c kern
   create extension if not exists vector;
   ```

   **Result:** `CREATE EXTENSION`. If the extension was already there you get a notice instead, which
   is also success — the existence check runs before the permission check, so `if not exists` passes
   even for a role that could not have created it.

6. Point Kern at it. In `~/kern/.env`, set:

   ```
   DATABASE_URL=postgres://kern_app:…@your-host:5432/kern
   ```

7. Remove the `postgres` and `db-init` services from `docker-compose.yml`, and remove every
   `depends_on` entry that names them.

8. Start Kern:

   ```bash
   docker compose up -d
   ```

   **Result:** `core` reports ready and creates its schemas and the trusted extensions as `kern_app`.
   If it exits instead, read the first lines of `docker compose logs core` — a refusal about
   row-level security names the role it connected as.

### If `create extension vector` is refused

The statement in step 5 is the one that differs by provider.

| Provider | What to do |
|---|---|
| Amazon RDS and Aurora | The master user creates it directly. If `rds.allowed_extensions` is set on the parameter group, add `vector` to it first. |
| Google Cloud SQL | The default (admin) user creates it directly. |
| Azure Database for PostgreSQL Flexible Server | Add `VECTOR` to the `azure.extensions` server parameter **first**, then run the statement. |
| Your own Postgres server | This one statement needs a real superuser. Stock pgvector's control file is not marked trusted. |

## Or connect as the provider's own admin role

A managed instance can skip `kern_app` altogether and connect as the role the provider gave you. The
RDS master user, the Cloud SQL default user and the Azure administrator are all `rolsuper = false`
and `rolbypassrls = false`, which is exactly what the kernel checks, and every Kern policy carries
`force row level security`, which binds an owner. So Kern boots and row-level security is enforced.

The whole procedure then shrinks to `create extension vector` and a `DATABASE_URL`.

:::caution
This is a documented shortcut, not the recommendation. The provider's admin role carries
instance-wide `CREATEROLE` and `CREATEDB` and reaches every database on that server, so a bug in any
service that reaches SQL inherits all of it. A dedicated `kern_app` reaches one database and can
create neither roles nor databases.
:::

## An existing external database

Use this when Kern already ran against your external Postgres under the provider's role and you now
want a dedicated one.

1. Connect as your provider's admin role — the role that currently owns the database.
2. Create the role and take membership of it:

   ```sql
   create role kern_app login password '…' nosuperuser nobypassrls nocreatedb nocreaterole;
   grant kern_app to current_user;
   ```

3. Move the database and everything in it:

   ```sql
   alter database kern owner to kern_app;
   reassign owned by <old role> to kern_app;
   ```

   Run `reassign owned by` as `<old role>`. It transfers the extensions too, which is harmless.

4. Change `DATABASE_URL` to `kern_app` and restart with `docker compose up -d`.

   **Result:** `core` reports ready. The ownership change is metadata only and takes seconds, but do
   it in a window — the services cannot write while ownership moves.

:::danger
**Do not run this recipe against the shipped Compose stack.** There the old owner *is* the bootstrap
superuser, and `reassign owned by` a superuser's objects itself requires superuser — the exact
privilege you are trying to stop using. The `db-init` service moves ownership with per-object
`alter … owner to` loops that skip extension-owned objects, which is why it can do what `reassign`
cannot.

On the Compose stack, run no SQL at all: update `~/kern` to the current release files and run
`docker compose up -d`. See [Upgrading](/self-hosting/upgrading/).
:::

## `pg_stat_statements` is optional

The shipped stack creates `pg_stat_statements` when the server offers it, and skips it otherwise.
Nothing in Kern reads it — no service, no module and no migration — so a managed instance that does
not offer it loses nothing.

## What Kern creates for itself

After `DATABASE_URL` points at `kern_app`, first boot creates:

- one schema per module, named `mod_<id>`,
- the trusted extensions `pg_trgm`, `pgcrypto`, `ltree` and `btree_gist`,
- every table, index and row-level security policy each module declares.

You never create a schema by hand. See [Releases and migrations](/developers/releases-and-migrations/)
for how those change between versions.

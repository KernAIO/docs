---
title: Feature overview
description: A module-by-module summary of what a Kern release actually contains, and what is still planned.
---

This page lists what ships. Everything under [What ships](#what-ships) has code you can run today;
everything under [Planned](#planned) does not. Each module has its own page under **Modules** with
the detail, including the gaps inside a module that does ship.

## What ships

Kern installs as one platform plus seven modules. Five of them (`tracker`, `quire`, `hr`, `billing`,
`inventory`) run inside the `core` service; `chat` and `mail` have services of their own. Every
module can be switched off per workspace.

### Platform

- **Accounts** — email and password, magic link, 2FA, passkeys, multi-device sessions, API keys, and
  Google, GitHub or Microsoft sign-in once you add an OAuth client — see
  [Environment reference](/self-hosting/env-reference/#sign-in-with-google-github-or-microsoft).
- **Workspaces** — unlimited per instance; members, groups, custom roles, invitations by email or
  from the directory of people you already share a workspace with, archive, branding, encrypted
  integrations, module and capability toggles, audit log.
- **Permissions** — module-registered keys, roles, and bindings at workspace, project, space or
  object scope. Guests can be restricted to named objects. See
  [Roles & permissions](/administration/roles-permissions/).
- **Notifications** — a cross-workspace inbox, per-type channel preferences, email digests, Web
  Push and badge counts. Web Push needs no configuration: core generates its own VAPID key pair on
  first use.
- **Search** — global ⌘K across modules, on Postgres full-text search and trigram indexes. No extra
  service.
- **Files** — S3 or MinIO storage with presigned URLs, attachable from anywhere. An upload is one
  presigned PUT of up to 500 MB; see [Large uploads](/self-hosting/reverse-proxy-tls/#large-uploads).
- **Activity & audit** — an append-only activity stream per object, and a workspace audit log.
- **Public API** — OpenAPI 3.1 per module at `/api/<module>/openapi.json`, workspace-scoped API
  keys, and [MCP](/administration/mcp/), which turns every module's API into tools for an AI client.

### Tracker

Projects, work-item types with hierarchy (initiative › epic › standard › sub-item), custom fields,
per-type layouts, workflows with statuses, transitions, conditions, validators and approvals, rich
issues (relations, watchers, threaded comments, attachments, templates, repeating issues, bulk edit,
`KRN-123` keys), list and board views, KQL, saved views, backlog ranking, cycles, milestones,
versions, components, reports, a public intake form with a triage queue, time tracking with timers,
CSV/Jira/Linear import, and a per-issue chat channel. See [Tracker](/modules/tracker/).

### Chat

Public and private channels, DMs and group DMs, object channels attached to an issue, threads,
reactions, mentions, read state and unread counters, pins and bookmarks, search, file sharing,
typing and presence, mute and per-channel notification levels, slash commands, and incoming
webhooks. The `chat` service also runs the realtime gateway every other module uses. See
[Chat](/modules/chat/).

### Quire

Spaces and a nested page tree, real-time collaborative editing, comments anchored to the text,
version history with publish and restore, public links for a published page, a database engine with
typed columns, filters, relations, rollups and formulas, templates, labels and favourites, import
from Markdown, HTML, CSV and ZIP, and export to Markdown, HTML, PDF and ZIP. See
[Quire](/modules/quire/).

### HR

Called **People** in the navigation rail. The directory and org chart, offices and legal entities,
holiday calendars, leave types with accrual and approvals, approval chains, attendance and shift
rosters, employee documents, onboarding and offboarding checklists, payroll export and reports —
each behind a capability a workspace switches on, so a company that wants only a directory gets only
a directory. Kern computes no pay. See [HR](/modules/hr/).

### Mail

The outbound half of email: a provider per workspace (SMTP, Mailgun, SES, Postmark, Resend) with
MJML templates, a queue with retries, a delivery log, and provider webhooks that record bounces and
complaints and add suppressions. Every message Kern sends goes through it. See [Mail](/modules/mail/).

### Inventory

The asset register — what the company owns, who holds it, purchase and warranty, categories and
custom fields, repairs, files, and a full history. See [Inventory](/modules/inventory/).

### Billing

Plans, entitlements and Stripe subscriptions, for an instance that sells workspaces. It ships in
every image and does nothing until you define plans and set a Stripe key, so a normal self-hosted
install has unlimited seats, unlimited storage and every module. See
[Billing](/self-hosting/billing/).

## Planned

No dates. None of the following has code in the repositories, and each module page below opens with
the same notice.

| Planned | Page |
|---|---|
| **Drive** — folders, file versions, share links, previews, quotas | [Drive & Calendar](/modules/docs-drive/) |
| **Calendar** — personal and team calendars, recurring events, overlays | [Drive & Calendar](/modules/docs-drive/) |
| **Recruiting** — vacancies, candidates, pipelines, interviews, offers | [Recruiting](/modules/recruiting/) |
| **CRM** — contacts, companies, leads, deals, pipelines | [CRM](/modules/crm/) |
| **Automation** — trigger, condition and action rules with a run log | [Automation](/modules/automation/) |
| **Calls** — audio and video, screen share, huddles | [Calls](/modules/calls/) |
| **AI assistant** — bring-your-own-key summaries, drafting, an `@kern` bot | [AI assistant](/modules/ai/) |

Some smaller pieces are planned inside modules that do ship:

- **Resumable (tus) uploads.** An upload is a single PUT today, capped at 500 MB.
- **Signed outgoing webhooks.** Nothing in Kern calls out to a URL you register.
- **A per-user email inbox.** Mail sends; it does not receive. There is no IMAP account, no intake
  address and no email-to-issue — Tracker exposes `issues.createFromEmail` and nothing calls it.
- **Per-workspace SSO (OIDC/SAML) and SCIM.** The plan entitlement exists; registering an identity
  provider does not.
- **Join requests and domain auto-join.** An invitation is the only way into a workspace.
- **Cross-workspace shared channels, bots and huddles in Chat.**
- **A screen for the workspace export**, which is on the API only and does not yet include module
  data — see [Backups](/self-hosting/backups/#getting-a-workspace-out).

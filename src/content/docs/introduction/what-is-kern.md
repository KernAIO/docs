---
title: What is Kern?
description: An overview of Kern, who it is for, and what ships in v1.0.
---

Kern is an open-source, self-hostable **all-in-one work platform**. Instead of stitching together a Jira for issues, a Slack for chat, a Notion for docs and an HR tool — and paying for the integrations between them — Kern ships those as modules of one application that share one identity, one permission model, one search, one notification inbox and one activity log.

## What you get

- **Tracker** — issues and projects with custom work-item types, hierarchy levels, custom fields, workflows with conditions and validators, boards, cycles, a JQL-style query language (KQL), reports and time tracking.
- **Chat** — channels, DMs, threads, reactions, mentions, read state, file sharing and slash commands, plus *object channels* attached to any issue.
- **Quire** — a Notion-style wiki: spaces, nested pages, real-time collaborative editing, version history, comments anchored to the text, databases, templates, public links, import and export.
- **HR** — the people directory and org chart, leave with accrual and approvals, attendance and rosters, onboarding checklists and payroll export.
- **Mail** — every message Kern sends: an outbound provider per workspace, templates, a queue, a delivery log and bounce handling.
- **Inventory** — the asset register: what the company owns, who holds it, warranty, repairs and a full history.
- **Billing** — plans, entitlements and Stripe subscriptions, for an instance that sells workspaces. Empty and inert on a normal self-hosted install.

Drive, Calendar, Recruiting, CRM, Automation, Calls and an AI assistant are **planned and not
built**. [Feature overview](/introduction/feature-overview/) says exactly what ships.

Everything is **multi-workspace**: an instance hosts any number of workspaces (companies, teams, clients), and a user belongs to as many as they like with one login and one cross-workspace notification inbox.

## Who it is for

- Teams that want Jira/Slack/Notion-class tooling without three vendors and three bills.
- Organisations that need to **own their data** — Kern runs on your servers, under an open-source licence.
- Agencies and consultancies that run many clients as separate workspaces from one installation.

## Self-host vs Kern Cloud

Self-hosting is free and complete — there is no "enterprise tier" of hidden features. Items that other tools sell (custom types, time tracking, approvals, RBAC, audit logs) ship in the open-source release. A hosted version, **Kern Cloud**, is the commercial offering for teams that prefer not to run servers.

## Technology in one paragraph

Kern is a Svelte 5 / SvelteKit progressive web app backed by Node 24 services: `core` (identity, workspaces, permissions, notifications and five modules), `chat` (chat + the realtime WebSocket gateway), `mail` (outbound providers and their webhooks) and `collab` (Yjs collaborative editing). They share one Postgres 18 (one schema per module, row-level security), NATS JetStream for events, Valkey for cache and presence, and MinIO/S3 for files. A shared **kernel** runtime makes "which module runs in which service" a configuration concern. See [Architecture](/developers/architecture/).

## Licence

Kern uses two licences. The **framework** you build modules against — `@kernhq/kernel`, `@kernhq/contracts`, `@kernhq/sdk`, `@kernhq/ui` and the module template — is **Apache-2.0**, so a module you write is yours to licence however you like, closed and commercial included. The **product** — `shell`, `core`, `chat`, `mail`, `collab`, `docs` and the first-party modules — is **AGPL-3.0-only**: self-host, modify and redistribute freely, but if you offer a modified Kern as a service you publish your changes.

Contributions are accepted under a [CLA](/contributing/cla/). Full detail: [Licensing](/developers/licensing/).

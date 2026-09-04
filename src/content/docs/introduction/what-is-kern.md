---
title: What is Kern?
description: An overview of Kern, who it is for, and what ships in v1.0.
---

Kern is an open-source, self-hostable **all-in-one work platform**. Instead of stitching together a Jira for issues, a Slack for chat, a Notion for docs, a Nextcloud for files, an HR tool, an ATS, a CRM and a mail client — and paying for the integrations between them — Kern ships all of those as modules of one application that share one identity, one permission model, one search, one notification inbox and one activity log.

## What you get

- **Tracker** — issues and projects with custom work-item types, hierarchy levels, custom fields, workflows with conditions/validators/post-functions, boards, sprints, roadmaps, a JQL-style query language (KQL), reports and time tracking.
- **Chat** — channels, DMs, threads, reactions, mentions, read state, file sharing, slash commands and bots, plus *object channels* attached to any issue, candidate or deal.
- **Quire** — a Notion-style wiki: spaces, nested pages, real-time collaborative editing, version history and comments anchored to the text.
- **Drive & Calendar** — folders, file versions, share links and previews; personal and team calendars with overlays for sprints, leaves and interviews.
- **HR, Recruiting, CRM** — employees and org chart, leave and approvals, vacancies and pipelines, contacts, companies and deals.
- **Automation** — trigger → condition → action rules with branches and smart values, scheduled rules and sandboxed scripts.
- **Mail** — outbound providers per workspace, and a per-user IMAP/SMTP inbox that links email to issues, contacts and candidates.
- **Calls** — audio/video and screen share via LiveKit, started from chat, calendar or an interview.
- **AI assistant** — bring-your-own-key summaries, drafting, semantic search and an `@kern` bot.

Everything is **multi-workspace**: an instance hosts any number of workspaces (companies, teams, clients), and a user belongs to as many as they like with one login and one cross-workspace notification inbox.

## Who it is for

- Teams that want Jira/Slack/Notion-class tooling without three vendors and three bills.
- Organisations that need to **own their data** — Kern runs on your servers, under an open-source licence.
- Agencies and consultancies that run many clients as separate workspaces from one installation.

## Self-host vs Kern Cloud

Self-hosting is free and complete — there is no "enterprise tier" of hidden features. Items that other tools sell (custom types, time tracking, approvals, RBAC, audit logs) ship in the open-source release. A hosted version, **Kern Cloud**, is the commercial offering for teams that prefer not to run servers.

## Technology in one paragraph

Kern is a Svelte 5 / SvelteKit progressive web app backed by Node 24 services: `core` (identity, workspaces, permissions, notifications and most modules), `chat` (chat + the realtime WebSocket gateway), `mail` (providers and IMAP sync) and `collab` (Yjs collaborative editing). They share one Postgres 18 (one schema per module, row-level security), NATS JetStream for events, Valkey for cache and presence, and MinIO/S3 for files. A shared **kernel** runtime makes "which module runs in which service" a configuration concern. See [Architecture](/developers/architecture/).

## Licence

Kern uses two licences. The **framework** you build modules against — `@kernhq/kernel`, `@kernhq/contracts`, `@kernhq/sdk`, `@kernhq/ui` and the module template — is **Apache-2.0**, so a module you write is yours to licence however you like, closed and commercial included. The **product** — `app`, `core`, `chat`, `mail`, `collab`, `docs` and the first-party modules — is **AGPL-3.0-only**: self-host, modify and redistribute freely, but if you offer a modified Kern as a service you publish your changes.

Contributions are accepted under a [CLA](/contributing/cla/). Full detail: [Licensing](/developers/licensing/).

---
title: Feature overview
description: A module-by-module summary of what Kern v1.0 includes.
---

This page condenses the v1.0 scope. Each module has its own page under **Modules** with more detail. Items marked *v1.x* arrive shortly after the initial release.

## Platform (always on)

- **Accounts**: email + password, magic link, Google/GitHub/Microsoft OAuth, 2FA and passkeys, multi-device sessions, per-workspace SSO (OIDC/SAML), API tokens and service accounts. SCIM is *v1.x*.
- **Workspaces**: unlimited per instance; members, groups, custom roles, invitations (by email or from shared workspaces), join requests, domain auto-join, ownership transfer, archive/delete, branding, encrypted integrations, module toggles, audit log, export/import.
- **Permissions**: module-registered keys, roles, bindings at workspace/project/space/object scope, per-project permission schemes, restricted guests.
- **Notifications**: cross-workspace inbox, per-type channel preferences, mention/assign/watch rules, digests, Web Push (including iOS declarative push), badge counts.
- **Search**: global ⌘K across modules (Postgres full-text + trigram; semantic via the AI module).
- **Files**: S3/MinIO storage, resumable (tus) uploads, previews and thumbnails, attach anywhere.
- **Activity & audit**: append-only per-object activity stream.
- **Admin console**: users, workspaces, modules, default mail, limits, health.
- **Public API**: OpenAPI 3.1 per module, signed outgoing webhooks, incoming webhooks, importers (Jira, Linear, CSV; Trello/Asana *v1.x*).

## Tracker

Projects, work-item types with hierarchy (Initiative › Epic › Story/Task/Bug › Sub-task), custom fields, per-type layouts, workflows with statuses/transitions/conditions/validators/post-functions and approvals, rich issues (relations, watchers, threaded comments, attachments, templates, recurring issues, bulk edit, `KRN-123` keys), List/Board/Calendar/Timeline/Spreadsheet views, KQL, saved views, backlog ranking, cycles, milestones, releases, roadmap, reports, intake forms and email-to-issue, service-desk queues and SLAs, time tracking with timers and timesheets, per-issue chat channel.

## Chat

Public/private channels, DMs, group DMs and object channels; threads, reactions, mentions, read state and unread counters, pins, bookmarks, search, file sharing, link unfurls, typing and presence, mute/DnD, slash commands, bots and webhooks, message → issue/doc actions, huddles, export. Cross-workspace shared channels are *v1.x*.

## Quire, Drive & Calendar

Spaces and nested pages with real-time collaboration, comments anchored to the text, version history with publish and restore, and a database engine with typed columns, filters, relations, rollups and formulas; folders, resumable uploads, file versions, share links with expiry/password, previews, trash and quotas; personal/team calendars with recurring events, reminders and overlays. Embeds, templates, public links, export, whiteboards, WebDAV and CalDAV/Google sync are *v1.x*.

## HR, Recruiting, CRM

Employees, org chart, departments, leave types and PTO approvals, holidays, schedules, onboarding checklists, documents. Vacancies, candidates, pipeline stages, interviews with scorecards, offers, a public career page and resume parsing. Contacts, companies, leads, deals with pipelines, activities, custom fields, web-to-lead forms and imports.

## Automation

Rules with triggers, conditions, actions registered by every module, branches and `{{smart.values}}`; scoped to a workspace or project; run log with retries; templates; sandboxed JavaScript steps; a visual builder.

## Mail

Per-workspace outbound provider (SMTP, Mailgun, SES, Postmark, Resend) with MJML templates, queue, bounce and suppression handling; a per-user IMAP/SMTP (and Gmail/Microsoft OAuth) inbox with threads, compose, labels, search and links to objects; intake addresses that turn email into issues, candidates or leads.

## Calls

1:1 and group audio/video with screen share, started from chat, calendar or interviews; huddles in channels. Virtual office rooms and recording are *v1.x*.

## AI assistant

Bring your own key (OpenAI, Anthropic, OpenAI-compatible, Ollama): summaries, drafting, semantic search, an `@kern` bot, triage suggestions, resume parsing and an AI step for automations. Per-workspace keys and toggles; nothing leaves your instance unless configured.

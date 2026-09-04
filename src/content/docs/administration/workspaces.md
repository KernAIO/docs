---
title: Workspaces
description: Creating and managing workspaces, members, invitations and workspace settings.
---

A workspace is Kern's tenant. Every module's data belongs to exactly one workspace; users may belong to many.

## Creating a workspace

Any user can create a workspace (unless the instance restricts creation to admins). The creator becomes the **owner**. A workspace has a display name, a URL slug (`/w/<slug>/…`), an optional logo and colour, and a default locale/timezone.

## Members and roles

Each member has one built-in role:

| Role | Typical meaning |
|---|---|
| `owner` | Full control, including billing/ownership transfer and deletion. Always passes permission checks. |
| `admin` | Manage members, roles, modules, integrations, settings. |
| `member` | Day-to-day use of enabled modules. |
| `guest` | Access only to explicitly granted projects/channels/spaces; cannot see the member directory. |

Admins can additionally create **custom roles** (named sets of permission keys) and **groups** (sets of users) and bind them at different scopes — see [Roles & permissions](/administration/roles-permissions/).

## Invitations

Invite people by **email** (they receive a link; if they have no account they sign up first) or by **picking users you already share a workspace with** — no email round-trip needed. Invitations carry a role and optional group membership. Pending invitations can be resent or revoked.

Other ways in:

- **Join requests** — users can ask to join a workspace they discover; admins approve.
- **Domain auto-join** — users with a verified email on an allowed domain (`@acme.com`) join automatically with a default role.

## Workspace settings

- **General** — name, slug, branding, locale.
- **Members, Roles, Groups** — as above.
- **Modules** — enable/disable modules for this workspace; see [Modules](/administration/modules/).
- **Integrations** — outbound mail provider. Secrets are encrypted at rest with keys derived from `KERN_SECRET` and are never returned in full by the API.
- **Webhooks & API** — outgoing webhooks (signed), incoming webhook endpoints, workspace-scoped API tokens.
- **Audit log** — who changed what in the workspace (members, roles, settings, module toggles).
- **Import / Export** — importers (Jira, Linear, CSV) and a full workspace export.
- **Danger zone** — transfer ownership, archive (read-only, hidden from navigation), delete (after a grace period).

## Notifications across workspaces

Because identity is global, a user's notification inbox aggregates all workspaces with per-workspace badges in the workspace switcher. Notification preferences are per user and can be overridden per workspace.

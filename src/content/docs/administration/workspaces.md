---
title: Workspaces
description: Creating and managing workspaces, members, invitations and workspace settings.
---

A workspace is Kern's tenant. Every module's data belongs to exactly one workspace; users may belong to many.

## Creating a workspace

Any user can create a workspace, unless the instance sets `allowWorkspaceCreation` to `admins`. The
creator becomes the **owner**.

A workspace has a display name and a URL slug. The slug is the **first segment of every path**:
`/acme/settings`, `/acme/admin/updates`, `/acme/tracker`. There is no `/w/` prefix.

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

An invitation is the only way into a workspace today. There are no join requests: nothing in Kern
lets a user ask to join a workspace they have found.

**Domain auto-join is not built.** `workspaces.autoJoinDomains` is on the API and core stores what
you write there, but no sign-up path and no subscriber ever reads it, so nobody joins automatically.
The General settings page offered the field until it was taken out on 2026-09-05: a control that
saves, reads back and changes nothing teaches an administrator to stop sending invitations.

## Workspace settings

Open `/<slug>/settings`. Each entry appears only for members holding the permission beside it.

| Section | What it holds | Permission |
|---|---|---|
| **General** | Name, slug, description, the role a new member joins with, and **Archive** | `core.workspace.manage` |
| **Members** | Members, their roles, and pending invitations | `core.members.view` |
| **Roles** | Custom roles and their permission keys | `core.roles.manage` |
| **Groups** | Named sets of users, and their membership | `core.members.manage` |
| **Dashboard** | Which widgets the workspace's home page shows | `core.workspace.manage` |
| **Modules** | Switch modules and their capabilities on and off; see [Modules](/administration/modules/) | `core.modules.manage` |
| **Integrations** | Per-workspace integration configuration. Secrets are encrypted at rest with keys derived from `KERN_SECRET` and are never returned in full by the API. | `core.integrations.manage` |
| **MCP & AI access** | Switch MCP on, see connected AI clients, and manage API keys; see [Connect AI clients](/administration/mcp/) | `core.integrations.manage` |
| **Audit log** | Who changed what in the workspace | `core.audit.view` |

Each enabled module adds its own pages below these — **Email** from Mail, **Plan** from Billing, and
so on. Your own account settings (Profile, Security, Notifications, Appearance) sit in the same
place and are not workspace-scoped.

**Archive is the only destructive action in the interface**, and it needs
`core.workspace.delete`. An archived workspace becomes read-only and drops out of navigation.
Ownership transfer has no screen and no procedure. Scheduled deletion is on the API only —
`POST /api/core/workspaces/{workspaceId}/deletion`.

There is no **Webhooks & API** section and no **Import / Export** section. Outgoing webhooks are not
built at all. Importing is per module — Tracker imports CSV, Jira and Linear exports from its own
screens, and Quire imports a Notion export, a Confluence export or a folder of Markdown from its
own. Exporting a whole workspace is an API call; see
[Backups](/self-hosting/backups/#getting-a-workspace-out).

## Notifications across workspaces

Because identity is global, a user's notification inbox aggregates all workspaces with per-workspace badges in the workspace switcher. Notification preferences are per user and can be overridden per workspace.

---
title: Core concepts
description: Instances, workspaces, modules, permissions, notifications and the activity log — the vocabulary Kern uses everywhere.
---

A few ideas recur throughout Kern. Learning them once makes every module familiar.

## Instance

An **instance** is one Kern installation: one domain, one database, one set of users. An instance has **instance admins** who manage users, workspaces, enabled modules, the default outbound mail provider and limits from the admin console.

## Users and accounts

Identity is **global to the instance**. A user signs up once (email + password, magic link, Google/GitHub/Microsoft, passkeys, or SSO) and can be a member of many workspaces. Personal settings — locale, theme, notification preferences, API tokens — belong to the user, not to a workspace.

## Workspaces

A **workspace** is the tenant: a company, a team or a client. Almost all data (issues, channels, docs, employees, deals…) lives inside a workspace and is isolated from other workspaces by a `workspace_id` column and Postgres row-level security.

Workspaces have:

- **members** with a built-in role — `owner`, `admin`, `member` or `guest` — plus optional custom roles and groups;
- **modules** that can be enabled or disabled;
- **integrations & secrets** such as an SMTP/provider configuration, an AI key or LiveKit credentials, stored encrypted;
- branding, an audit log, import/export.

Invitations can be sent by email or by picking people from workspaces you already share with them. Guests are restricted to explicitly granted projects and channels.

## Modules

A **module** is a unit of functionality — `tracker`, `chat`, `docs`, `hr`, `mail`, … — packaged as an npm package that exports a `contract`, a `server` part and a `client` part. Modules declare their permissions, events, settings schema, object types, jobs and routes. A small set of modules is **core** and always enabled; everything else can be switched on or off per workspace. See [Modules](/administration/modules/) for the admin view and [Module development](/developers/module-development/) for the developer view.

## Permissions

Modules register **permission keys** shaped `<module>.<resource>.<action>` (for example `tracker.issue.edit`). A **role** is a set of keys. Roles and groups are **bound** at a scope — the whole workspace, a project, a space or a single object — and the nearest scope wins, with an explicit deny beating an allow at the same level. Owners and instance admins always pass. The full model is described in [Roles & permissions](/administration/roles-permissions/).

## Objects and object references

Anything a module owns — an issue, a document, a candidate — is an **object** identified by `module:type:id`. Object references power mentions, links, "object channels" in chat, notifications, search results and activity entries. Modules ship *presenters* so an issue renders the same way whether it appears in a chat message, a document or a notification.

## Notifications

Modules emit typed notifications. User preferences decide, per event type, whether they appear in-app, as a push notification or in an email digest. Notifications from **all workspaces** land in one inbox with per-workspace badges, over a single WebSocket connection.

## Activity log

Every change to an object is appended to an **activity stream**. It drives history views, feeds, automation triggers, outgoing webhooks and search indexing — one source of truth instead of five.

## Events and procedures

Services and modules talk through typed **events** (`<module>.<entity>.<action>`, published on NATS JetStream) and **procedures** (`kernel.call('<module>.<procedure>', input)`) that resolve in-process when the module is co-hosted and over NATS request/reply when it is not. This is what lets a module move between services without code changes.

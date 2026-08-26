---
title: Modules
description: Enabling, disabling and configuring modules per workspace.
---

Kern's features are delivered as **modules**. The build of Kern you run contains a fixed set of first-party modules; each workspace decides which of them are switched on.

## Core vs optional

| | Examples | Can be disabled? |
|---|---|---|
| **Core** | identity, workspaces, members, permissions, notifications, settings, files, search, activity | No — always enabled |
| **Optional** | tracker, chat, quire, drive, calendar, hr, recruit, crm, automation, mail, calls, ai, time | Yes, per workspace |

## Enabling and disabling

**Workspace settings → Modules** lists every module with its description, version and dependencies. Toggling a module:

- **On** — runs the module's `onWorkspaceEnabled` hook (seeding defaults, e.g. Tracker's default work-item types), registers its permissions to the built-in roles, shows its navigation and routes, and lets its jobs and search indexers run for this workspace.
- **Off** — hides navigation and routes, makes its API return `403 MODULE_DISABLED`, pauses its jobs, and excludes it from search. **Data is kept**; re-enabling restores everything.

A module that another enabled module depends on cannot be disabled first (e.g. `recruit` depends on `calendar` for interview scheduling).

## Module settings

Each module may declare a **settings schema**. Settings are edited under **Workspace settings → Modules → <module>** (or in the module's own settings page) and validated server-side. Secrets (provider credentials, API keys) live in the encrypted **Integrations** store rather than in plain settings.

## Instance-level defaults

Instance admins can set which modules are enabled by default for new workspaces, and can hide modules instance-wide.

## Versions

A module's version is the version of the package it ships in, and every module in an instance moves
with the platform: an upgrade replaces all of them at once. The modules list shows the version each
module currently reports, and — when a newer release is available and you are an instance admin —
where that release would move it.

A module can declare the oldest platform it runs on. When it does, the requirement is shown next to
it, and Kern refuses to start when the version it runs on does not satisfy it. First-party modules
rarely need this, because they are released together with everything else. It matters for a custom
build, where a module package and the images around it can move separately.

See [Upgrading](/self-hosting/upgrading/) for how to apply a release.

## Third-party modules

v1.0 ships **no runtime loading of third-party code**: the set of modules is fixed at build time for security and type safety. Third parties can still extend Kern through the public API, outgoing/incoming webhooks, OAuth apps and an iframe/web-component "remote UI" slot. Building your own module package and a custom build is supported and documented in [Module development](/developers/module-development/).

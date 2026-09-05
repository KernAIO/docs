---
title: Modules
description: Enabling, disabling and configuring modules per workspace.
---

Kern's features are delivered as **modules**. The build of Kern you run contains a fixed set of first-party modules; each workspace decides which of them are switched on.

## Core vs optional

| | Modules | Can be disabled? |
|---|---|---|
| **Core** | identity, workspaces, members, permissions, notifications, settings, files, search, activity | No — always enabled |
| **Optional** | `tracker`, `chat`, `quire`, `hr`, `mail`, `inventory`, `billing` | Yes, per workspace |

Those seven are what a Kern release contains. See
[Feature overview](/introduction/feature-overview/) for what each one does, and for the modules that
are planned and not built.

## Enabling and disabling

**Settings → Modules** lists every module with its description and version. Switching one:

- **On** — runs the module's `onWorkspaceEnabled` hook (seeding defaults, for example Tracker's
  default work-item types), registers its permissions to the built-in roles, shows its navigation and
  routes, and lets its jobs and search indexers run for this workspace.
- **Off** — hides navigation and routes, makes its API answer `403 MODULE_DISABLED`, pauses its jobs
  and excludes it from search. **Data is kept**; switching it back on restores everything.

A module may declare that it needs another one, and Kern then refuses to disable the one underneath
first. No first-party module declares such a dependency today.

## Capabilities

A module several customers want *different amounts* of splits itself into **capabilities** — named
sub-features a workspace switches independently. Open a module's row in **Settings → Modules** to
find them.

HR is the module built this way: one company wants a directory and nothing else, a second wants
leave and approvals, a third clocks people in at a factory gate. Each is the same module with a
different set of capabilities on.

Two rules make them safe to use:

- **A capability that is off answers 404, not 403.** Its navigation, settings, widgets and procedures
  are simply absent — because "you may not have this" is the wrong answer for a workspace that never
  asked for the feature.
- **Switching one off destroys nothing.** A capability is a flag, so anything that would need a
  migration to reverse is not one.

## Module settings

Each module may declare a **settings schema**. Settings are edited from the module's own page under
**Settings**, and validated on the server. Secrets — provider credentials, API keys — live in the
encrypted integrations store rather than in plain settings.

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

Kern loads **no third-party code at runtime**: the set of modules is fixed when the images are built,
for security and for type safety. A module of your own is a build argument, not a fork — see
[Module development](/developers/module-development/).

Without building an image, a third party can still reach Kern through the public API (OpenAPI 3.1
per module), workspace-scoped API keys and [MCP](/administration/mcp/). Webhooks are a module's own
affair in both directions, and there is no general endpoint or registry above them:

- **Incoming.** Mail and Billing accept one each, listed in
  [Webhooks](/developers/api-openapi/#incoming). Nothing lets a third party register another.
- **Outgoing.** Tracker's **Call webhook** workflow post-function calls a URL set on a transition,
  and it is the only thing in Kern that does. It is unsigned, and there is nowhere to register a URL
  for the workspace as a whole — see [Webhooks](/developers/api-openapi/#outgoing).

An embedded "remote UI" slot is not built.

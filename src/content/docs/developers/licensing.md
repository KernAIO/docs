---
title: Licensing
description: Which licence covers which part of Kern, what you may do with each, and why the split exists.
---

Kern uses two licences, split at one line.

**The framework is Apache-2.0. The product is AGPL-3.0-only.**

If you are writing a module, you only touch the framework, so your module is yours to licence however
you like. If you are running or changing Kern itself, the AGPL applies and your changes have to be
published.

## Apache-2.0 — the framework

Everything in the [`kernel`](https://github.com/KernAIO/kernel) repository, plus
[`module-template`](https://github.com/KernAIO/module-template), which is a repository of its own:

| Package | What it is |
|---|---|
| `@kernhq/kernel` | Module host, broker, auth, storage, events, jobs, HTTP |
| `@kernhq/contracts` | Contract types shared between modules and services |
| `@kernhq/sdk` | Typed client for the Kern API and realtime socket |
| `@kernhq/ui` | The Ink/paper design system components |
| `@kernhq/testing` | Test harness for module authors |
| `@kernhq/tsconfig` | Shared TypeScript configuration |
| `@kernhq/module-template` | The template you copy to start a module |
| `@kernhq/workflow` | Generic state-machine engine for modules |

## AGPL-3.0-only — the product

`shell`, `core`, `chat`, `mail`, `collab`, `docs`, the `app` umbrella, and the first-party modules
`module-tracker`, `module-chat`, `module-quire`, `module-hr`, `module-mail`, `module-billing` and
`module-inventory`.

Each repository's `LICENSE` file is authoritative. `shell` is the repository behind the container the
Compose file calls `app`.

## What you may do

**Run it.** Self-host Kern for any purpose, commercial or not, for as many people as you like. You owe
nothing and need no permission.

**Change it.** Modify any part. If you distribute your modified version, or let other people use it
over a network, the AGPL requires you to publish those changes under the AGPL.

**Run it for other people.** The licences govern the code, not what you may charge for running it —
see [Billing](/self-hosting/billing/). Two conditions: publish your modifications, and do not call it
Kern. The code is open; the name is not.

**Write modules.** Private, commercial, closed — all fine.

## Modules

A module talks to Kern through `@kernhq/kernel`, `@kernhq/contracts`, `@kernhq/sdk` and `@kernhq/ui`.
All four are Apache-2.0, so a module built on them is **not** a derivative work of the AGPL product.
Licence it however you want, including keeping it closed and selling it.

Start from `@kernhq/module-template`, which is Apache-2.0 for the same reason: a copyleft template
would impose its licence on every module copied from it.

Two things do not get you this freedom:

- **Changing the framework.** You may — it is Apache-2.0 — but you are then maintaining a fork.
- **Changing the product.** Edit `core`, `shell` or a first-party module and the AGPL applies to those
  changes.

See [Module development](/developers/module-development/) to start building.

## Contributing

Contributions are accepted under the [CLA](/contributing/cla/). Contribute to an Apache-2.0 package
and your contribution is Apache-2.0; contribute to an AGPL package and it is AGPL. The file you are
editing tells you which.

Dependencies must be MIT, Apache-2.0, BSD or ISC.

## Why the split

An all-AGPL project cannot have a healthy module ecosystem: every module would inherit the copyleft,
and no company would ship a closed internal module on top of it. An all-permissive project gives away
the hosted business for nothing. Splitting at the framework boundary gets both — anyone can build on
Kern, and anyone who hosts a modified Kern has to publish what they changed.

The full reasoning, including what was rejected, is in
[ADR 0005](https://github.com/KernAIO/app/blob/main/docs/adr/0005-licensing-and-the-module-boundary.md).
The canonical map is
[LICENSING.md](https://github.com/KernAIO/app/blob/main/LICENSING.md), and name usage is covered by
[TRADEMARK.md](https://github.com/KernAIO/app/blob/main/TRADEMARK.md).

---
title: Roles & permissions
description: Permission keys, built-in and custom roles, groups, scoped bindings and how checks are resolved.
---

Kern's authorization model is simple to explain and expressive enough for Jira-style per-project schemes.

## Permission keys

Every module **registers** the permissions it understands. Keys are three dot-separated segments:

```
<module>.<resource>.<action>
tracker.issue.create    tracker.project.manage    chat.channel.join
quire.page.publish      hr.leave.approve          core.workspace.manage
```

Each key declares a label, the **narrowest scope** it can be bound at (`workspace`, `project`, `space` or `object`), which built-in roles get it by default, and whether it is *dangerous* (shown with a warning in the UI).

Because modules own their keys, enabling a new module adds its permissions to the workspace automatically, pre-assigned to the built-in roles the module author chose.

## Built-in roles

`owner` ⊇ `admin` ⊇ `member` ⊇ `guest`. Defaults declared by modules cascade upward: anything a guest may do, a member may do, and so on. Owners — and instance admins — always pass every check.

## Custom roles and groups

Admins can create **custom roles**: named sets of keys, assigned to members *in addition to* their built-in role. **Groups** collect users (a team, a department); bindings can target a group instead of individual users.

## Bindings and scopes

A **binding** says: *subject* (user, group or built-in role) gets/loses *permissions* at *scope*.

| Scope | Example |
|---|---|
| `workspace` | "Support group may `tracker.issue.create` everywhere" |
| `project` | "Contractors may `tracker.issue.edit` in project KRN only" |
| `space` | "Everyone may `quire.page.view` in the Handbook space" |
| `object` | "Guest `alice` may `tracker.issue.comment` on issue KRN-42" |

Bindings can also **deny**.

## How a check is resolved

`can(user, 'tracker.issue.edit', scope)` evaluates as:

1. Instance admin → **allow**. Not an active member of the workspace → **deny**. Workspace owner → **allow**.
2. Walk the scope chain from **nearest to widest** (object → project/space → workspace). At the first level that has any binding mentioning this permission for the user (directly, via a group, or via their built-in role): if any of those bindings is a deny → **deny**, else → **allow**.
3. If no narrower binding matched, fall back to the **effective workspace set**: built-in role defaults ∪ custom-role permissions ∪ workspace-level bindings (with denies removed).

Two rules to remember: **nearest scope wins**, and **deny beats allow at the same level**.

Effective sets are cached per (user, workspace) and invalidated whenever a membership, role or binding changes, so changes apply within seconds across all services.

## Permission schemes (Tracker)

Tracker packages project-scope bindings as reusable **permission schemes** — a named set of "role/group → permissions" rows you can attach to many projects, mirroring Jira. Under the hood they are just project-scoped bindings.

## Guests

Guests have an empty effective set except for what is bound to them explicitly (or to the `guest` role) at project/space/object scope. They cannot list members or browse modules they have no binding in.

## In the UI and API

The client receives a snapshot of the user's effective permissions per workspace for conditional rendering; the server re-checks on every request. API errors are `403 FORBIDDEN` with `{ permission: '<key>' }` so clients can explain what is missing.

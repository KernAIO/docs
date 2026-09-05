---
title: Tracker
description: Issues and projects — work item types and hierarchy, custom fields, workflows, list and board views, KQL, cycles, triage, the public intake form, time tracking and reports.
---

Tracker is Kern's issue and project module. It is the largest module and the one the others are
measured against. This page describes what a workspace gets when it switches Tracker on; the
[module README](https://github.com/KernAIO/module-tracker#readme) describes how it is built.

## Projects and work items

- **Projects** have a key (`KRN`), a lead, members with a role (`admin`, `member`, `viewer`), an
  icon and a visibility — `workspace`, or `private` for members only. Issues get gapless keys like
  `KRN-123`.
- A project is created from a **template** — `software`, `kanban`, `simple` or `blank` — which
  seeds a workflow, the work item types and four views. An existing project can be saved as a
  template and new projects created from it.
- **Work item types** carry a hierarchy level — sub-item, standard, epic, initiative — and each
  workspace decides its own types, its own hierarchy rules and, per type, which fields show where.
- **Custom fields**: text, number, date, select and multi-select, user, label, URL, checkbox and
  relation. Field **layouts** per type decide what the issue form shows.

## Workflows

Each type follows a workflow: **statuses** with categories (backlog, to do, in progress, done,
cancelled, triage), **transitions** with **conditions** (who may take them) and **validators**
(what must be filled in first), and **approvals**. Workflow schemes map types to workflows per
project, and every status change records how long the issue sat in the previous status, which is
what the flow reports are computed from.

**Settings → Workflows** needs `tracker.workflow.manage` — owner and admin by default. It edits the
statuses, and it reads each transition's rules back as sentences: *Only the assignee*, *Sets the
resolution to "done"*, *Calls https://…*. It does not edit those rules and there is no graph editor,
so changing what a transition requires or does means sending the whole definition to
`PATCH /api/tracker/workflows/{id}`.

### Post-functions

Post-functions run when a transition runs. The ones that change the issue are written in the same
transaction as the status change, so a transition never half-applies:

| Post-function | What it does |
|---|---|
| Set a field | writes a value onto the issue |
| Assign | assigns the issue to whoever moved it, the reporter, a named person or nobody |
| Set the resolution | sets or clears the resolution — this is what stock workflows use to resolve an issue as *done* or *cancelled* |
| Notify | notifies the assignee, the reporter, the project lead, a role or a group |
| Create a sub-item | creates a sub-issue under the one being moved |
| **Call a webhook** | sends an HTTP request to a URL configured on the transition |
| Run automation rule | **nothing.** It waits on the [Automation](/modules/automation/) module, which is not built |

The webhook is the one that leaves your instance, so it is worth knowing what it will and will not
do. It is sent after the change is committed and cannot fail the transition — a broken endpoint is a
line in the log of the service hosting Tracker, not an error for the person who moved the issue. It
carries no signature, so a receiver has to authenticate it from a header you set on the
post-function. And it may only reach public addresses: `http` and `https` only, the hostname
resolved and refused if it lands on a loopback, private, link-local or reserved address, the socket
pinned to the address that was checked, redirects not followed. Full behaviour is in
[Webhooks](/developers/api-openapi/#outgoing).

## Issues

Title, rich-text description, assignees, reporter, priority, labels (with mutually exclusive
groups), components, versions, cycle, milestone, parent, estimate, start and due dates, custom
fields, watchers, **relations** (`blocks`, `relates`, `duplicates`, `clones`), threaded comments
with reactions, attachments, issue templates, **repeating issues**, sub-issues, bulk edit and
archiving. Keyboard-first: single-key shortcuts, ⌘K actions, inline editing.

## Views and KQL

**List** and **board** views (columns are statuses; swimlanes by assignee, priority or label).
Every view is a saved **KQL** query — a JQL-like language:

```
project = KRN AND status IN ("In progress", "In review") AND assignee = me() ORDER BY priority DESC
```

A filter builder writes KQL for you. Views are private, shared per project or shared across the
workspace, and pinning is per person. Calendar, timeline and spreadsheet layouts are declared in
the contract and not drawn yet.

## Planning and reports

Backlog ranking, **cycles** (starting one snapshots its scope; completing one carries unfinished
work into the next), milestones, versions and components. Reports: **burndown**, **velocity**,
**cumulative flow**, **created vs resolved** and **time**.

## Intake and triage

A **public intake form** per project, reachable by token, rate-limited and with a honeypot; what it
submits lands in the **triage queue**, where it is accepted into the workflow, declined or snoozed.

Email-to-issue is not built: the tracker exposes `issues.createFromEmail` for another module to call,
and nothing calls it yet. See [Mail](/modules/mail/).

## Time tracking

Worklogs against an issue, one running **timer** per person (starting a second stops the first),
estimate against logged, and the time report.

## Import

CSV, a Jira JSON export or a Linear JSON export, uploaded to Files first and mapped onto a project.

## Chat

Any issue can carry an **object channel** in Chat, so the discussion sits next to the work.

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
(what must be filled in first), and **approvals**. A **visual editor** draws the graph. Workflow
schemes map types to workflows per project, and every status change records how long the issue
sat in the previous status, which is what the flow reports are computed from.

Post-functions — set a field, assign, notify, call a webhook when a transition runs — are declared
in the model and not executed yet.

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

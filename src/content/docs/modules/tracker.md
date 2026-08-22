---
title: Tracker
description: Issues, projects, workflows, boards, sprints, KQL, reports and time tracking.
---

Tracker is Kern's issue and project management module — Jira's depth with Linear's speed. It is the largest module and sets the bar for the rest.

## Projects and work items

- **Projects** have a key (`KRN`), lead, members, icon and their own permission scheme. Issues get sequential keys like `KRN-123`.
- **Work-item types** are arranged in **hierarchy levels** — by default Initiative › Epic › Story / Task / Bug › Sub-task — and are fully customisable per workspace.
- **Custom fields**: text, number, date, select/multi-select, user, label, URL, checkbox, relation and a light formula field; **field layouts** per type decide what shows where.

## Workflows

Each type uses a workflow: **statuses** with categories (backlog, todo, in progress, done, cancelled, triage), **transitions** (from→to or global), **conditions** (who may transition), **validators** (required fields), **post-functions** (set field, assign, notify, webhook, create sub-item, run automation) and **approvals**. Workflow schemes map types to workflows per project. The same engine powers HR leave, recruiting pipelines and CRM deals.

## Issues

Title, rich-text description (Tiptap), assignees, reporter, priority, labels, components, versions/releases, estimates (points or time), start/due dates, relations (blocks / duplicates / relates / parent), watchers, threaded comments with reactions, attachments, links, templates, recurring issues, sub-issues, bulk edit. Keyboard-first: single-key shortcuts, ⌘K actions, inline editing. GitHub/GitLab branch and PR links are *v1.x*.

## Views

List, **Board** (scrum/kanban, columns ↔ statuses, WIP limits, swimlanes), Calendar, **Timeline/Gantt** with dependencies, and Spreadsheet. Views are saved queries in **KQL** — a JQL-like language:

```
project = KRN AND status IN ("In progress", "In review") AND assignee = me() ORDER BY priority DESC
```

A visual filter builder writes KQL for you. Personal views ("My issues", "Triage") and shared views per project.

## Planning and reporting

Backlog ranking, **cycles/sprints** with auto-roll and carry-over, milestones, releases, roadmap. Reports: burndown/burnup, velocity, cumulative flow, created vs resolved, time reports.

## Intake, triage, service desk

Triage queue, public forms, **email-to-issue** via the Mail module's intake addresses. Service-desk lite: queues (saved KQL), SLAs with goals and pause conditions, customer/organisation field. A full customer portal is *v1.x*.

## Time tracking

Worklogs, timers, estimates vs. logged, timesheets per user/project/week. Approvals are *v1.x*.

## Chat integration

Any issue can have an opt-in **object channel** in Chat; "Discuss in chat" from the issue, "Convert to issue" from a message.

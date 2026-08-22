---
title: Automation
description: Rules built from triggers, conditions, actions and branches; scheduled rules; sandboxed scripts.
---

Automation lets you encode process without code — and with code when you need it.

## Rules

A rule is **trigger → conditions → actions**, optionally with **branches**:

- **Triggers** (registered by modules): object created / updated / transitioned / commented, scheduled (cron), manual, incoming webhook, email received.
- **Conditions**: field compare, KQL match, user/group checks, compare values.
- **Actions** (registered by modules): edit field, transition, assign, comment, create object, send chat message, send email, call webhook, AI step, run script.
- **Branches**: for each sub-item / related item / KQL result.
- **Smart values** like `{{issue.key}}`, `{{actor.name}}`, `{{now | date:"YYYY-MM-DD"}}` in any text field.

Rules are scoped to a workspace or a project, have a **run log** with retries and idempotency, and can be created from **templates**. A visual builder shows the rule as a graph.

## Scripts

The "run script" action executes JavaScript in an isolated sandbox (`isolated-vm`) with CPU and memory limits and a capability-scoped API (only the objects and actions the rule's owner may touch).

## How it runs

Activity events flow over NATS to the automation evaluator (a worker). Scheduled triggers are pg-boss cron jobs. Because actions come from module registries, enabling a new module automatically extends what rules can do.

---
title: HR
description: People — the directory and org chart, offices and legal entities, holiday calendars, leave and accrual, approvals, attendance and rosters, documents, onboarding checklists, payroll export, reports and privacy.
---

The People module keeps everything a company records about the people in it — where they work,
who they report to, when they are off, when they clocked in, what they may be paid for, and who
has read their file. It appears in the rail as **People**. The
[module README](https://github.com/KernAIO/module-hr#readme) describes how it is built.

## Three products under one name

One company wants a directory and nothing else. A second wants leave, balances and approvals. A
third runs shift rosters and clocks people in at a factory gate. Each is a workspace with different
**capabilities** switched on in **Settings → People → Capabilities**. A capability that is off is
not greyed out — its navigation, settings, widgets and procedures are simply absent — and switching
one off destroys nothing.

| Capability | What it puts behind itself |
|---|---|
| **People** (always on) | The directory, employment records, departments, positions, reporting lines and the org chart. A person may have no account, and an account leaving the workspace keeps the record. |
| **Offices** | More than one place of work, each with a country, a time zone and its own holidays. |
| **Legal entities** | Several employing companies in one workspace; payroll periods and the payroll export are per entity. **Cost centres** sit behind the same switch. |
| **Holiday calendars** | Public holidays, closures and the working week. Country packs for Türkiye, Germany, the United Kingdom, the United States, the Netherlands and Iran, applied one year at a time. |
| **Leave** | Leave types (days, half days or hours; paid or not), balances as an append-only ledger, requests, a team calendar that says somebody is away without saying why, and approvals. |
| **Accrual** | Earn leave over time with proration, carry-forward and expiry, through a policy ladder — person, office, entity, org unit, workspace — with a preview computed by the same code as the run. Periods can follow the Persian calendar. |
| **Payroll periods** | Close a month so a filed payroll cannot move underneath it; a locked day refuses every write. |
| **Approval chains** | Named multi-step approvals with delegation, reminders, escalation and timeouts. |
| **Attendance** | Clock in and out, breaks, weekly schedules with grace and rounding, overnight shifts, a daily sheet with scheduled, worked, late, early-leave and overtime minutes, regularisations, auto-clock-out. |
| **Shift rosters** | Named shifts, a rotation as a cycle and an anchor date, people assigned out of phase, one-day overrides, and a coverage grid. |
| **Employee documents** | Contracts, identity documents and certificates against a person, held in Files. |
| **Onboarding and offboarding** | Checklist templates — each task, who it falls to, and when it is due relative to the hire date or last day. The default template starts itself when somebody is hired or offboarded; assignees are told, overdue tasks are chased once, the last tick closes the list. |
| **Payroll export** | A closed period as CSV per legal entity: identity, the period, employment facts and quantities in minutes and days. **Kern computes no pay.** |

Always on, and not capabilities: **custom fields** on a person (optionally *sensitive*), the
directory in the workspace-wide search, **reports** (attendance, overtime, absence, leave balances
— each stating its own denominator), and **privacy**: subject access as one bundle, erasure that
redacts what identifies a person and keeps what a wage or an entitlement was computed from,
retention horizons per class with a dry run, and a **sensitive access log** the subject can read
without asking. The retention sweep ships off and runs as a dry run first.

## Permissions

Forty-one keys. `hr.person.view` is a member default — everybody gets the directory card — and
`view_team`, `view_office` and `view_all` widen how much of each record comes back.
`hr.person.view_sensitive` is held by nobody by default and every read under it is logged.
`hr.privacy.manage` is granted to nobody by default.

## Not built

Performance reviews, and a calendar overlay of who is away — there is no Calendar module yet.

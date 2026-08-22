---
title: HR
description: Employees, org chart, leave and approvals, onboarding and documents.
---

The HR module keeps people data next to the work people do.

- **Employees** — profile, employment details, manager, department and position; linked to the user account when the person has one.
- **Org chart** (stored as an `ltree` path) with departments and positions; drag-and-drop reorganisation.
- **Leave** — leave types, balances and accruals, PTO requests with an approval workflow (the same workflow engine Tracker uses), a **holidays calendar** and work schedules; approved leave appears on the Calendar overlay and in Chat status.
- **Onboarding / offboarding** checklists with tasks assigned to people or roles.
- **Employee documents** (contracts, IDs) in Drive with restricted access.
- Attendance / check-in and performance reviews are *v1.x*.

Access is governed by HR permissions (`hr.employee.view`, `hr.leave.approve`, …) so sensitive fields stay with HR and managers.

---
title: Inventory
description: The asset register — what the company owns, who holds it, purchase and warranty, categories, custom fields, repairs, files and a full history.
---

Inventory is the register of what the company owns, item by item. Enable it per workspace in
**Settings → Modules**. The [module README](https://github.com/KernAIO/module-inventory#readme)
describes how it is built.

## Assets

An **asset** carries a tag the server assigns (`INV-0042` — the prefix and padding are a setting),
a name and description, a serial number, purchase date, vendor and price, a warranty expiry, a
location, a photo, a category and a status.

The **status** is one of `in_stock`, `assigned`, `under_repair`, `lost` and `retired`. Three are
derived: an open repair makes an item `under_repair`, a custodian makes it `assigned`, and neither
makes it `in_stock`. Two are things a person says — **mark it lost**, allowed while somebody still
holds it; and **retire it**, refused while somebody holds it or it is away for repair. Both are
undone by **reinstate**. Retired is not archived: a retired item stays in the list until somebody
archives it.

The **Assets** screen searches by name, tag or serial, filters by status and category, sorts, hides
archived rows until asked, and pages — all in one server query. Opening an asset slides a **detail
panel** over the list with up to five sections: **Details**, **Custody**, **Repairs**, **Files** and
**History**.

## Custody

Who is holding an item and who held it before. Hand it over, hand it on, or take it back — each is
one transaction that closes the open period, opens the next, and writes a line of history. Two
people handing the same item over at the same instant is settled by the database, and the one who
loses is told to reload. The person receiving an item is notified. When somebody **leaves** the
workspace, it gets a **return list** of what is still recorded as theirs; nothing is moved
automatically.

## Categories and custom fields

**Categories** group what a workspace owns, are ordered by dragging, and archive rather than delete.
Switching the module on seeds five — Laptops, Phones, Monitors, Furniture, Vehicles.

**Custom fields** are the workspace's own questions about an asset — a cost centre, a MAC address,
an insurance renewal: a key, a name, one of seven types, required or not, for every asset or only
for one category. Every value is checked on the server against its definition.

## Repairs and files

**Repairs** (a capability, on by default) record what went away to be fixed, to whom, what it cost
and when it came back; one repair may be open per item. **Files** (a capability, on by default) are
receipts, warranty cards and manuals kept against the asset or against one of its repairs; the
module records that a file exists and never holds a byte.

## History, search and notices

**History** is the asset's own timeline, read newest first, rendered as sentences. Assets are in the
workspace-wide search, so a tag read off a sticker finds the item from the command palette, and
`inventory:asset:<id>` resolves anywhere in the product into the tag, the name and a link.

Two **nightly notices**, each sent once per item: a warranty about to run out, and a repair that
has been away too long. Both windows are settings.

## Dashboard

Two cards: the most recently added assets, with how many there are, how many nobody is holding and
how many are away; and what is out for repair right now.

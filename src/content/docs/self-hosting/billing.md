---
title: Billing on your instance
description: Turn on billing, define plans, and charge for the workspaces on your Kern.
---

Kern ships a billing module in every image. It does nothing until you give it plans and a Stripe key.
Leave it alone and your instance stays what it is: unlimited seats, unlimited storage, every module,
no payment.

Turn it on and your instance can sell workspaces on itself.

## Before you start

You need:

- A Kern instance you administer. You must be an **instance administrator**, not only a workspace
  owner.
- A [Stripe](https://stripe.com) account. Use **test mode** until you are ready to take real money.

## 1. Add your Stripe keys

Open `.env` beside your `docker-compose.yml`.

Set these three values:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
KERN_DEFAULT_PLAN_SLUG=
```

`KERN_DEFAULT_PLAN_SLUG` is the plan a newly created workspace starts on. Leave it empty for now.
You will fill it in after step 3.

Restart the services:

```bash
docker compose up -d
```

**Result:** the billing screens stop saying that the instance cannot take payments.

## 2. Point Stripe at your instance

In the Stripe dashboard, create a webhook endpoint.

Set its URL to:

```
https://your-domain/api/billing/webhook
```

Subscribe it to these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and restart again.

**Result:** Stripe's webhook page shows a successful test delivery.

## 3. Create a plan

In Kern, open **Admin → Plans**. Select **New plan**.

Fill in the form:

| Field | What it does |
| --- | --- |
| Name, slug | The slug appears in URLs. No two plans may share one. |
| Price, currency, billed | The price is in whole currency units, so `8` is $8.00. |
| Charge per user | On, the price is per seat. Off, it is once for the whole workspace. |
| Trial days | How long a new subscription runs before the first charge. |
| Stripe price ID | The `price_…` object in Stripe. Without one, the plan cannot be bought — only assigned by an administrator. |

Under **What it includes**, set the limits. **An empty field means unlimited.**

- **Seats** — members who are not guests. Guests never consume a seat.
- **Storage (GB)** — total size of the workspace's files.
- **Audit log kept (days)** — how long audit entries survive.
- **Single sign-on** — whether the workspace may register an identity provider.

Select **Save**, then publish the plan from its row menu.

**Result:** the plan appears in **Admin → Plans** marked *Published*, and workspace owners see it on
their own billing screen.

## 4. Put new workspaces on it

Set `KERN_DEFAULT_PLAN_SLUG` in `.env` to the slug of the plan you created, then restart.

**Result:** a workspace created after this starts on that plan, on a trial if the plan has one.

## What each screen is for

**Admin → Subscriptions** is yours. It lists every workspace on the instance, what it uses and what
it pays. From a row you can change its plan, extend its trial, override its limits to comp an
account, suspend it, or open it in Stripe.

**Settings → Billing**, inside a workspace, belongs to that workspace's owner. It shows their plan,
their usage, their invoices, and the button that takes them to Stripe to change their card.

## What Kern does not do

Refunds, disputes, tax registration, dunning email and revenue reporting stay in the Stripe
dashboard. Kern links into it rather than reimplementing it.

## When a payment fails

Nothing closes immediately.

1. The subscription becomes **past due**. The workspace keeps working.
2. A grace period of 14 days runs. Stripe retries the payment during it.
3. If the grace period ends unpaid, the workspace becomes **suspended**.

A suspended workspace is **read-only**. Everyone can still sign in, read and export what is theirs.
Nothing is deleted. Paying, or resuming the workspace from **Admin → Subscriptions**, restores it.

## Operating Kern for others

The licences govern the code; they do not say what you may charge for running it. Two things are asked
of anyone operating Kern for other people:

- **Publish your changes.** If you modify Kern and let other people use it over a network, the AGPL
  requires you to offer them the source of your modified version. Running it unmodified asks nothing
  of you at all.
- **Use your own name.** The code is open; the name is not. Do not call your service Kern, Kern Cloud
  or anything a customer would read as us. See
  [TRADEMARK.md](https://github.com/KernAIO/kern/blob/main/TRADEMARK.md) for where the lines sit.

## Turning it off

Remove `STRIPE_SECRET_KEY` from `.env` and restart.

Plans and limits still apply — the instance simply cannot take a payment. To remove the limits as
well, set each workspace's plan to **No plan (unlimited)** in **Admin → Subscriptions**.

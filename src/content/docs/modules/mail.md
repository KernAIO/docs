---
title: Mail
description: Every email Kern sends — a provider per workspace, templates, a queue, a delivery log, bounces and suppression.
---

Every message Kern sends — the sign-in link, the invitation, the notification digest, anything a
module raises — goes through the `mail` service: one queue, one delivery log, one suppression list.
The Mail module is the workspace-facing half: which provider a workspace sends through, and the log
of what was sent.

## Providers

Each workspace sends through its own provider, or through the instance default
(`SMTP_URL` / `MAIL_FROM`) when it has not configured one — so a fresh install works with no setup.

| Provider | Configured with |
|---|---|
| SMTP | A host, a port and credentials |
| Mailgun | An API key and a domain |
| Amazon SES | An access key pair and a region |
| Postmark | A server token |
| Resend | An API key |

Secrets are encrypted before they are stored; a read returns a placeholder, and writing the
placeholder back keeps the stored secret unchanged. **Send test email** from the settings page
proves the configuration before anything depends on it.

## Sending

- **Templates** in MJML on a Kern base layout — invitation, magic link, verify email, reset
  password, notification digest, test — rendered to HTML with a plain-text fallback and the
  workspace's branding applied.
- A **queue** with retries and backoff; every send is a **delivery** row (`queued → sent →
  bounced / failed`) with what the provider said.
- **Provider webhooks** update delivery status and add **suppressions** on bounces and complaints.
  Nothing is sent to a suppressed address again. See [Provider webhooks](#provider-webhooks).
- A **delivery log** per workspace.

Other modules send by calling the `mail.send` procedure; none talks to a provider directly.

## Provider webhooks

A provider reports a bounce or a complaint by posting to Kern. Register this URL with it:

```
https://<your-domain>/api/mail/webhooks/<provider>?token=<MAIL_WEBHOOK_TOKEN>
```

`<provider>` is `mailgun`, `postmark`, `ses` or `resend`. The path is `webhooks`, plural; the
singular is a 404.

**`MAIL_WEBHOOK_TOKEN` is required.** A provider cannot present a Kern session, so the URL carries a
shared secret instead — and with none configured there is nothing anyone could prove, so `mail`
answers **401** to every webhook rather than trusting one.

That is the safe direction to fail in. This endpoint writes suppressions, and a suppression a
stranger wrote silently stops that person's password resets, magic links and invitations for good.
An open endpoint lets anyone permanently block any address on the instance; a refused one only stops
bounces being recorded.

A provider that sends custom headers can send `x-kern-webhook-token` instead of the query parameter.
`install.sh` generates the secret on a new install and `kern-upgrade.sh` fills one in for an instance
that predates it — so after that upgrade, re-point your provider at the URL above.

SES events arrive inside an Amazon SNS envelope, and Kern checks the SNS signature as well as the
token. A subscription confirmation makes this service fetch a URL out of the request body, so the URL
is checked against Amazon's own hostnames before anything leaves the process.

## Not built

- **Inbound mail.** There is no intake address and no email-to-issue: the tracker exposes a
  procedure for it, and nothing in the mail service receives a message to call it with.
- **A personal inbox** (IMAP/SMTP, Gmail or Microsoft accounts read inside Kern). The design is
  written down in the [mail repository](https://github.com/KernAIO/mail/tree/main/src/inbox); no
  code a customer can run exists.

---
title: Mail
description: Outbound email providers per workspace, templates, bounces and suppression, a personal IMAP/SMTP inbox and intake addresses.
---

The Mail module has two halves: **outbound** (how Kern sends email) and the **personal inbox** (how users read and send their own mail inside Kern). Both run in the `mail` service.

## Outbound

- **Providers** per workspace: SMTP, Mailgun, Amazon SES, Postmark, Resend — or `platform` to use the instance default (`SMTP_URL` / `MAIL_FROM`). Credentials are stored encrypted.
- **Templates** written in MJML with a Kern base layout (invitation, magic link, verify email, reset password, notification digest, test), rendered to HTML with a plain-text fallback; workspace branding applied.
- **Queue** with retries and backoff (pg-boss); every send is recorded as a **delivery** (`queued → sent → bounced/failed`).
- **Provider webhooks** (`/api/mail/webhooks/<provider>`) update delivery status and add **suppressions** on bounces and complaints; suppressed addresses are skipped on send.
- "Send test email" from the settings page, delivery log per workspace.

Other modules send mail by calling the `mail.send` procedure; they never talk to providers directly.

## Personal inbox

Users add their own **IMAP/SMTP** accounts (or Gmail / Microsoft via OAuth2):

- Folders, **threaded conversations**, compose / reply / forward, attachments (saved to Drive), labels, search.
- **Headers-first sync**: the service keeps one IDLE connection per active account (polling fallback), stores envelopes, flags, UIDs and MODSEQ in Postgres and fetches bodies on demand into an S3 cache.
- **Link email to objects** — issue, contact, candidate — and "Create issue from email".

## Intake

Plus-addressed **intake addresses** (`intake+<token>@your-domain`) route incoming mail into Tracker (email-to-issue), Recruiting (applications) or CRM (leads). Replies are threaded via `In-Reply-To` / `References`; `Message-ID` de-duplication avoids double processing.

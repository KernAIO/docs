---
title: Chat
description: Channels, direct messages, threads, object channels, presence, search — and the realtime gateway every other module uses.
---

Chat is Kern's team messaging module, and the `chat` service that hosts it also runs the
**realtime gateway** every other module uses for live updates.

## Conversations

- **Channels** — public, private, and **object channels** attached to an issue so the discussion
  lives next to the work.
- **Direct messages** and group messages.
- **Threads** on any message; reactions; `@user`, `@group` and `@channel` mentions.
- Sidebar **sections**, pins and bookmarks per channel, mute and per-channel notification level.

## Messages

Markdown-style formatting and code blocks, attachments from Files, edits and deletes, typing
indicators and presence. **Read state** is one number per membership — the last sequence read —
which is what keeps unread counts cheap.

Presence needs Valkey; without it presence is skipped rather than faked.

## Commands

Built-in **slash commands** in the composer.

Bots, incoming webhooks, huddles, channel export and cross-workspace shared channels are not built.

## Search

Full-text search over messages, scoped to the channels you can read, with filters for author,
channel, date and attachments.

## The realtime gateway

A client opens **one WebSocket** (`/ws`) regardless of how many workspaces it belongs to. The
gateway subscribes it to its workspaces and its private user channel; modules publish entity
changes, events, notifications, typing and presence through NATS, and the gateway fans them out.
The wire protocol is documented in [Realtime protocol](/developers/realtime-protocol/).

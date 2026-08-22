---
title: Chat
description: Channels, DMs, threads, object channels, presence and the realtime gateway.
---

Chat is Kern's team messaging module in the Mattermost/Slack mould, and the `chat` service also hosts the **realtime gateway** every other module uses for live updates.

## Conversations

- **Channels** — public, private, and **object channels** attached to an issue, project, candidate or deal so the discussion lives next to the work.
- **DMs and group DMs**.
- **Threads** on any message; reactions; `@user`, `@group`, `@channel` mentions.
- Sections and favourites in the sidebar; pins and bookmarks per channel.

## Messages

Markdown-style formatting, code blocks, file sharing with previews, link unfurls, edits and deletes, typing indicators, presence and custom status, mute and Do-Not-Disturb. **Read state** is tracked per channel (`last_read` + counters), which keeps unread badges cheap at scale.

## Actions and integrations

Slash commands, bots and incoming webhooks, message → issue / doc actions, "Discuss in chat" from objects, **huddles** (instant calls in a channel via the Calls module), channel export. Cross-workspace shared channels (Slack Connect style) are *v1.x*.

## Search

Full-text search over messages scoped to the channels you can read, with filters for author, channel, date and attachments.

## The realtime gateway

Clients open **one WebSocket** (`/ws`) to the chat service regardless of how many workspaces they belong to. The server subscribes them to their workspaces and private user channel; modules publish entity changes, events, notifications, typing and presence through NATS, and the gateway fans them out. The wire protocol is documented in [Realtime protocol](/developers/realtime-protocol/).

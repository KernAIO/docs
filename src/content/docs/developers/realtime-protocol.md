---
title: Realtime protocol
description: The WebSocket protocol between clients and the chat service's realtime gateway.
---

Clients keep **one WebSocket** to the chat service (`/ws`) for all workspaces. Messages are JSON, validated with Zod schemas from `@kernaio/contracts` (`ClientMessage`, `ServerMessage`).

## Client → server

| `t` | Fields | Meaning |
|---|---|---|
| `hello` | `token`, `clientId`, `since?` | authenticate; `since` = last seen `seq` to resume missed messages |
| `sub` | `channels[]` (≤ 500) | subscribe to channels (see naming below) |
| `unsub` | `channels[]` | unsubscribe |
| `typing` | `channelId`, `workspaceId`, `threadId?` | user is typing in a chat channel |
| `presence` | `status`: `online` / `away` / `dnd` / `offline` | set presence |
| `ack` | `seq` | acknowledge delivery up to `seq` |
| `ping` | — | keep-alive |

## Server → client

| `t` | Fields | Meaning |
|---|---|---|
| `welcome` | `userId`, `serverTime`, `resumed` | authenticated; `resumed` = replayed from `since` |
| `change` | `seq`, `workspaceId`, `change` | an entity changed — `change` is an `EntityChange` `{ module, entity, id, op: created/updated/deleted, patch?, scope? }`; clients invalidate or patch query caches |
| `event` | `seq`, `workspaceId?`, `name`, `payload` | a module event forwarded to clients |
| `notification` | `seq`, `notification` | a new notification for this user |
| `badge` | `workspaceId`, `unread`, `mentions` | unread counters for the workspace switcher |
| `typing` | `channelId`, `workspaceId`, `userId`, `threadId?`, `at` | someone is typing |
| `presence` | `userId`, `status`, `lastSeen?` | presence update |
| `error` | `code`, `message` | protocol/auth error |
| `pong` | — | reply to `ping` |

Messages carrying `seq` are monotonically numbered per connection so clients can detect gaps and resume.

## Channel naming

```
ws:<workspaceId>                  all entity changes in a workspace
ws:<workspaceId>:<module>:<id>    a specific object (e.g. an open issue)
chat:<channelId>                  a chat channel stream (messages, typing)
user:<userId>                     private: notifications, badges — auto-subscribed
```

The server automatically subscribes a connection to `user:<userId>` and to `ws:<id>` for each workspace the user belongs to; clients subscribe to object and chat channels as they open them.

## Server side

Modules never talk to sockets. They call `kernel.realtime.change(workspaceId, change)` / `toUser()` / `toChannel()`, which publish on NATS subjects `kern.rt.ch.<channel>` and `kern.rt.user.<userId>`; every gateway instance subscribes to `kern.rt.>` and fans out to its connected sockets. This is how multiple chat instances scale horizontally.

---
title: Calls
description: Audio/video calls, screen sharing and huddles powered by LiveKit.
---

:::caution[Planned. Not in a release yet.]
This page describes what the module will do. The `--profile calls` Compose profile starts a
LiveKit server, but no module places a call yet. See the
[roadmap](https://github.com/KernAIO/app/blob/main/ROADMAP.md).
:::

Calls are built on [LiveKit](https://livekit.io/) (Apache-2.0), started with the `--profile calls` Compose profile.

- **1:1 and group** audio/video from a chat conversation, a calendar event or a recruiting interview.
- **Screen share**, mute/camera controls, participant list, raise hand.
- **Huddles**: a lightweight always-available call inside a channel.
- Kern mints short-lived LiveKit room tokens after checking the user may join (channel membership, event attendance, interview panel).
- Virtual office rooms and recording are *v1.x*.

Configuration: `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` in `.env` and `livekit.yaml` for ports and TURN. Clients connect to LiveKit through the same domain (`wss://<domain>`) when the `calls` profile is enabled.

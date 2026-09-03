---
title: Connect AI clients (MCP)
description: Let people use Kern from Claude, Cursor or another AI client — what an admin switches on, what a user consents to, and how to disconnect an app again.
---

Connect AI clients (MCP)

Kern speaks the Model Context Protocol (MCP). When MCP is switched on for a workspace, members can
connect tools like Claude or Cursor and work with their projects, mail and documents through them.

What you get:

- Every module's API becomes a set of tools automatically. A module needs no MCP code of its own.
- Each connection works inside **one workspace**, with the permissions of the person who approved it.
- Access is per module: read-only, or read and change.

## What an admin does

MCP is off for every workspace until you switch it on. Turning it on changes nothing else — no data
moves, nobody is connected, and switching it off again makes the endpoint disappear until you turn it
back on.

1. Sign in to Kern as a workspace owner or admin.
2. Open **Settings → Modules**.
3. Find the **Core** row and open its capabilities.
4. Switch **MCP (AI access)** on.
5. Open **Settings → MCP & AI access**.
6. Check that the server URL on that page answers: copy it and open `<server-url>` in a browser. The
   browser cannot speak MCP, so it answers `405 Method Not Allowed`. That answer proves the endpoint
   is there and requires the right client.

Members also need `core.integrations.manage` to see the connected-apps list. Regular members do not
need any extra permission to connect their own AI client.

## What a member does

Each client is slightly different, but all of them ask for two things: the server URL and a sign-in.

1. In your AI client, add a new **remote MCP server**.
2. Paste the server URL from **Settings → MCP & AI access**. It ends in `/mcp`.
3. Start the connection. The client opens Kern in a browser.
4. If you are not signed in yet, sign in. You return to the consent screen.
5. Read the consent screen. It lists each module the client asks for, and whether it may read or also
   change data there.
6. Choose the workspace the client may work in.
7. Select **Allow**.

The client reconnects to Kern by itself and lists its tools. You are done.

The client receives a short-lived access token and renews it by itself. Your password never reaches
the client.

## What a token allows

A connection is narrower than your account, on purpose:

- **One workspace.** A tool call cannot touch another workspace, even one you are a member of.
- **Your permissions.** If you may not delete a work item in Kern, neither can the client.
- **The scopes you granted.** A client granted only read access sees no write tools at all.

## Disconnecting an app

Anyone can disconnect their own AI client at any time; admins can disconnect anybody's.

1. Open **Settings → MCP & AI access**.
2. Find the app under **Connected apps**.
3. Select **Revoke** next to the connection.
4. Confirm. All of that app's tokens stop working immediately.

If an admin switched MCP off while clients were connected, those clients fail silently against a
missing endpoint — nothing is deleted, and turning MCP back on restores them.

## For developers

Tools come from each module's OpenAPI document — the same one at `/api/<module>/openapi.json`.
Operation summaries become tool descriptions. See ADR 0011 (`docs/adr/0011-mcp-and-the-api-as-tools.md`
in the umbrella repository) for why the API surface and the tool surface are the same surface.

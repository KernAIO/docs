---
title: Connect AI clients (MCP)
description: Let people use Kern from Claude, Cursor or another AI client — what an admin switches on, what a user consents to, and how to disconnect an app again.
---

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

### If step 6 renders a web page instead

A `200` and Kern's own interface means the proxy is not routing MCP to `core`. Core serves `/mcp`
and the two OAuth discovery documents at the **root** of its app — the MCP and RFC 8414/9728
specifications fix those paths, so they cannot move under `/api` — and a proxy that routes only
`/api/*` sends them to the web app. Every stack shipped before 2026-09-05 did exactly that, so MCP
answered HTML on every self-host install, and an AI client reads that as a malformed discovery
document and gives up.

Bring the routes in on an existing instance:

```bash
cd ~/kern
./kern-upgrade.sh --stack-files
docker compose up -d caddy
```

**Result:** `curl -s -o /dev/null -w '%{http_code}\n' https://<your-domain>/mcp` prints `405`.

If the upgrade reports that it left your `Caddyfile` alone, you have edited it — merge the release's
diff by hand; see [Reverse proxy & TLS](/self-hosting/reverse-proxy-tls/#mcp-is-served-from-the-root-not-from-api).

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
Operation summaries become tool descriptions, so a module needs no MCP code and cannot expose a tool
its API does not already expose: the tool surface *is* the API surface, and every call goes back
through the same permission check, module gate and workspace scope an HTTP request does.

The workspace is not something the model chooses. It comes from the token the member approved, and
core writes it into the request itself — into `{workspaceId}` where the route has one, and into the
query string where it does not. See [API & OpenAPI](/developers/api-openapi/) for the surface both
share.

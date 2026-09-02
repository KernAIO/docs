---
title: AI assistant
description: Bring-your-own-key AI features — summaries, drafting, semantic search, the @kern bot and automation steps.
---

:::caution[Planned. Not in a release yet.]
This page describes what the module will do. No AI module ships today; what exists is the
[MCP server](/administration/mcp/), which lets an AI client you already use act on Kern. See the
[roadmap](https://github.com/KernAIO/app/blob/main/ROADMAP.md).
:::

AI in Kern is opt-in, per workspace, and uses **your** provider and keys. Nothing is sent to any model unless a workspace admin configures a provider.

## Providers

OpenAI, Anthropic, any OpenAI-compatible endpoint, or a local Ollama. Configure under **Workspace settings → Integrations → AI**: provider, API key, base URL (for compatible/Ollama), model, optional embedding model, and which features are enabled.

## Features

- **Summaries** of threads, issues, documents and email conversations.
- **Drafting**: issue descriptions from a title, replies in chat and mail, document outlines.
- **Semantic search** over indexed content using `pgvector` embeddings, blended into ⌘K results.
- **`@kern` bot** in chat: ask about the workspace ("what's blocking KRN-42?") with answers grounded in data the asking user may see.
- **Triage suggestions** (type, priority, assignee) for new issues; **resume parsing** in Recruiting.
- An **AI step** action in Automation rules.

## Data handling

Only the content needed for a request is sent to the configured provider; permission checks are applied before retrieval so the assistant never reveals data the user could not open themselves. Embeddings are stored in your Postgres. Per-workspace toggles let admins disable individual features.

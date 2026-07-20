# whatelz CLI

Token-efficient companion to the whatelz.ai HTTP MCP. Use it in **Claude Code** sessions to keep large read responses out of Claude's context (pipe to `jq`/`grep`). Claude.ai / Claude Desktop keep using the HTTP MCP directly.

Same backend, same verbs — the CLI is a thin wrapper that authenticates via the same Clerk-gated OAuth authorize page.

## Install

```bash
npm install -g whatelz
```

Or from this repo during dev:

```bash
cd cli && npm install && npm run build && npm link
```

## Login

```bash
whatelz login
```

Opens a browser to whatelz.ai, you click **Authorize**, token stashes at `~/.config/whatelz/token.json` (chmod 600). Valid ~30 days.

## Usage

```bash
whatelz verbs                                # list every MCP verb + description
whatelz whoami                               # confirm auth + ping the MCP
whatelz call testimonials.list_public        # call a verb, args default to {}
whatelz call dashboard.upsert_card --args '{"key":"foo","title":"Foo","body_markdown":"..."}'
whatelz logout                               # remove local token
```

Pipe to `jq` for token conservation:

```bash
whatelz call testimonials.list_public | jq '.[] | { id, headline, author_name }'
whatelz call dashboard.list_cards | jq '.[] | { key, updated_at }'
```

## Env

- `WHATELZ_ORIGIN` — override the target host (default `https://whatelz.ai`). Set to `http://localhost:3100` for local dev.

## Why this exists

Per the [MCP Verb and Auth Contract](https://emdee.tech/edmund/projects/MCP-VERB-AND-AUTH-CONTRACT) in EMDEE, each product targets dual-channel access:

- **CLI** for Claude Code (subprocess, pipes, token-efficient)
- **MCP** for Claude.ai / Desktop / mobile (only channel available)

Zero verb divergence: the CLI does not add commands the MCP lacks, and vice versa.

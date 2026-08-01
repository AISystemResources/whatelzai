# whatelz CLI

Token-efficient companion to the whatelz.ai HTTP MCP. Use it in **Claude Code** sessions to keep large read responses out of Claude's context (pipe to `jq`/`grep`). Claude.ai / Claude Desktop keep using the HTTP MCP directly.

Same backend, same verbs — the CLI is a thin wrapper that authenticates via the same Clerk-gated OAuth authorize page.

## Install

```bash
npm install -g @aisystemresources/whatelz
```

Or from this repo during dev:

```bash
cd cli && npm install && npm run build && npm link
```

## Login

```bash
whatelz login
```

Opens a browser to whatelz.ai, you click **Authorize**, an owner-scoped `auth_token` is issued and stashed at `~/.config/whatelz/credentials/default.json` (chmod 600). Tokens do not hard-expire — revoke manually via [/admin/tokens](https://whatelz.ai/admin/tokens) if compromised.

## Profiles

Every credential lives under a named profile. `default` is used unless you specify otherwise. Future service accounts (CMO/COO/CPO/CEO agents) get their own profile.

```bash
whatelz login --profile cmo             # log in as a separate profile
whatelz --profile cmo whoami            # use the cmo profile for one call
WHATELZ_PROFILE=cmo whatelz whoami      # or set for the session
whatelz profiles                        # list all local profiles
```

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

## Claude Code MCP registration

Register `whatelz` as a native MCP server in Claude Code by adding to your `.mcp.json`:

```json
{
  "mcpServers": {
    "whatelz": {
      "command": "whatelz",
      "args": ["mcp"]
    }
  }
}
```

For a scoped agent profile:

```json
{
  "mcpServers": {
    "whatelz-cmo": {
      "command": "whatelz",
      "args": ["--profile", "cmo", "mcp"]
    }
  }
}
```

Every whatelz verb then shows up in Claude Code's tool list. The stdio subcommand is a thin JSON-RPC proxy to the HTTP MCP — no protocol reimplementation, no drift.

## Env

- `WHATELZ_ORIGIN` — override the target host (default `https://whatelz.ai`). Set to `http://localhost:3100` for local dev.
- `WHATELZ_PROFILE` — override the active credential profile (default `default`).

## Why this exists

Per the [MCP Verb and Auth Contract](https://emdee.tech/edmund/projects/MCP-VERB-AND-AUTH-CONTRACT) in EMDEE, each product targets dual-channel access:

- **CLI** for Claude Code (subprocess, pipes, token-efficient, stdio MCP server)
- **HTTP MCP** for Claude.ai / Desktop / mobile (only channel available)

Zero verb divergence: the CLI does not add commands the MCP lacks, and vice versa.

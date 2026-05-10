# MCP Feature Flags Server — Runbook

## How It Works

Claude Code reads MCP server configuration from **two places**:

1. `.mcp.json` (project root) — defines the server spec for new connections
2. `~/.claude.json` (user config) — stores the **active** config per project path, populated when Claude Code first sets up the server via UI

> **Critical:** Claude Code uses `~/.claude.json` as the source of truth for reconnects, not `.mcp.json`.
> Changes to `.mcp.json` alone will NOT fix a broken connection — you must update `~/.claude.json` too,
> or delete the entry there so Claude Code re-reads `.mcp.json`.

---

## First-Time Setup

### 1. Build the server

The server is TypeScript. Claude Code runs the **compiled** `dist/server.js`, not the source.
You must build before the first use and after every change to `src/`:

```bash
cd mcp-feature-flags
npm install       # only needed once
npm run build     # compiles src/ → dist/
```

### 2. Verify the entry in `~/.claude.json`

Claude Code stores the server config under:
```
~/.claude.json → projects → /path/to/proshop_mern → mcpServers → feature-flags
```

Expected value:
```json
{
  "type": "stdio",
  "command": "/usr/local/opt/node@22/bin/node",
  "args": [
    "/Users/Veronica_Lapunka/Documents/git3/proshop_mern/mcp-feature-flags/dist/server.js"
  ],
  "env": {}
}
```

Key points:
- `command` must be the **absolute path** to `node` (not `npx`, not `node` bare string)
- `args[0]` must point to the **compiled** `dist/server.js`, not `src/server.ts`

To find your node path: `which node` or `which node@22`

### 3. Connect via /mcp

In Claude Code terminal: type `/mcp` → select `feature-flags` → **Reconnect**

---

## After Modifying Server Source (`src/`)

You must rebuild:

```bash
cd mcp-feature-flags && npm run build
```

Then reconnect: `/mcp` → **Reconnect**

---

## Diagnosing "Failed to reconnect"

### Check 1 — dist/ exists?

```bash
ls mcp-feature-flags/dist/
# Expected: helpers.js  server.js
```

If missing → run `npm run build`.

### Check 2 — node path is absolute?

```bash
python3 -c "
import json
with open('/Users/Veronica_Lapunka/.claude.json') as f:
    d = json.load(f)
cfg = d['projects']['/Users/Veronica_Lapunka/Documents/git3/proshop_mern']['mcpServers']['feature-flags']
print(cfg)
"
```

`command` must be an absolute path like `/usr/local/opt/node@22/bin/node`.
If it's just `"node"` or `"npx"`, Claude Code can't find it due to restricted PATH.

### Check 3 — server starts correctly?

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}\n' \
  | /usr/local/opt/node@22/bin/node mcp-feature-flags/dist/server.js 2>&1
```

Expected output: JSON with `"serverInfo":{"name":"feature-flags","version":"1.0.0"}}`

---

## Why `npx tsx` Fails in Claude Code

Claude Code spawns MCP processes with a restricted `PATH` that does not include
`/usr/local/opt/node@22/bin/` (Homebrew Node). This means:

- `npx` → not found
- `node` (bare) → not found
- `tsx` (bare) → not found

**Always use absolute paths** for `command` in `~/.claude.json`.

---

## Available Tools (4 total)

| Tool | Description | Modifies data |
|---|---|---|
| `list_features` | List all 25 feature flags (summary) | No |
| `get_feature_info` | Full detail for one flag incl. dependency states | No |
| `set_feature_state` | Change status: `Disabled` / `Testing` / `Enabled` | Yes |
| `adjust_traffic_rollout` | Change traffic % for a flag in `Testing` status | Yes |

---

## Quick Reference

```bash
# Rebuild after source changes
cd mcp-feature-flags && npm run build

# Test server manually
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}\n' \
  | /usr/local/opt/node@22/bin/node mcp-feature-flags/dist/server.js

# Reconnect in Claude Code
/mcp → feature-flags → Reconnect
```

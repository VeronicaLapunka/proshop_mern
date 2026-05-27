#!/usr/bin/env node
/**
 * HTTP Streamable MCP server for n8n integration.
 * Run alongside or instead of the stdio server:
 *   npm run dev:http   (port 3001 by default)
 *
 * n8n MCP Client config:
 *   Endpoint: http://localhost:3001/mcp
 *   Server Transport: HTTP Streamable
 *   Authentication: Bearer Token → value of MCP_API_KEY env var
 */
import http from "http";
import crypto from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import {
  toText,
  listFeatures,
  getFeatureInfo,
  setFeatureState,
  adjustTrafficRollout,
} from "./helpers.js";

const PORT = Number(process.env.MCP_HTTP_PORT) || 3001;

// Fail-fast: require MCP_API_KEY to be explicitly set — no hardcoded fallback.
// If unset the server must not start; a missing key is a misconfiguration, not a default.
if (!process.env.MCP_API_KEY) {
  console.error("FATAL: MCP_API_KEY environment variable is required but not set. Exiting.");
  process.exit(1);
}
const API_KEY = process.env.MCP_API_KEY;

function createMcpServer(): McpServer {
  const server = new McpServer({ name: "feature-flags", version: "1.0.0" });

  server.registerTool(
    "list_features",
    {
      description:
        "List all feature flags. Returns feature_id, name, status, traffic_percentage, last_modified for all flags.",
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async () => toText(listFeatures()),
  );

  server.registerTool(
    "get_feature_info",
    {
      description:
        "Get full details of a single feature flag by feature_id. Returns status, traffic_percentage, dependencies, rollout_strategy.",
      inputSchema: {
        feature_id: z
          .string()
          .describe("snake_case feature key, e.g. 'dark_mode'. Case-sensitive."),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ feature_id }) => toText(getFeatureInfo(feature_id)),
  );

  server.registerTool(
    "set_feature_state",
    {
      description:
        "Change feature status to Disabled, Testing, or Enabled. Updates traffic_percentage automatically.",
      inputSchema: {
        feature_id: z.string().describe("snake_case feature key, e.g. 'dark_mode'."),
        state: z
          .enum(["Disabled", "Testing", "Enabled"])
          .describe("Target status — exactly one of: Disabled, Testing, Enabled (case-sensitive)."),
      },
      annotations: { destructiveHint: false, idempotentHint: false },
    },
    async ({ feature_id, state }) => toText(setFeatureState(feature_id, state)),
  );

  server.registerTool(
    "adjust_traffic_rollout",
    {
      description:
        "Change traffic_percentage for a feature in Testing status. Use for canary steps (5→25→50→100%).",
      inputSchema: {
        feature_id: z
          .string()
          .describe("snake_case feature key. Feature MUST be in Testing status."),
        percentage: z
          .number()
          .int()
          .min(0)
          .max(100)
          .describe("Whole integer 0–100 inclusive."),
      },
      annotations: { destructiveHint: false, idempotentHint: false },
    },
    async ({ feature_id, percentage }) =>
      toText(adjustTrafficRollout(feature_id, percentage)),
  );

  return server;
}

const httpServer = http.createServer(async (req, res) => {
  // Auth check
  const auth = req.headers["authorization"] ?? req.headers["x-api-key"] ?? "";
  const token = String(auth).replace(/^Bearer\s+/i, "");
  const tokenBuf = Buffer.from(token);
  const keyBuf = Buffer.from(API_KEY);
  const valid = tokenBuf.length === keyBuf.length && crypto.timingSafeEqual(tokenBuf, keyBuf);
  if (!valid) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  if (req.url === "/mcp" || req.url?.startsWith("/mcp?")) {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const mcpServer = createMcpServer();
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", server: "feature-flags-mcp-http" }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

httpServer.listen(PORT, () => {
  console.log(`MCP HTTP server running on http://localhost:${PORT}/mcp`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`API key: ${API_KEY.slice(0, 4)}${"*".repeat(Math.max(0, API_KEY.length - 4))} (set via MCP_API_KEY env var)`);
});

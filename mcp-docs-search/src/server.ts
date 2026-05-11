#!/usr/bin/env node
/**
 * mcp-docs-search/src/server.ts
 *
 * MCP server exposing one tool: search_project_docs
 * Wraps the Qdrant vector-similarity search from Part 2 (scripts/search.ts).
 *
 * Dev:   cd mcp-docs-search && npm run dev
 * Prod:  npm run build && npm start
 *
 * Config (env or defaults):
 *   OLLAMA_URL        = http://localhost:11434
 *   OLLAMA_MODEL      = nomic-embed-text
 *   QDRANT_URL        = http://localhost:6333
 *   QDRANT_COLLECTION = proshop_docs
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchDocs, type Chunk } from "./search.js";

const server = new McpServer({ name: "docs-search", version: "1.0.0" });

// ── Tool: search_project_docs ────────────────────────────────────────────────

server.registerTool(
  "search_project_docs",
  {
    description: `
CALL THIS TOOL FIRST whenever the user asks anything about the proshop_mern
product: architecture decisions, feature descriptions, API contracts, runbooks,
incident reports, glossary terms, dev history, ADRs, or any "how does X work"
question about the codebase.

Returns the top-K most semantically relevant documentation chunks from the
Qdrant vector index (collection: proshop_docs). Each chunk includes:
  • source_file      — filename (e.g. "auth.md", "deploy.md")
  • file_path        — repo-relative path (e.g. "docs/project-data/features/auth.md")
  • title            — document title
  • parent_headings  — breadcrumb trail of ancestor headings (e.g. ["Auth", "JWT Flow"])
  • score            — cosine similarity 0–1 (higher = more relevant)
  • snippet          — ~200-char plain-text excerpt

WHEN TO CALL:
  • User asks about product functionality, architecture, API endpoints, features,
    payments, auth, cart, admin, orders, catalog, shipping.
  • User asks about operational knowledge: deploy steps, DB seed/reset, local setup,
    feature-flag toggle runbook, incident response procedure.
  • User asks about past incidents (e.g. PayPal double charge, JWT secret leak).
  • User asks about a glossary term or abbreviation used in ProShop docs.
  • User asks "how does X work" or "where is X documented".

WHEN NOT TO CALL:
  • Current live state of a feature flag → use the feature-flags MCP tool
    get_feature_info instead (it reads the live features.json, not static docs).
  • Real-time metrics, logs, or runtime data — those are not in the vector index.
  • Purely general programming questions unrelated to this codebase.

CAVEATS:
  • Requires Ollama (nomic-embed-text) and Qdrant to be running locally.
  • If either service is down, the tool returns { error, message } — report it,
    do not retry silently.
  • top_k > 10 is allowed but rarely useful; default 5 covers most questions.
  • Results are ranked by semantic similarity, not recency or authority.

EXAMPLES:
1. "How does JWT auth work in ProShop?"
   → search_project_docs({ query: "JWT authentication flow", top_k: 5 })

2. "Walk me through the deploy runbook."
   → search_project_docs({ query: "deploy runbook steps production", top_k: 5 })

3. "What happened in the PayPal double-charge incident?"
   → search_project_docs({ query: "PayPal double charge incident", top_k: 3 })

4. "Explain the cart architecture."
   → search_project_docs({ query: "cart architecture Redux state", top_k: 5 })

5. "What feature flags exist?" → DO NOT call this tool; call list_features
   (feature-flags MCP) — that reads the live flags, not the docs index.
`.trim(),
    inputSchema: {
      query: z
        .string()
        .min(1)
        .describe(
          "Natural-language search query. Be specific — include entity names, " +
          "action verbs, and domain terms (e.g. 'JWT token refresh', " +
          "'Stripe webhook handler', 'MongoDB connection pool runbook').",
        ),
      top_k: z
        .number()
        .int()
        .min(1)
        .max(20)
        .default(5)
        .describe(
          "Number of chunks to return (1–20, default 5). Use 3 for precise " +
          "lookups, 8–10 for broad survey questions.",
        ),
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  async ({ query, top_k }) => {
    let chunks: Chunk[];
    try {
      chunks = await searchDocs(query, top_k ?? 5);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: "SEARCH_FAILED", message: msg }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(chunks, null, 2),
        },
      ],
    };
  },
);

// ── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);

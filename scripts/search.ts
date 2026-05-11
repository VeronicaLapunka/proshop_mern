#!/usr/bin/env tsx
/**
 * scripts/search.ts — Vector similarity search over proshop_docs Qdrant collection
 *
 * Usage (CLI):
 *   cd scripts && npx tsx search.ts "your query" [--top 5] [--filter source_file=auth.md]
 *
 * Programmatic:
 *   import { search } from "./search.ts"
 *   const results = await search("query text", { topK: 5, filter: { source_file: "auth.md" } })
 *
 * Config (env or defaults):
 *   OLLAMA_URL        = http://localhost:11434
 *   OLLAMA_MODEL      = nomic-embed-text
 *   QDRANT_URL        = http://localhost:6333
 *   QDRANT_COLLECTION = proshop_docs
 */

import { QdrantClient } from "@qdrant/qdrant-js";

// ── Config ─────────────────────────────────────────────────────────────────

const OLLAMA_URL   = process.env.OLLAMA_URL   ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "nomic-embed-text";
const QDRANT_URL   = process.env.QDRANT_URL   ?? "http://localhost:6333";
const COLLECTION   = process.env.QDRANT_COLLECTION ?? "proshop_docs";

const qdrant = new QdrantClient({ url: QDRANT_URL });

// ── Types ──────────────────────────────────────────────────────────────────

export interface SearchFilter {
  /** Exact match on any payload field, e.g. { source_file: "auth.md" } */
  [field: string]: string | string[];
}

export interface SearchResult {
  score:           number;
  text:            string;
  source_file:     string;
  file_path:       string;
  title:           string;
  parent_headings: string[];
  keywords:        string[];
  summary:         string;
  chunk_index:     number;
  token_count:     number;
}

// ── Embed ──────────────────────────────────────────────────────────────────

async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, input: [text] }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json() as { embeddings: number[][] };
  return data.embeddings[0];
}

// ── Build Qdrant filter ────────────────────────────────────────────────────

function buildFilter(filter?: SearchFilter) {
  if (!filter || Object.keys(filter).length === 0) return undefined;

  const must: unknown[] = [];
  for (const [field, value] of Object.entries(filter)) {
    if (Array.isArray(value)) {
      // match any of several exact values
      must.push({ key: field, match: { any: value } });
    } else {
      must.push({ key: field, match: { value } });
    }
  }
  return { must };
}

/** Returns filter that matches chunks whose file_path contains any of the given folder names */
export function folderFilter(folder: string): SearchFilter {
  // Enumerate known source files belonging to that logical folder
  // Qdrant doesn't support substring match without a text index, so we filter by source_file
  const FOLDER_MAP: Record<string, string[]> = {
    incidents: [
      "i-001-paypal-double-charge.md",
      "i-002-mongo-connection-pool-exhaustion.md",
      "i-003-jwt-secret-leak.md",
    ],
    runbooks: [
      "ab-test-setup.md", "db-seed-and-reset.md", "deploy.md",
      "feature-flag-toggle.md", "incident-response.md", "local-setup.md",
    ],
    features: [
      "admin.md", "auth.md", "cart.md", "catalog.md", "checkout.md", "payments.md",
    ],
    api: ["auth.md", "orders.md", "products.md", "uploads.md", "users.md"],
    pages: [
      "INDEX.md", "admin-orders.md", "admin-product-edit.md", "admin-products.md",
      "admin-user-edit.md", "admin-users.md", "cart.md", "home.md", "login.md",
      "order.md", "payment.md", "place-order.md", "product.md", "profile.md",
      "register.md", "shipping.md",
    ],
  };
  const files = FOLDER_MAP[folder];
  if (!files) throw new Error(`Unknown folder: ${folder}. Known: ${Object.keys(FOLDER_MAP).join(", ")}`);
  // For source files that are unique, filter by source_file; folders with ambiguous names use file_path
  return { file_path: files.map(f => `docs/project-data/${folder}/${f}`) };
}

// ── Main search function ───────────────────────────────────────────────────

export async function search(
  query: string,
  options: { topK?: number; filter?: SearchFilter } = {}
): Promise<SearchResult[]> {
  const { topK = 5, filter } = options;

  const vector = await embed(query);

  const response = await qdrant.search(COLLECTION, {
    vector,
    limit: topK,
    with_payload: true,
    score_threshold: 0.0,
    ...(filter ? { filter: buildFilter(filter) } : {}),
  });

  return response.map(hit => {
    const p = hit.payload as Record<string, unknown>;
    return {
      score:           Math.round((hit.score as number) * 10000) / 10000,
      text:            (p.text as string) ?? "",
      source_file:     (p.source_file as string) ?? "",
      file_path:       (p.file_path as string) ?? "",
      title:           (p.title as string) ?? "",
      parent_headings: (p.parent_headings as string[]) ?? [],
      keywords:        (p.keywords as string[]) ?? [],
      summary:         (p.summary as string) ?? "",
      chunk_index:     (p.chunk_index as number) ?? 0,
      token_count:     (p.token_count as number) ?? 0,
    };
  });
}

// ── CLI ────────────────────────────────────────────────────────────────────

function printResults(query: string, results: SearchResult[]) {
  console.log(`\n${"═".repeat(72)}`);
  console.log(`Query: "${query}"`);
  console.log("═".repeat(72));

  if (results.length === 0) {
    console.log("  (no results)");
    return;
  }

  results.forEach((r, i) => {
    console.log(`\n[${i + 1}] score=${r.score}  ${r.source_file}  (chunk #${r.chunk_index})`);
    console.log(`    title: ${r.title}`);
    console.log(`    path:  ${r.file_path}`);
    console.log(`    heads: ${r.parent_headings.join(" › ")}`);
    console.log(`    keys:  ${r.keywords.slice(0, 6).join(", ")}`);
    console.log(`    summary: ${r.summary.slice(0, 140)}${r.summary.length > 140 ? "…" : ""}`);
    // First 300 chars of text
    const snippet = r.text.replace(/\n+/g, " ").slice(0, 300);
    console.log(`    text:  ${snippet}${r.text.length > 300 ? "…" : ""}`);
  });
  console.log();
}

async function cli() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help") {
    console.log('Usage: npx tsx search.ts "query" [--top N] [--filter field=value]');
    process.exit(0);
  }

  const query = args[0];
  const topK = (() => {
    const i = args.indexOf("--top");
    return i !== -1 ? parseInt(args[i + 1], 10) : 3;
  })();
  const filter: SearchFilter = {};
  let folderArg: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--filter" && args[i + 1]?.includes("=")) {
      const [k, v] = args[i + 1].split("=");
      filter[k] = v;
    }
    if (args[i] === "--folder") folderArg = args[i + 1];
  }

  const resolvedFilter = folderArg
    ? folderFilter(folderArg)
    : Object.keys(filter).length ? filter : undefined;

  const results = await search(query, { topK, filter: resolvedFilter });
  printResults(query, results);
}

cli().catch(err => { console.error("ERROR:", err); process.exit(1); });

#!/usr/bin/env tsx
/**
 * scripts/embed.ts
 *
 * Ingestion pipeline: docs/chunks.jsonl → Ollama (nomic-embed-text) → Qdrant
 *
 * Method:
 *   1. Read all chunks from JSONL
 *   2. Embed via Ollama /api/embed in concurrent batches (CONCURRENCY × BATCH_SIZE texts at once)
 *   3. Upsert points to Qdrant with full metadata payload
 *   4. IDs are deterministic (djb2 hash of file_path::chunk_index) → safe to re-run (idempotent)
 *
 * Usage:
 *   cd scripts && npx tsx embed.ts
 *   cd scripts && npx tsx embed.ts --dry-run      # embed only, skip upsert
 *   cd scripts && npx tsx embed.ts --batch 8      # texts per Ollama request (default 8)
 *   cd scripts && npx tsx embed.ts --concurrency 4 # parallel Ollama requests (default 4)
 *
 * Config (env or defaults):
 *   OLLAMA_URL        = http://localhost:11434
 *   OLLAMA_MODEL      = nomic-embed-text
 *   QDRANT_URL        = http://localhost:6333
 *   QDRANT_API_KEY    = (empty for local)
 *   QDRANT_COLLECTION = proshop_docs
 *   CHUNKS_FILE       = ../docs/chunks.jsonl
 */

import * as fs from "node:fs";
import * as readline from "node:readline";
import * as path from "node:path";
import { QdrantClient } from "@qdrant/qdrant-js";

// ── Config ─────────────────────────────────────────────────────────────────

const OLLAMA_URL   = process.env.OLLAMA_URL   ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "nomic-embed-text";
const QDRANT_URL   = process.env.QDRANT_URL   ?? "http://localhost:6333";
const QDRANT_API_KEY  = process.env.QDRANT_API_KEY;
const COLLECTION   = process.env.QDRANT_COLLECTION ?? "proshop_docs";
const CHUNKS_FILE  = process.env.CHUNKS_FILE ??
  path.resolve(path.dirname(new URL(import.meta.url).pathname), "../docs/chunks.jsonl");

const args = process.argv.slice(2);
const DRY_RUN     = args.includes("--dry-run");
const RESUME      = args.includes("--resume");
const BATCH_SIZE  = argInt(args, "--batch",       8);
const CONCURRENCY = argInt(args, "--concurrency", 1);

function argInt(a: string[], flag: string, def: number): number {
  const i = a.indexOf(flag);
  return i !== -1 ? parseInt(a[i + 1], 10) : def;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface ChunkMetadata {
  source_file: string; file_path: string; title: string;
  parent_headings: string[]; keywords: string[]; summary: string;
  language: string; chunk_index: number; token_count: number;
}
interface Chunk { text: string; metadata: ChunkMetadata; }

// ── Ollama embed ───────────────────────────────────────────────────────────

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { embeddings: number[][] }).embeddings;
}

// ── Load chunks ────────────────────────────────────────────────────────────

async function loadChunks(filePath: string): Promise<Chunk[]> {
  const chunks: Chunk[] = [];
  const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
  for await (const line of rl) { const t = line.trim(); if (t) chunks.push(JSON.parse(t)); }
  return chunks;
}

// ── Stable ID ─────────────────────────────────────────────────────────────

function stableId(filePath: string, chunkIndex: number): number {
  const s = `${filePath}::${chunkIndex}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h === 0 ? 1 : h;
}

// ── Progress ───────────────────────────────────────────────────────────────

function makeProgress(total: number) {
  const start = Date.now(); let done = 0; let errors = 0;
  return {
    tick(n: number) {
      done += n;
      const elapsed = (Date.now() - start) / 1000;
      const rate    = done / elapsed;
      const eta     = rate > 0 ? Math.ceil((total - done) / rate) : Infinity;
      const etaStr  = eta === Infinity ? "∞" : `${eta}s`;
      process.stderr.write(
        `\r[embed] ${done}/${total} (${((done/total)*100).toFixed(1)}%)  ` +
        `rate=${rate.toFixed(2)}/s  ETA=${etaStr}  errors=${errors}   `
      );
    },
    error() { errors++; },
    finish() {
      const s = ((Date.now()-start)/1000).toFixed(1);
      process.stderr.write(`\n[embed] Done in ${s}s. Errors: ${errors}\n`);
    },
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.error(`[embed] Chunks: ${CHUNKS_FILE}`);
  const chunks = await loadChunks(CHUNKS_FILE);
  console.error(`[embed] Loaded ${chunks.length} chunks`);
  console.error(`[embed] Model: ${OLLAMA_MODEL}  batch=${BATCH_SIZE}  concurrency=${CONCURRENCY}`);
  console.error(`[embed] Qdrant: ${QDRANT_URL}  collection: ${COLLECTION}`);
  if (DRY_RUN) console.error("[embed] DRY RUN — skipping upsert");

  // Detect vector dim
  const [probe] = await embedBatch([chunks[0].text]);
  const VECTOR_DIM = probe.length;
  console.error(`[embed] Vector dim: ${VECTOR_DIM}`);

  const qdrant = new QdrantClient({
    url: QDRANT_URL,
    ...(QDRANT_API_KEY ? { apiKey: QDRANT_API_KEY } : {}),
  });

  if (!DRY_RUN) {
    const { collections } = await qdrant.getCollections();
    if (!collections.some(c => c.name === COLLECTION)) {
      console.error(`[embed] Creating collection "${COLLECTION}" dim=${VECTOR_DIM}`);
      await qdrant.createCollection(COLLECTION, {
        vectors: { size: VECTOR_DIM, distance: "Cosine" },
      });
    } else {
      console.error(`[embed] Reusing existing collection "${COLLECTION}"`);
    }
  }

  // Resume: fetch existing IDs from Qdrant, skip already-ingested chunks
  let pending = chunks;
  if (RESUME && !DRY_RUN) {
    console.error("[embed] Resume mode: fetching existing IDs from Qdrant...");
    const existingIds = new Set<number>();
    let offset: number | null = null;
    do {
      const body: Record<string, unknown> = { limit: 256, with_payload: false, with_vector: false };
      if (offset !== null) body.offset = offset;
      const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points/scroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { result: { points: { id: number }[]; next_page_offset: number | null } };
      for (const p of data.result.points) existingIds.add(p.id);
      offset = data.result.next_page_offset;
    } while (offset !== null);

    pending = chunks.filter(c => !existingIds.has(stableId(c.metadata.file_path, c.metadata.chunk_index)));
    console.error(`[embed] Existing: ${existingIds.size}  Pending: ${pending.length}`);
  }

  // Split chunks into windows of BATCH_SIZE; process CONCURRENCY windows at once
  const batches: Chunk[][] = [];
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    batches.push(pending.slice(i, i + BATCH_SIZE));
  }

  const progress = makeProgress(pending.length);

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const window = batches.slice(i, i + CONCURRENCY);

    await Promise.all(window.map(async (batch) => {
      let vectors: number[][];
      try {
        vectors = await embedBatch(batch.map(c => c.text));
      } catch (err) {
        console.error(`\n[embed] Embed error: ${err}`);
        progress.error();
        progress.tick(batch.length);
        return;
      }

      if (!DRY_RUN) {
        const points = batch.map((chunk, j) => ({
          id:     stableId(chunk.metadata.file_path, chunk.metadata.chunk_index),
          vector: vectors[j],
          payload: {
            text:            chunk.text,
            source_file:     chunk.metadata.source_file,
            file_path:       chunk.metadata.file_path,
            title:           chunk.metadata.title,
            parent_headings: chunk.metadata.parent_headings,
            keywords:        chunk.metadata.keywords,
            summary:         chunk.metadata.summary,
            language:        chunk.metadata.language,
            chunk_index:     chunk.metadata.chunk_index,
            token_count:     chunk.metadata.token_count,
          },
        }));
        try {
          await qdrant.upsert(COLLECTION, { wait: true, points });
        } catch (err) {
          console.error(`\n[embed] Qdrant upsert error: ${err}`);
          progress.error();
        }
      }

      progress.tick(batch.length);
    }));
  }

  progress.finish();

  if (!DRY_RUN) {
    const info = await qdrant.getCollection(COLLECTION);
    console.error(
      `[embed] Collection "${COLLECTION}": ${info.points_count} points, status=${info.status}`
    );
  }
}

main().catch(err => { console.error("[embed] FATAL:", err); process.exit(1); });

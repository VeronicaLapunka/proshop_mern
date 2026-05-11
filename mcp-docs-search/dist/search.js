/**
 * mcp-docs-search/src/search.ts
 *
 * Core search logic: embed query via Ollama → nearest-neighbour lookup in Qdrant.
 * Adapted from scripts/search.ts — same config env-vars, same collection schema.
 *
 * Config (env or defaults):
 *   OLLAMA_URL        = http://localhost:11434
 *   OLLAMA_MODEL      = nomic-embed-text
 *   QDRANT_URL        = http://localhost:6333
 *   QDRANT_COLLECTION = proshop_docs
 */
import { QdrantClient } from "@qdrant/qdrant-js";
// ── Config ──────────────────────────────────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "nomic-embed-text";
const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const COLLECTION = process.env.QDRANT_COLLECTION ?? "proshop_docs";
const qdrant = new QdrantClient({ url: QDRANT_URL });
// ── Embed ────────────────────────────────────────────────────────────────────
async function embed(text) {
    const res = await fetch(`${OLLAMA_URL}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: OLLAMA_MODEL, input: [text] }),
    });
    if (!res.ok) {
        throw new Error(`Ollama embed failed ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return data.embeddings[0];
}
// ── Snippet extraction ───────────────────────────────────────────────────────
/** Strip markdown syntax and return the first ~200 chars of clean prose. */
function makeSnippet(text, maxLen = 200) {
    let s = text
        .replace(/```[\s\S]*?```/g, "") // fenced code blocks
        .replace(/`[^`\n]+`/g, "") // inline code
        .replace(/^\|.*\|$/gm, "") // tables
        .replace(/^#{1,6}\s+/gm, "") // headings
        .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
        .replace(/\*([^*]+)\*/g, "$1") // italic
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // links
        .replace(/^[-*>]\s+/gm, "") // list markers / blockquotes
        .replace(/\n+/g, " ") // collapse newlines
        .trim();
    if (s.length <= maxLen)
        return s;
    // Try to cut at a word boundary
    const cut = s.lastIndexOf(" ", maxLen);
    return (cut > maxLen * 0.7 ? s.slice(0, cut) : s.slice(0, maxLen)) + "…";
}
// ── Main search function ─────────────────────────────────────────────────────
export async function searchDocs(query, topK) {
    const vector = await embed(query);
    const response = await qdrant.search(COLLECTION, {
        vector,
        limit: topK,
        with_payload: true,
        score_threshold: 0.0,
    });
    return response.map(hit => {
        const p = hit.payload;
        const text = p.text ?? "";
        return {
            source_file: p.source_file ?? "",
            file_path: p.file_path ?? "",
            title: p.title ?? "",
            parent_headings: p.parent_headings ?? [],
            score: Math.round(hit.score * 10000) / 10000,
            snippet: makeSnippet(text),
        };
    });
}

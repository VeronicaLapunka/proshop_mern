# MCP Docs-Search Integration Specification

**Module:** MCP Docs-Search (RAG Documentation Pipeline)
**File:** `mcp-docs-search/` (TypeScript)
**Language:** TypeScript + Node.js
**Key Dependency:** MCP SDK, Qdrant, LLM embeddings

## Architecture

The **mcp-docs-search** MCP server provides semantic search over project documentation. It implements a **Retrieval-Augmented Generation (RAG)** pipeline:

1. **Document Ingestion** — All markdown files from `docs/` are converted to text chunks
2. **Embedding Generation** — Each chunk is converted to a vector via LLM embeddings
3. **Vector Storage** — Vectors stored in Qdrant (in-memory or persistent)
4. **Query Execution** — User query → embedding → semantic similarity search → ranked results

**Tool:** `search_project_docs(query)` returns top-K matching chunks with:
- `source_file` — Which doc the chunk came from
- `score` — Semantic similarity score (0-1, higher = better match)
- `snippet` — The actual chunk text

## Search Index

**Indexed documents (60 files):**
- 9 ADRs (docs/adr/0001-0005, adr-001-005)
- 39 project docs (docs/project-data/api, features, pages, runbooks, incidents)
- 5 root guides (README, DESIGN, DESIGN_ACCESSIBILITY, FINDINGS, CLAUDE)
- 2 MCP server docs (mcp-docs-search, mcp-feature-flags)
- 3 M2 test docs (m2-char-tests)

**Vector index file:** `docs/chunks.jsonl` (contains embeddings + metadata)

## Query Examples

| Query | Use Case | Expected Results |
|-------|----------|------------------|
| "JWT authentication flow" | Find auth patterns | auth.md, adr-003, authMiddleware docs |
| "Redux state management" | Find state patterns | adr-002, frontend-redux-spec.md |
| "Feature flags setup" | Find feature docs | features-spec.md, feature-flags-spec.md |
| "Deploy to Heroku" | Find deployment guide | deploy.md runbook |

## Integration with AI Workflows

The MCP server is designed for AI agent workflows:
- **Planning phase:** Agents search for architectural context
- **Execution phase:** Agents search for implementation patterns
- **Debugging phase:** Agents search for known issues + runbooks

**Best practice:** Always search before grep/read for efficiency (scores indicate relevance).

## MCP Server Tools

| Tool | Purpose |
|------|---------|
| search_project_docs | Semantic search with ranking |

## File References

- `mcp-docs-search/src/search.ts` — Search implementation
- `mcp-docs-search/src/server.ts` — MCP server protocol
- `docs/chunks.jsonl` — Vector index data
- `docs/INDEX.md` — Navigation hub (complements search)

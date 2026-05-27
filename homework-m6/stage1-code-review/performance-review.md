# Performance Mate — Review Summary

**Reviewer:** performance-mate (claude-opus-4-7)
**Scope:** Stage-1 perf audit — backend controllers/middleware/routes (MERN core) + `mcp-feature-flags/src/**` + `mcp-docs-search/src/**` + `features.json`
**Diff / scope size:** ~713 lines of JS (backend) + ~858 lines of TS (MCP servers) = ~1,571 lines across 13 files
**Hot paths in scope:**
- `GET /api/products` (Public, list + keyword search via $regex)
- `GET /api/products/top` (Public homepage)
- `GET /api/orders`, `GET /api/orders/myorders` (Admin / user dashboard — both unpaginated)
- `GET /api/users` (Admin)
- `GET /api/feature-flags/:name` (Public, disk-bound per request)
- MCP `list_features` / `get_feature_info` / `set_feature_state` / `adjust_traffic_rollout` (sync fs on every call)
- MCP `search_project_docs` (Ollama embed + Qdrant search, two network hops, no timeout)

---

## Findings

- **HIGH:** 7 issues (blocking sync fs in MCP hot path, missing pagination on 3 admin/list endpoints, unbounded $regex collection-scan on products, repeated disk reads in feature-flag routes)
- **MEDIUM:** 7 issues (N+1 countDocuments/find pair, auth-middleware DB round-trip, unbounded embedded reviews array, MCP snippet regex sweep, no fetch timeout in docs-search, missing top-products cache + index, $regex CPU cost)
- **LOW:** 2 issues (dependency upgrade leaves perf on table; micro-iteration on reviews)

Output JSONL: `homework-m6/stage1-code-review/performance-findings.jsonl` (17 issue lines + 2 status lines)

---

## Top concerns (HIGH)

1. **`mcp-feature-flags/src/helpers.ts:39,55`** — Every MCP tool call performs `fs.readFileSync` and `fs.writeFileSync` on `features.json`. Blocks the Node event loop on every list/get/set/adjust. Estimated event-loop block: ~1-3ms per read, ~2-5ms per write. Severe under the HTTP transport (`server-http.ts`) because it serves concurrent requests.
2. **`backend/routes/featureFlagRoutes.js:15,22`** — Same data re-read from disk on every Express request, no `Cache-Control` / `ETag`. The Public `GET /api/feature-flags/:name` (no auth) lets anonymous clients drive disk reads.
3. **`backend/controllers/orderController.js:104,112`** — `getMyOrders` and `getOrders` return entire result sets with no pagination, no projection. With ~10k orders the admin endpoint ships ~20MB and blocks the event loop while V8 serializes JSON.
4. **`backend/controllers/userController.js:110`** — `getUsers` returns the full users collection, including hashed passwords. Unbounded; admin endpoint but still a memory + bandwidth hazard.
5. **`backend/models/productModel.js:26` + `productController.js:13`** — `Product.name` has no index, yet the list endpoint runs a case-insensitive `$regex` against it. Each list request causes TWO full collection scans (countDocuments + find). p95 with 100k products: ~500ms-2s.
6. **`backend/controllers/productController.js:135`** — `product.reviews` embedded array grows unbounded (MongoDB 16MB doc cap), and `rating` is recomputed via O(N) reduce on every new review. Will fail catastrophically at scale; will slow down well before.
7. **`backend/middleware/authMiddleware.js:17`** — Every protected route costs one extra `User.findById` round-trip. Cumulatively the highest-frequency query on the backend.

---

## Total estimated impact (qualitative + quantitative where credible)

- **API latency p95**:
  - Products list with a 100k catalog: +500ms-2s per request from $regex full scan (HIGH)
  - Orders admin list with 10k orders: +1-5s and ~20MB body (HIGH)
  - Top products: +50-100ms per homepage hit, easily cacheable (MEDIUM)
- **Event-loop blocking** (MCP servers):
  - Feature-flag MCP calls: ~1-5ms per tool invocation from sync fs (HIGH on the HTTP transport which serves concurrent requests)
- **DB load**:
  - Auth middleware: +1 round-trip per authenticated request (~5ms × all protected endpoints)
- **Memory growth**:
  - product.reviews unbounded — hard 16MB cap; soft slowdown long before that

---

## Cross-specialist collaboration

- **security-mate** already filed:
  - HIGH: NoSQL/ReDoS via `req.query.keyword` → `$regex` (productController.js:14). **Overlapping perf finding here (#5)** — same line, also missing index + double full scan. Fix should combine both: cap keyword length, escape regex meta-chars, AND add a text/normalized-name index.
  - HIGH: Outdated deps. Perf review concurs (mongoose 5.x is EOL; 6/7 buys ~10-20% on hot paths). Out of scope for an isolated perf fix.
  - MEDIUM: `GET /api/feature-flags/:name` Public. Perf review adds: also missing cache.
- **architecture-mate**: Two findings here are architectural and worth ADRs:
  - Embedded vs referenced reviews (productController.js:135) — single ADR can capture both perf and integrity.
  - Auth middleware DB round-trip — push name/isAdmin into the JWT? ADR-003 (JWT vs session) does not specify.
- No mailbox infrastructure present at `.claude/teams/{team-id}/inboxes/` so no async pings sent.

---

## What was checked

- N+1 / loops with DB queries in: all controllers — none found per-iteration, but `countDocuments+find` is a 2-roundtrip pattern (medium)
- Blocking I/O: sync `fs.*Sync` in MCP helpers (HIGH); jwt.verify (LOW)
- Missing pagination: orders × 2, users × 1 (HIGH)
- Missing indexes: Product.name, Product.rating, Order.user, Order.createdAt
- Caching opportunities: top-products, feature-flags GET
- Memory growth: embedded reviews array
- Bundle/asset bloat: out of scope this run (frontend not in the file list)
- ReDoS / regex on user input: handed back to security-mate; perf angle filed

---

## Status

- N+1 scan complete
- Blocking I/O scan complete
- Missing-pagination scan complete
- Missing-index scan complete
- Caching opportunities reviewed (server-side; client-side out of scope)
- MCP servers (TS) reviewed for event-loop hazards + network timeouts
- Bundle / asset diff: skipped (frontend not in scope this run)

---

## Read-only confirmation

This run made no code changes. Outputs limited to:
- `homework-m6/stage1-code-review/performance-findings.jsonl`
- `homework-m6/stage1-code-review/performance-review.md`

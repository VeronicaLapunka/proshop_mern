# Code Review Synthesis — proshop_mern (homework M6 Stage 1)

**Date:** 2026-05-27
**Reviewer:** 3-agent team (security-mate + performance-mate + architecture-mate)
**Scope:** M3-M5 modules — backend/controllers/, backend/middleware/, backend/routes/, mcp-feature-flags/src/, mcp-docs-search/src/, features.json
**Files reviewed:** ~15 source files (~1,800 LOC JS/TS) + 8 ADRs + 3 CLAUDE.md files
**Raw findings:** 22 (security) + 17 (performance) + 20 (architecture) = 59 raw → **35 de-duplicated**

---

## HIGH severity (10 findings)

### Access Control & IDOR

**1. `backend/controllers/orderController.js:43` — IDOR on GET /api/orders/:id**
- Sources: security-mate (HIGH, A01), architecture-mate (C1)
- Any authenticated user can read any other user's order (shipping address, items, payer email) by guessing ObjectIds. No ownership check exists.
- Fix: `if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) throw 401`
- Effort: 15 min

**2. `backend/controllers/orderController.js:60` — Payment status spoofable + ADR-004 violation**
- Sources: security-mate (HIGH, A01/A08), architecture-mate (C1)
- Any authenticated user can mark any order as paid with a fabricated PayPal JSON payload. No server-side PayPal API verification. Also lacks ownership check.
- Fix: Verify payment server-side via PayPal SDK before writing `isPaid`. Add ownership guard.
- Effort: 2–3 h

**3. `backend/controllers/orderController.js:7` — Client-supplied price trusted (price tampering)**
- Source: security-mate (HIGH, A04)
- `totalPrice` / `itemsPrice` taken directly from `req.body`. Attacker submits `totalPrice: 0` and the server records it as canonical.
- Fix: Recompute prices server-side from DB product prices × quantities; ignore client-supplied totals.
- Effort: 1 h

**4. `backend/routes/uploadRoutes.js:37` — Unauthenticated upload endpoint**
- Sources: security-mate (HIGH, A01/A08), architecture-mate (C1)
- No `protect`/`admin` middleware. No file size limit. MIME validated only by extension regex from attacker-controlled headers. Anonymous users can fill disk and pivot XSS via HTML uploads served same-origin.
- Fix: Add `protect, admin`; add `limits: { fileSize: 5 * 1024 * 1024 }`; validate MIME with magic bytes.
- Effort: 1 h

### Hardcoded Secrets

**5. `mcp-feature-flags/src/server-http.ts:25,101,128` — Hardcoded API key + timing-unsafe compare + key logged**
- Sources: security-mate (HIGH, SECRETS + A07 + A09)
- `"rdg564gchdhd_dhdhd12gpoong"` committed as fallback. Non-constant-time `!==` comparison enables timing-attack key recovery. Key printed to stdout at startup.
- Fix: Remove fallback entirely; fail-fast on missing `MCP_API_KEY`; use `crypto.timingSafeEqual()`; remove startup log. Rotate the leaked key.
- Effort: 30 min + key rotation

### Injection / ReDoS

**6. `backend/controllers/productController.js:14` — `$regex` from query string (ReDoS + full scan × 2)**
- Sources: security-mate (HIGH, A03), performance-mate (HIGH)
- `$regex: req.query.keyword` — attacker hangs event loop with catastrophic backtracking. Also triggers TWO full collection scans (countDocuments + find) on every search with no index on `Product.name`.
- Fix: Escape metacharacters; add input length limit (≤100 chars); add `$text` index on product name.
- Effort: 1 h

### Missing Pagination (unbounded queries)

**7. `backend/controllers/orderController.js:104,112` — getMyOrders + getOrders unpaginated**
- Source: performance-mate (HIGH)
- Full result-set responses. ~20MB JSON at 10k orders on admin endpoint (+1–5s p95). Customer order history unbounded.
- Fix: Add `page`/`pageSize` params, same pattern as `getProducts`.
- Effort: 30 min

**8. `backend/controllers/userController.js:110` — getUsers unpaginated + leaks password hashes**
- Sources: security-mate (HIGH, A02), performance-mate (HIGH)
- Returns full users collection incl. bcrypt hashes. ~50MB at 100k users, OOM risk.
- Fix: Add `.select('-password')` AND pagination. Both fixes together.
- Effort: 30 min

### Blocking I/O in MCP

**9. `mcp-feature-flags/src/helpers.ts:39,55` — fs.readFileSync / writeFileSync blocks event loop on every MCP call**
- Sources: performance-mate (HIGH), architecture-mate (C1 — related)
- Synchronous disk I/O on every `list_features` / `get_feature_info` / `set_feature_state` / `adjust_traffic_rollout` call. ~1–5ms block per call; severe under HTTP transport serving concurrent requests.
- Fix: Replace with `fs.promises.readFile/writeFile`; add in-memory cache with short TTL (5s) for reads.
- Effort: 45 min

### Auth

**10. `backend/routes/userRoutes.js:16` — No rate limit on login**
- Source: security-mate (HIGH, A07)
- `POST /api/users/login` has no rate-limiting or account lockout. Trivial credential stuffing; registration also reveals account existence via differing status codes.
- Fix: Add `express-rate-limit` (e.g. 10 req/15 min per IP) on login route.
- Effort: 30 min

---

## MEDIUM severity (15 findings)

### Feature-flag architecture (cross-mate cluster)

**11. `backend/routes/featureFlagRoutes.js:42` + `mcp-feature-flags/src/helpers.ts:157` — Two divergent feature-flag mutators on same file**
- Sources: security-mate (MEDIUM, race), performance-mate (HIGH — disk re-read), architecture-mate (C1)
- Express PATCH does NOT enforce `DEPENDENCY_NOT_ENABLED` rule; MCP does. Different atomic-write strategies. No shared lock. Race condition possible. Also: no cache on GET, re-reads disk on every request.
- Fix: Extract shared `featureFlagsRepository.ts`; both Express and MCP route through it. Single atomic rename strategy. Add in-memory cache with invalidation on write.
- Effort: 2 h

### Auth / Session

**12. `backend/middleware/authMiddleware.js:17` — User.findById round-trip on every protected request**
- Sources: performance-mate (MEDIUM), security-mate (A01 — staleness risk)
- +1 DB round-trip × every authenticated endpoint × every request (~5ms each). Adding LRU cache has security trade-off: stale `isAdmin`. Needs explicit invalidation contract.
- Fix: Short-TTL LRU cache (≤30s) with role-change invalidation hook. Document in an ADR addendum to ADR-003.
- Effort: 1 h

**13. `backend/models/userModel.js:36` — Pre-save hook re-hashes password on every save**
- Source: security-mate (MEDIUM, A02)
- Missing `return` after `next()` + no `isModified('password')` guard → password re-hashed on every `User.save()`. Causes silent account lockouts after any profile field update.
- Fix: `if (!this.isModified('password')) return next();`
- Effort: 5 min

**14. `backend/utils/generateToken.js:4` — 30-day JWT with no revocation (ADR-003 accepted debt)**
- Source: security-mate (MEDIUM, A04/A07)
- Token stays valid after logout. ADR-003 accepts this as deliberate trade-off, but TTL is longer than recommended.
- Fix: Reduce to 7 days; implement `tokenVersion` field on User for server-side invalidation on password change.
- Effort: 2 h

### Missing indexes + performance

**15. `backend/models/productModel.js` — No index on Product.name, Product.rating, Order.user**
- Source: performance-mate (HIGH/MEDIUM)
- Missing indexes cause full collection scans on hot paths: keyword search (Product.name), top products (Product.rating sort), order history (Order.user).
- Fix: Add schema-level index declarations or explicit `schema.index()` calls.
- Effort: 15 min

**16. List queries missing `.lean()`**
- Source: performance-mate (MEDIUM)
- `getProducts`, `getOrders`, `getMyOrders`, `getUsers`, `getTopProducts` all return hydrated Mongoose docs (~30–50% overhead vs POJOs).
- Fix: Add `.lean()` to all read-only list queries.
- Effort: 20 min

### Architecture / structure

**17. `backend/CLAUDE.md` claims "controller → service → model" but no `backend/services/` exists**
- Source: architecture-mate (C1)
- Documented convention contradicts code reality. Confuses agents and future contributors.
- Fix: Update CLAUDE.md to reflect "controller → model" as current reality + create ADR-0004. OR add minimal service layer for complex domain logic.
- Effort: 30 min (docs) / 3–4 h (actual service layer)

**18. `backend/routes/featureFlagRoutes.js:14` vs `:30` — Inconsistent API shape**
- Source: architecture-mate (C1)
- `GET /api/feature-flags` returns raw map; `GET /api/feature-flags/:name` returns `{ [name]: record }`. Forces consumers to special-case both paths.
- Fix: Standardize both to a consistent envelope. Document in ADR-0005.
- Effort: 1 h

**19. `backend/controllers/productController.js:139` — Business logic (rating recompute) in HTTP handler**
- Sources: architecture-mate (C1), performance-mate (MEDIUM)
- O(N) reduce over embedded reviews array on every new review save. Domain logic belongs in model or service, not controller.
- Fix: Move to a model method; cap reviews per product or switch to separate Review collection.
- Effort: 1.5 h

**20. No rate limit on MCP HTTP `/mcp` endpoint**
- Source: security-mate (MEDIUM, A07)
- The HTTP MCP transport has no rate limiting. Combined with the timing-unsafe key comparison (#5), makes key brute-force feasible.
- Fix: Add rate limiting middleware to express app in `server-http.ts`.
- Effort: 20 min

### Security config / hygiene

**21. `backend/server.js:25` — No helmet, no body-size limit, no CORS allowlist**
- Source: security-mate (MEDIUM, A05)
- Express app missing standard hardening headers and CORS configuration.
- Fix: `app.use(helmet())`, `app.use(express.json({ limit: '10kb' }))`, explicit CORS allowlist.
- Effort: 30 min

**22. `backend/middleware/errorMiddleware.js:12` — Stack traces leak in non-`production` NODE_ENV**
- Source: security-mate (MEDIUM, A05)
- Single string equality check `NODE_ENV === 'production'` — any typo (`'prod'`, empty) exposes stack traces.
- Fix: Check `!== 'production'` instead of `=== 'development'`.
- Effort: 5 min

**23. `backend/controllers/userController.js:30` — No password complexity policy**
- Source: security-mate (MEDIUM, A04)
- Registration accepts single-character passwords. Bcrypt cost 10 is below 2026 recommendations.
- Fix: Enforce minimum 8 chars + complexity; increase bcrypt cost to 12.
- Effort: 30 min

**24. `GET /api/feature-flags/:name` public — leaks unreleased feature names**
- Source: security-mate (MEDIUM, A01)
- Anonymous clients can enumerate all feature flag names, rollout percentages, and states — including unreleased features.
- Fix: Add `protect` middleware or at minimum filter sensitive fields from public response.
- Effort: 30 min

**25. `package.json` — Severely outdated deps with known CVEs**
- Sources: security-mate (HIGH, A06), performance-mate (LOW)
- `jsonwebtoken@^8.5.1` (CVE-2022-23529), `multer@^1.4.2` (CVE-2022-24434), `mongoose@^5.x` EOL, `express@^4.17.1`.
- Fix: Upgrade with compatibility testing. mongoose 5→8 has breaking changes; plan with characterization tests.
- Effort: 2–4 h

---

## LOW severity (10 findings)

26. JWT `verify` does not pin `algorithms: ['HS256']` — alg-confusion defence-in-depth
27. Failed auth attempts only `console.error`'d, no structured audit log
28. `OLLAMA_URL` server-side fetch — not user-controlled now, but SSRF surface if ever exposed
29. `mcp-docs-search/src/search.ts` — no timeout on Ollama embed call; slow embed hangs MCP request
30. `mcp-feature-flags/src/server-http.ts:108` — new `McpServer` instance per HTTP request (~5–15ms overhead)
31. `backend/controllers/productController.js` — god controller (7 responsibilities); split into 2+
32. `mcp-feature-flags/src/helpers.ts` — god module mixing state validation, disk I/O, business rules
33. Magic numbers: `pageSize = 10` in productController, rollout thresholds in helpers.ts
34. `backend/middleware/authMiddleware.js` — returns 401 for both unauthenticated and unauthorized (should be 403)
35. CWD-dependent path to `features.json` in helpers.ts — breaks if server started from different directory

---

## Recommended Fix Order (Top 5)

| Priority | File:line | Issue | Why first |
|---|---|---|---|
| 1 | `mcp-feature-flags/src/server-http.ts:25,101,128` | Hardcoded API key + timing-unsafe compare + logged | Credentials committed; immediate rotation needed |
| 2 | `backend/controllers/orderController.js:43,60,7` | IDOR + payment spoof + price tampering | Three exploit paths in one file; financial fraud + data breach |
| 3 | `backend/routes/uploadRoutes.js:37` | Unauthenticated upload | Anonymous write + XSS pivot via same-origin files |
| 4 | `backend/controllers/productController.js:14` | `$regex` ReDoS + full collection scan | High-traffic public endpoint; DoS + injection |
| 5 | `backend/models/userModel.js:36` + `userController.js:110` | Re-hash bug + password hash leak + no pagination | Silent lockout + credential dump + OOM |

---

## Top-3 для Stage 2

| # | File:line | Issue | Recommended fix | Effort |
|---|---|---|---|---|
| 1 | `mcp-feature-flags/src/server-http.ts:25` | Hardcoded API key `"rdg564gchdhd_dhdhd12gpoong"` as fallback | Remove fallback; `if (!MCP_API_KEY) throw new Error(...)` on startup; use `crypto.timingSafeEqual()`; rotate key | 30 min |
| 2 | `backend/controllers/orderController.js:43` | IDOR — no ownership check on getOrderById | Add ownership guard: `if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin)` → 401 | 15 min |
| 3 | `backend/controllers/productController.js:14` | `$regex: req.query.keyword` — ReDoS + full collection scan × 2 | Escape metacharacters; add 100-char length limit; add MongoDB `$text` index on `Product.name` | 1 h |

---

## Cross-mate Observations

| Finding | Security | Performance | Architecture | Notes |
|---|---|---|---|---|
| `productController.js:14` `$regex` | HIGH (ReDoS, A03) | HIGH (full scan × 2) | C3 (magic pageSize) | All 3 mates flagged. Single fix closes all. |
| `featureFlagRoutes.js:42` + `helpers.ts:157` | MEDIUM (race) | HIGH (disk re-read) | C1 (divergent mutators) | All 3 mates flagged. Shared repository module closes all. |
| `orderController.js:60` payment | HIGH (A01/A08) | — | C1 (ADR-004 violation) | 2 mates. Server-side PayPal verify closes both. |
| `userController.js:110` getUsers | HIGH (hash leak) | HIGH (no pagination) | — | 2 mates. One query change closes both. |
| `authMiddleware.js:17` | MEDIUM (isAdmin staleness) | MEDIUM (per-request DB) | — | 2 mates. Cache requires explicit invalidation contract. |
| `uploadRoutes.js:37` | HIGH (A01/A08) | — | C1 (public-by-omission) | 2 mates. Single middleware addition closes both. |

---

## Token Usage Estimate

| Agent | Approx tokens |
|---|---|
| security-mate (run 2) | ~71k |
| performance-mate (run 2) | ~68k |
| architecture-mate (run 1) | ~116k |
| synthesizer | ~18k |
| **Total** | **~273k tokens** |

Estimated cost at Claude Opus 4 pricing: **~$4–8 for the full review run**.

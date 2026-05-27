# Security Mate — Review Summary

**Reviewer:** security-mate (Opus 4.7)
**Scope:** Stage-1 audit of backend controllers/middleware/routes + MCP feature-flags + MCP docs-search + features.json
**Files reviewed:** 15 (3 controllers, 2 middleware, 5 routes, 3 MCP TypeScript files, 1 model, 1 utils, plus supporting server.js, .env, package.json manifests)
**Findings produced:** 22 (21 issues + cross-references)
**Output:** `homework-m6/stage1-code-review/security-findings.jsonl`

---

## Findings by severity

- **HIGH:** 9 issues
- **MEDIUM:** 9 issues
- **LOW:** 4 issues

---

## Top concerns (HIGH)

1. **`backend/controllers/orderController.js:43`** — **IDOR on `GET /api/orders/:id`**. Any authenticated user can read any other user's order (shipping address, items, payer email). No ownership check. (A01)
2. **`backend/controllers/orderController.js:60`** — **`updateOrderToPaid` accepts attacker-controlled payment proof and lacks ownership check**. A non-admin user can mark anyone's order as paid by posting fabricated PayPal JSON. (A01 / A08)
3. **`backend/controllers/orderController.js:7`** — **Server trusts client-supplied `totalPrice` / `itemsPrice`**. Classic eCommerce price-tampering: submit `totalPrice: 0` and the server records it as canonical. (A04)
4. **`backend/routes/uploadRoutes.js:37`** — **Upload endpoint is fully unauthenticated**, no size limit, MIME validation only on attacker-controlled headers. Anonymous users can fill disk and stash files in `/uploads/`. (A01 / A08)
5. **`mcp-feature-flags/src/server-http.ts:25`** — **Hardcoded MCP API key fallback** committed to the repo (`rdg564gchdhd_dhdhd12gpoong`). Anyone with repo access has admin write access to feature flags. (SECRETS)
6. **`mcp-feature-flags/src/server-http.ts:101`** — **Non-constant-time token comparison** (`token !== API_KEY`) enables remote timing-attack key recovery, especially because there is no rate limit on `/mcp`. (A07)
7. **`mcp-feature-flags/src/server-http.ts:128`** — **API key logged to stdout** at startup. (A09)
8. **`backend/routes/userRoutes.js:16`** — **`POST /api/users/login` has no rate-limit / lockout**. Unbounded credential stuffing; registration also reveals account existence via differing status codes (enumeration). (A07)
9. **`package.json:24`** — **Severely outdated dependencies**. `jsonwebtoken@^8.5.1` (CVE-2022-23529), `multer@^1.4.2` (CVE-2022-24434), `mongoose@^5.x` EOL, `express@^4.17.1`, `dotenv@^8.2.0`. The backend has not been patched in years. (A06)

## Notable MEDIUM concerns

- **NoSQL injection / ReDoS via `req.query.keyword` → `$regex`** in `productController.js:14`. (A03)
- **30-day JWT lifetime** combined with localStorage storage gives an XSS attacker a month-long credential. (A04)
- **No `helmet`, no body-size limit, no CORS allowlist** on the Express app — see `server.js:25`. (A05)
- **bcrypt cost 10** is below modern recommendation; bump to 12+. (A02)
- **`GET /api/feature-flags/:name` is Public** — leaks unreleased-feature names and rollout status to anonymous reconnaissance. (A01)
- **Feature-flag name path-param used directly as object key** — prototype-probe surface, no allowlist. (A03)
- **Stack traces leak in any non-`production` env** — relies on a single string match; fragile. (A05)
- **No password complexity policy** on registration / profile update. (A04)

## LOW / hygiene

- JWT `verify` does not pin `algorithms: ['HS256']` — alg-pinning defence in depth. (A02)
- Failed auth attempts only `console.error`'d, no structured audit log. (A09)
- `OLLAMA_URL` server-side fetch is operator-controlled (not user-controlled), but if ever exposed it becomes SSRF. (A10)
- `.env` contains a trivially weak local `JWT_SECRET = abc123`. Not committed (verified via `git log -S`), but trains bad habits and risks copy-to-prod.

---

## Cross-specialist collaboration

- None executed in this run (no mailbox infrastructure present at the canonical path under `.claude/teams/{team-id}/inboxes/`). Several findings overlap with **architecture-mate** scope and could be escalated as ADR violations / additions:
  - JWT lifetime + storage model — ADR-003 (jwt vs session) does not specify TTL.
  - Order/price recomputation — no ADR on payment integrity model.
  - `helmet` / rate-limit — no ADR on the Express hardening stack.
- Suggested follow-ups for **performance-mate**: the `$regex` keyword search has both a security (ReDoS) and a performance (no index, no `$text` search) dimension; coordinate the fix.

---

## Status

- All OWASP 2021 categories scanned (A01–A10 + SECRETS + CRYPTO-MISCONFIG)
- Dependency review completed from `package.json` (npm audit not executed — no `package-lock.json` examined; the static review of pinned ranges already surfaces known CVEs)
- Hardcoded-secret scan completed across backend controllers, MCP servers, and config files
- Git-history secret leak check (`git log -S 'abc123'`) returned no commits — `.env` was never tracked
- Project rule files honoured: root `CLAUDE.md`, `backend/CLAUDE.md`. ADRs 0001–0003 (manual JWT header injection, selective localStorage persistence, ES modules) and ADR-003 (JWT vs session) reviewed for relevance — no finding contradicts an ADR

---

## Read-only confirmation

This run made **no code changes**. All outputs are limited to:
- `homework-m6/stage1-code-review/security-findings.jsonl`
- `homework-m6/stage1-code-review/security-review.md` (this file)

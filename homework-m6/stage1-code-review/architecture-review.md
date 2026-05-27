# Architecture Mate — Review Summary

**Reviewer:** architecture-mate (Opus 4.7)
**Scope:** `backend/controllers/*.js`, `backend/middleware/*.js`, `backend/routes/*.js`, `mcp-feature-flags/src/{server.ts, helpers.ts, server-http.ts}`, `mcp-docs-search/src/{server.ts, search.ts}`, `features.json` (root)
**Out of scope:** `tests/`, `__tests__/`, `scripts/`, `frontend/`, `node_modules/`, `dist/`
**Scope size:** 15 source files (~1,200 lines of JS/TS) + 1 JSON config
**ADRs loaded:** 8 (`docs/adr/*.md`) — 3 MADR-format (0001, 0002, 0003) + 5 Nygard-format (001–005)
**Findings file:** `homework-m6/stage1-code-review/architecture-findings.jsonl` (20 findings + 3 status markers)
**Cross-reviews consulted:** `security-review.md`, `performance-review.md` (both in `homework-m6/stage1-code-review/`)

---

## Findings by criticality

- **C1 (HIGH):** 6 issues
- **C2 (MEDIUM):** 9 issues
- **C3 (LOW):** 5 issues

### By category

| Category | C1 | C2 | C3 |
|---|---|---|---|
| Layer violation / layering mismatch | 3 | 1 | — |
| ADR violation / contract drift | — | 2 | — |
| Duplicated abstraction (Express ↔ MCP) | 1 | 1 | — |
| API contract stability | 1 | — | — |
| Missing pattern (Repository / Service) | — | 1 | — |
| Missing pattern (Domain event / state machine) | — | 1 | — |
| God object / God controller | — | 1 | 1 |
| Leaky abstraction (HTTP status semantics) | — | 1 | — |
| Tight coupling (CWD-dependent path) | — | 1 | — |
| Missing auth contract (public-by-omission) | 1 | — | — |
| Cross-cutting concerns hardcoded | — | — | 1 |
| Magic numbers | — | — | 2 |
| Premature/absent abstraction (Embedder) | — | — | 1 |

---

## Top concerns (C1)

1. **`backend/CLAUDE.md:7` + `backend/controllers/*.js:1`** — **Documented layering does not match reality.** Project docs assert "controller → service → model" but `backend/services/` does not exist; every controller calls Mongoose directly. There is no ADR establishing the canonical layout. (Findings #1, #17, #19; ADR violated: none — gap to fix with a new ADR.)
2. **`backend/controllers/productController.js:139`** — **Business logic in HTTP handlers.** Rating recompute and embedded-review mutation belong on the domain model or a service. (Finding #2; cross-refs performance-review.md MEDIUM — same line.)
3. **`backend/routes/featureFlagRoutes.js:42` + `mcp-feature-flags/src/helpers.ts:157`** — **Two divergent implementations of feature-flag mutation against the same backing file**, with different state-transition rules (Express endpoint does NOT enforce `DEPENDENCY_NOT_ENABLED`; MCP does). Atomic-write strategies also differ. (Finding #4; cross-refs security-review.md MEDIUM race + performance-review.md MEDIUM.)
4. **`backend/routes/featureFlagRoutes.js:14` vs `:30`** — **Inconsistent public API shape** between `GET /api/feature-flags` (raw map) and `GET /api/feature-flags/:name` ({ [name]: record } — single-entry map). Forces every consumer to special-case the path. (Finding #5; treat as breaking.)
5. **`backend/controllers/orderController.js:60`** — **ADR-004 violation.** PayPal verification step is documented in ADR-004 and not implemented. (Finding #7; cross-refs security-review.md HIGH #4.)
6. **`backend/routes/uploadRoutes.js:37`** — **Public-by-omission write endpoint.** No `protect`/`admin` on the only file-upload route; architecturally there is no convention enforcing "authenticated by default". (Finding #12; cross-refs security-review.md HIGH #8.)

---

## Cross-specialist collaboration

Overlaps with `homework-m6/stage1-code-review/security-review.md` and `performance-review.md`:

- **`backend/controllers/orderController.js:60` (updateOrderToPaid)** — security HIGH #4 (auth-anyone can mark any order paid) + architecture C1 (ADR-004 verification missing). Same fix — server-side verification — closes both. Architecturally the fix lives in a service/domain method (`order.markPaid(verifiedPaymentResult)`), security-mate's fix lives in the controller (ownership check + verification).
- **`backend/routes/featureFlagRoutes.js:42` (PATCH)** — security MEDIUM (race condition, non-atomic write) + performance MEDIUM (no cache) + architecture C1 (duplicated abstraction). Single refactor — extract a shared `featureFlagsRepository` module — addresses all three simultaneously. **Recommended joint follow-up between security-mate, performance-mate and architecture-mate.**
- **`backend/controllers/productController.js:11` (`$regex` keyword search)** — security HIGH #7 (ReDoS) + performance HIGH #4 (full collection scan) + architecture C3 (magic-number `pageSize = 10`). Architecture-mate defers to security-mate and performance-mate on the substantive fix (text index + escape), but flags that pagination policy belongs in `backend/config/`.
- **`backend/middleware/authMiddleware.js:17`** — performance MEDIUM (no LRU cache on per-request user lookup) + security A01 (cached `isAdmin` staleness). Architectural concern: an LRU cache is a **stateful cross-cutting concern** that needs an explicit invalidation contract (TTL + role-change hook). Document the cache policy when adding it.

No mailbox messages were sent — peer reviews were complete and unambiguous; architectural recommendations are layered on top of them rather than asking for clarification.

---

## Proposed ADRs

Two drafts authored under `homework-m6/stage1-code-review/proposed-adrs/`:

- **`ADR-0004-draft.md` — Backend layering: controller → repository → model (no service layer for v1)**
  Resolves the documented "controller → service → model" claim in `backend/CLAUDE.md` against the actual code (controller → model). Captures the trade-off explicitly so future contributors / agents stop adding "service violations" findings.

- **`ADR-0005-draft.md` — Single source of truth for feature-flag mutation (shared domain module)**
  Records the architectural decision that ANY mutator of `features.json` — Express PATCH routes, MCP stdio server, MCP HTTP server — MUST go through a single shared module. Eliminates the divergence between `featureFlagRoutes.js` PATCH (no dependency check) and `helpers.ts` `setFeatureState` (full dependency check + atomic write).

A third candidate ADR (auth-error string contract, see Finding #6) is mentioned in ADR-0004's "Open issues" section rather than promoted to a standalone ADR — it is a smaller decision and can be a follow-up addendum to ADR 0001.

---

## Patterns flagged across multiple findings

- **No services/, no repositories/** — Findings #1, #19. The single highest-leverage architectural lever in this codebase. Even if a full service layer is deferred, a thin repository layer would unblock testability, the eventual Mongoose 5 → 7 upgrade, and the duplicated-mutator problem in feature-flags.
- **`features.json` is a "shared mutable file across two runtimes"** — Findings #3, #4, #11. Backend HTTP and MCP servers both read+write the same JSON file from different processes, with different resolution strategies, different rule sets, different atomicity guarantees. This is one of the riskier architectural shapes in the repo.
- **HTTP-error-string-as-contract** — Findings #6, #10. The codebase relies on exact-match English strings to drive frontend behaviour (auto-logout) and to communicate authn vs authz semantics. As features.json and the admin surface grow, this will get worse.

---

## Status

- All loaded ADRs cross-referenced against the scope (3 MADR + 5 Nygard ADRs; 2 violations and 1 implicit decision worth promoting to ADR)
- Layer boundaries scanned (controller → service → model claim invalidated)
- API contract stability checked (one shape inconsistency found in feature-flags GET endpoints)
- Coupling / cohesion scanned (god-objects, duplicate abstractions, CWD-dependent paths)
- Design-pattern audit done (missing Repository, missing state machine on Order, premature-abstraction NOT found in mcp-docs-search)
- Cross-references with security-review.md and performance-review.md complete
- Read-only review — no source files were modified


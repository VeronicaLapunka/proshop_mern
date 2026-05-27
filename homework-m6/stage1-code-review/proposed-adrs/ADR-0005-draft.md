# ADR-0005 (DRAFT): Single Source of Truth for Feature-Flag Mutation

**Status:** Proposed (drafted by architecture-mate during Stage-1 code review, 2026-05-27)
**Date:** 2026-05-27
**Deciders:** TBD (PR author + tech lead)

---

## Context

Three independent code paths can read or write `features.json`:

1. **Express HTTP routes** — `backend/routes/featureFlagRoutes.js`
   - `GET /api/feature-flags` (admin) — reads
   - `GET /api/feature-flags/:name` (public) — reads
   - `PATCH /api/feature-flags/:name/status` (admin) — writes
   - `PATCH /api/feature-flags/:name/traffic` (admin) — writes
   - Uses `fs.readFile` + `JSON.parse` + mutate object + `fs.writeFile` (non-atomic).
   - Resolves the file path via `path.join(path.resolve(), 'features.json')` — depends on the process CWD.
   - Validates only that `status ∈ {Enabled, Disabled, Testing}` and that traffic is a number in [0, 100].
   - **Does not** enforce dependency rules (a flag with a `Disabled` dependency can be set to `Enabled`).

2. **MCP stdio server** — `mcp-feature-flags/src/{server.ts, helpers.ts}`
   - Tools: `list_features`, `get_feature_info`, `set_feature_state`, `adjust_traffic_rollout`.
   - Uses `fs.readFileSync` + atomic temp-file-rename write (`writeFeatures` in helpers.ts).
   - Resolves the file path relative to `__dirname` (script-relative — robust to CWD).
   - Enforces dependency rules: `set_feature_state(..., 'Enabled')` is rejected with `DEPENDENCY_NOT_ENABLED` if any dependency is `Disabled`. Emits warnings if any dependency is `Testing`.
   - State machine: `Disabled → traffic_percentage = 0`; `Enabled → 100`; `Testing → preserve 1–99 else reset to 10`.

3. **MCP HTTP server (for n8n)** — `mcp-feature-flags/src/server-http.ts`
   - Imports the same `helpers.ts` as the stdio server, so it shares the atomic-write + dependency-check behaviour.
   - But tool descriptions diverge from the stdio version (different prose, same schemas) — already drifting.

Result: there are **two divergent mutators** for the same logical resource (Express PATCH vs MCP `set_feature_state`), with different rules, different atomicity guarantees and different path-resolution strategies. The Express endpoint can produce states that the MCP server considers invalid (e.g. a flag enabled while a dependency is disabled), and a concurrent MCP + HTTP write can race because they do not share a lock.

This is also identified independently in:

- `homework-m6/stage1-code-review/security-review.md` MEDIUM (race condition, non-atomic write)
- `homework-m6/stage1-code-review/performance-review.md` MEDIUM (no caching, redundant I/O)

---

## Decision

There MUST be **exactly one** module that owns reads and writes of `features.json`. Every other component — Express PATCH routes, MCP stdio server, MCP HTTP server, any future surface — calls that module.

Concretely:

1. Promote `mcp-feature-flags/src/helpers.ts` (or its successor split — see ADR-0004 logic about god-helpers) to a shared package: `packages/feature-flag-domain/` exposing `readFeatures()`, `writeFeatures()`, `listFeatures()`, `getFeatureInfo()`, `setFeatureState()`, `adjustTrafficRollout()`. The package owns:
   - The canonical path resolver (env-var override; default = repo-root-relative).
   - Atomic temp-file-rename writes.
   - The full state machine and dependency check.
   - An advisory file lock (e.g. `proper-lockfile`) to make concurrent writes safe between processes.
2. `backend/routes/featureFlagRoutes.js` becomes a thin HTTP wrapper that calls the shared module — no JSON parsing, no `fs.writeFile`, no dependency-rule code lives in the route file.
3. Both MCP transports (`server.ts`, `server-http.ts`) register the same tool set via a shared `registerFeatureFlagTools(server)` helper — eliminating description drift.
4. `features.json` schema (FeatureRecord, VALID_STATES) is exported from the shared module so the Express routes type-check the request body against the same shape.

---

## Consequences

### Positive

- **No more divergent state machines.** Enabling a flag with a disabled dependency fails identically through HTTP, stdio MCP, HTTP MCP.
- **Atomic writes everywhere.** The Express PATCH endpoint stops producing partial writes on a crash/SIGTERM mid-write.
- **CWD-independence.** Backend started from any directory finds the same `features.json` as the MCP servers.
- **Single place to add caching** (in-memory + watch the file for external edits) — addresses performance-review.md MEDIUM.
- **Schema stays in one place.** Frontend / backend / MCP consume the same type definitions.

### Negative / trade-offs

- **Build coupling.** TypeScript module needs to be consumable from JavaScript (backend uses ESM JS, MCP servers use TypeScript). Either (a) compile the shared module to JS once and import the compiled output from backend, or (b) move backend to TS over time. Option (a) is cheaper and explicit.
- **Refactor cost.** Estimated 0.5–1 engineer-day: extract module, update three call sites, add lock, add migration tests.

### Risks

- **Lock contention under high write load.** Not currently a real concern — features.json is admin-changed rarely — but document the upper bound: lock is per-process advisory; if writes exceed a few per second the file model is the wrong storage and the data should move to MongoDB. Treat that move as a future ADR-0007.

---

## Alternatives considered

- **Move feature flags into MongoDB.** Long-term correct but premature today — current write rate is human-driven (admin UI + ad-hoc MCP). Defer until lock contention or audit requirements force the move.
- **Keep two implementations, document the rules, hope they stay in sync.** Already failing — the divergence exists today. Rejected.
- **Have Express call into the MCP HTTP server as a client.** Possible but adds an internal network hop for every read; needless complexity. Rejected.

---

## Migration steps

1. Extract `helpers.ts` into `packages/feature-flag-domain/`. Keep the existing exports.
2. Add `featuresRepository` (the I/O concern) as a separate file from `featureFlagDomain` (state machine).
3. Update `mcp-feature-flags/src/server.ts` and `server-http.ts` to import from the new package; verify both transports register the same tool set.
4. Rewrite `backend/routes/featureFlagRoutes.js` to import the shared `setFeatureState` and `adjustTrafficRollout` functions and translate them to HTTP responses (status code mapping, JSON shape). Remove the raw `fs.readFile` / `fs.writeFile` calls.
5. Add file-lock (`proper-lockfile`) inside `featuresRepository.writeFeatures`. The lock is per-file, not per-process.
6. Add an integration test: spin Express + the MCP stdio server, perform interleaved writes, assert the final state is consistent and that one write does not partially overwrite another.

---

## Open issues

- **API shape inconsistency.** `GET /api/feature-flags` and `GET /api/feature-flags/:name` return differently-shaped responses (see Finding #5 in `architecture-findings.jsonl`). Worth a follow-up REST-shape ADR.
- **Auth scoping of the public GET-by-name endpoint.** `GET /api/feature-flags/:name` is currently public; this is intentional (frontend gating without an admin login) but is not documented. Either add to this ADR or call it out in an addendum.

---

## See also

- `backend/routes/featureFlagRoutes.js` (Express HTTP surface)
- `mcp-feature-flags/src/helpers.ts` (current de-facto canonical module)
- `mcp-feature-flags/src/server.ts` and `server-http.ts` (two MCP transports)
- `homework-m6/stage1-code-review/security-review.md` MEDIUM (race condition)
- `homework-m6/stage1-code-review/performance-review.md` MEDIUM (no caching)
- Architecture-mate review summary: `homework-m6/stage1-code-review/architecture-review.md`

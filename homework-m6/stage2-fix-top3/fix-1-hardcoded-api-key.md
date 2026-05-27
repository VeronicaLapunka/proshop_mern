# Fix #1 — Hardcoded API key fallback

## Original finding (from synthesis.md)

**File:** `mcp-feature-flags/src/server-http.ts:25`
**Severity:** HIGH | **OWASP:** SECRETS + A07
**Sources:** security-mate, architecture-mate

> `"rdg564gchdhd_dhdhd12gpoong"` hardcoded as fallback if `MCP_API_KEY` env var is unset.
> Full feature-flag write access granted to anyone who knows (or reads) the key from the repo.
> Additionally: non-constant-time `!==` comparison enables timing-attack key recovery.
> Key logged in plaintext to stdout on startup.

---

## What I changed

Three targeted edits to `mcp-feature-flags/src/server-http.ts` — no other files touched, no new npm dependencies (Node.js built-in `crypto` module used):

```diff
+import crypto from "crypto";

-const API_KEY = process.env.MCP_API_KEY || "rdg564gchdhd_dhdhd12gpoong";
+// Fail-fast: require MCP_API_KEY to be explicitly set — no hardcoded fallback.
+if (!process.env.MCP_API_KEY) {
+  console.error("FATAL: MCP_API_KEY environment variable is required but not set. Exiting.");
+  process.exit(1);
+}
+const API_KEY = process.env.MCP_API_KEY;

-  if (token !== API_KEY) {
+  const tokenBuf = Buffer.from(token);
+  const keyBuf = Buffer.from(API_KEY);
+  const valid = tokenBuf.length === keyBuf.length && crypto.timingSafeEqual(tokenBuf, keyBuf);
+  if (!valid) {

-  console.log(`API key: ${API_KEY}`);
+  console.log(`API key: ${API_KEY.slice(0, 4)}${"*".repeat(Math.max(0, API_KEY.length - 4))} (set via MCP_API_KEY env var)`);
```

**Change 1 — Remove hardcoded fallback, add fail-fast** (+7 lines)
- `process.env.MCP_API_KEY || "rdg..."` → explicit check + `process.exit(1)` if unset
- Operator error: using `||` means any falsy value (empty string, `undefined`) silently activates the hardcoded key. Now there is no fallback to activate.

**Change 2 — Constant-time comparison** (+3 lines, -1 line)
- `token !== API_KEY` → `crypto.timingSafeEqual(tokenBuf, keyBuf)` with explicit length check
- Length check before `timingSafeEqual` is required: the function throws if buffers differ in length.
- Timing-safe comparison prevents remote key recovery via response-time measurement.

**Change 3 — Mask key in startup log** (1 line changed)
- `console.log(\`API key: ${API_KEY}\`)` → shows only first 4 chars + `***`
- Log line kept (per constraint "Do NOT remove existing logging") but no longer leaks the full value.

---

## Why this approach

**Trade-off 1 — `process.exit(1)` vs throw:**
- `process.exit(1)` is appropriate here because the check runs at module scope before the server starts. A `throw` would show a stack trace; `process.exit` with a clear `FATAL:` message is more ops-friendly and easier to spot in Docker/systemd logs.
- Alternative (throw + try/catch in main) would be equivalent but adds boilerplate for no benefit.

**Trade-off 2 — `crypto.timingSafeEqual` vs constant-time library:**
- `crypto` is a Node.js built-in — no new dependencies needed. `timingSafeEqual` works on `Buffer` instances and requires equal lengths, hence the explicit length check first. A mismatched length short-circuits immediately (constant time for same-length keys, fails fast for clearly-wrong lengths — acceptable trade-off).
- Alternative (`safe-compare` npm package) would work but adds a dependency for a one-liner fix.

**Trade-off 3 — Key masking in logs:**
- Showing first 4 chars lets ops verify *which* key is active (useful when rotating) without exposing the full secret.
- Alternative (log nothing) would make debugging harder in production.

**What was NOT changed (per constraints):**
- Public API: `401 { error: "Unauthorized" }` response shape preserved ✅
- Error handling logic: `res.writeHead(401)` / `res.end()` block untouched ✅
- Routing logic: `/mcp`, `/health`, 404 paths unchanged ✅
- No other files touched ✅
- No new npm dependencies (`crypto` is built-in) ✅

---

## Test status

All **12/12** characterization tests pass on the fixed code:

```
# tests 12
# suites 2
# pass 12
# fail 0
# duration_ms 5954
```

**Test breakdown:**
| # | Test name | Result |
|---|---|---|
| 1 | PRESERVED: env-var key grants /health → 200 | ✅ |
| 2 | PRESERVED: Bearer prefix stripped case-insensitively | ✅ |
| 3 | PRESERVED: x-api-key header accepted | ✅ |
| 4 | PRESERVED: wrong key → 401 `{"error":"Unauthorized"}` | ✅ |
| 5 | PRESERVED: empty Authorization → 401 | ✅ |
| 6 | PRESERVED: missing header → 401 | ✅ |
| 7 | PRESERVED: /health behind auth | ✅ |
| 8 | PRESERVED: unknown route with valid key → 404 | ✅ |
| 9 | PRESERVED: whitespace around key silently absorbed | ✅ |
| 10 | FIXED: old hardcoded key rejected → 401 | ✅ |
| 11 | FIXED: startup log masks key (prefix + asterisks) | ✅ |
| 12 | FIXED: server exits with non-zero code if MCP_API_KEY unset | ✅ |

Test file: `homework-m6/stage2-fix-top3/tests/test-hardcoded-api-key.mjs`
Run: `node --test homework-m6/stage2-fix-top3/tests/test-hardcoded-api-key.mjs`

---

## Lessons learned

1. **`||` with env vars is dangerous for secrets.** The pattern `process.env.SECRET || "fallback"` is common in tutorials and looks harmless, but means the fallback activates on _any_ falsy value — empty string, missing key, or a typo in the env var name. Fail-fast is always the right default for required secrets.

2. **Characterization tests caught the fail-fast boundary precisely.** When updating the tests to run with a valid key after the fix, the test for "empty key activates fallback" naturally became "server exits non-zero" — no guessing needed. The test structure made the behavioral contract explicit in both directions.

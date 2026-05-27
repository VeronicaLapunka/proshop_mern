# Fix #3 — $regex injection (ReDoS + full collection scan)

## Original finding (from synthesis.md)

**File:** `backend/controllers/productController.js:14`
**Severity:** HIGH | **OWASP:** A03 Injection (NoSQL/ReDoS)
**Sources:** security-mate (HIGH), performance-mate (HIGH)

> `$regex: req.query.keyword` — attacker hangs event loop with catastrophic backtracking patterns
> AND triggers TWO full collection scans (countDocuments + find) on every search with no index on `Product.name`.
> Fix: Escape metacharacters; add input length limit (≤100 chars); add MongoDB `$text` index on product name.

---

## What I changed

One targeted block in `getProducts` in `backend/controllers/productController.js` — no other files touched:

```diff
-  const keyword = req.query.keyword
+  // Sanitize keyword: cap length and escape regex metacharacters to prevent ReDoS
+  const rawKeyword = req.query.keyword
+  const safeKeyword =
+    rawKeyword && typeof rawKeyword === 'string'
+      ? rawKeyword.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
+      : null
+
+  const keyword = safeKeyword
     ? {
         name: {
-          $regex: req.query.keyword,
+          $regex: safeKeyword,
           $options: 'i',
         },
       }
     : {}
```

**Change 1 — Length cap: `.slice(0, 100)`**
- Limits the regex string MongoDB must evaluate to 100 characters max.
- Prevents the primary ReDoS attack vector: a crafted 10,000-char pattern that causes exponential backtracking in MongoDB's regex engine.
- Truncates silently (no error) — legitimate searches use far fewer chars.

**Change 2 — Metacharacter escaping: `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`**
- The standard ECMAScript regex escape pattern (same one proposed for `RegExp.escape()` in TC39).
- Escapes all 12 regex metacharacters: `. * + ? ^ $ { } ( ) | [ ] \`
- After escaping, `.*` → `\.\*`, `^A` → `\^A`, `(iphone|airpods)` → `\(iphone\|airpods\)` — all treated as literal strings.
- The MongoDB `$regex` with `$options: 'i'` still works for case-insensitive substring search; only metacharacter interpretation is removed.

**Change 3 — Type guard: `typeof rawKeyword === 'string'`**
- Express query params can occasionally be arrays if `?keyword=a&keyword=b` is sent.
- Guard prevents `Array.prototype.slice` being called on a non-string, avoiding a potential 500.

**What was NOT addressed in this fix (scope boundary):**
- Full collection scan (no index on `Product.name`) — adding a MongoDB index requires a schema migration/seed step outside this controller file. Noted as separate work.
- `$text` index — would require schema change in `productModel.js` (out of scope for this constraint: "Do NOT touch any other files unless explicitly required").

---

## Why this approach

**Trade-off 1 — Escape vs reject:**
- Rejecting requests with special chars (return 400) would break legitimate searches containing hyphens, parentheses, etc. (e.g. `"Sony PlayStation (4 Pro)"`). Silent escaping preserves UX while removing the security risk.
- The trade-off: a user searching for literal `.*` now gets 0 results instead of all products. This is the correct behavior — they were getting a regex wildcard match before, which was unintended.

**Trade-off 2 — 100-char limit vs shorter:**
- 100 chars covers the longest plausible product search query. A ReDoS payload needs thousands of chars to cause significant backtracking. 100 is a practical ceiling that blocks the attack surface without impacting real users.
- Alternative (50 chars) would be more conservative but could clip some legitimate long searches.

**Trade-off 3 — `$regex` vs `$text` index:**
- `$text` index would be the proper long-term fix (full-text search, no regex, indexed). But it requires: (a) changing `productModel.js` — violates "Do NOT touch other files", (b) running a migration, (c) changing query syntax. Out of scope for this focused fix.
- The escaped `$regex` still does a full collection scan but eliminates the injection/ReDoS risk. The performance concern (full scan) is a separate ticket.

**What was NOT changed (per constraints):**
- Public API: response shape `{ products, page, pages }` preserved ✅
- Pagination logic (`pageSize`, `pageNumber`) unchanged ✅
- `$options: 'i'` (case-insensitive) preserved ✅
- No other files touched (`productModel.js`, routes, etc.) ✅
- No new dependencies ✅

---

## Test status

All **11/11** characterization tests pass on the fixed code:

```
# tests 11
# suites 1
# pass 11
# fail 0
# duration_ms 787
```

| # | Test name | Result |
|---|---|---|
| 1 | CURRENT: no keyword returns all products with pagination metadata | ✅ |
| 2 | CURRENT: normal keyword search returns matching products | ✅ |
| 3 | CURRENT: keyword search is case-insensitive | ✅ |
| 4 | CURRENT: pageNumber param controls pagination | ✅ |
| 5 | CURRENT: response shape is `{ products, page, pages }` | ✅ |
| 6 | FIXED: `.*` treated as literal → 0 matches | ✅ |
| 7 | FIXED: `^A` treated as literal → 0 matches | ✅ |
| 8 | FIXED: keyword truncated to 100 chars | ✅ |
| 9 | FIXED: `(iphone\|airpods)` treated as literal → 0 matches | ✅ |
| 10 | CURRENT: empty keyword → returns all products | ✅ |
| 11 | CURRENT: invalid pageNumber defaults to page 1 | ✅ |

Test file: `homework-m6/stage2-fix-top3/tests/test-regex-injection.mjs`
Run: `node --test homework-m6/stage2-fix-top3/tests/test-regex-injection.mjs`

---

## Lessons learned

1. **The escape regex `/[.*+?^${}()|[\]\\]/g` is the correct standard pattern** — it's the exact set of metacharacters defined in the ECMAScript spec and covers every character MongoDB's regex engine interprets specially. Using a partial escape list (e.g. only `.` and `*`) creates a false sense of security.

2. **Characterization tests for injection bugs need to prove the exploit works on unfixed code** — tests 6-9 were written first to assert the *vulnerable* behavior (`.*` matches all, `^A` anchors), then flipped after the fix to assert the *safe* behavior (0 results). Without this two-phase approach, it's easy to write a test that passes on both vulnerable and fixed code for the wrong reasons.

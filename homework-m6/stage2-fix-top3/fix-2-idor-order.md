# Fix #2 — IDOR on GET /api/orders/:id

## Original finding (from synthesis.md)

**File:** `backend/controllers/orderController.js:43`
**Severity:** HIGH | **OWASP:** A01 Broken Access Control
**Sources:** security-mate, architecture-mate

> `getOrderById` performs no ownership check. Any authenticated user can read any other user's order
> (shipping address, items, payer email) by guessing ObjectIds.
> Fix: `if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin)` → 401

---

## What I changed

One targeted block added inside `getOrderById` in `backend/controllers/orderController.js` — no other files touched:

```diff
   if (order) {
+    // Ownership check: only the order owner or an admin may view the order
+    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
+      res.status(401)
+      throw new Error('Not authorized to view this order')
+    }
     res.json(order)
   } else {
     res.status(404)
```

**What the guard does (+4 lines):**
1. `order.user._id.toString()` — after `.populate('user', 'name email')` the `user` field is a populated object; `.toString()` normalises the ObjectId to a string for comparison.
2. `req.user._id.toString()` — the authenticated user from `protect` middleware.
3. `!req.user.isAdmin` — admins bypass the ownership check (admin dashboard must see all orders).
4. Sets `res.status(401)` before throwing so `errorHandler` returns 401 (not the default 500). Follows the existing pattern in the codebase (`res.status(NNN)` → `throw new Error(...)`).

---

## Why this approach

**Trade-off 1 — 401 vs 403:**
- The codebase consistently returns 401 for all authorization failures (see `authMiddleware.js`, `admin` middleware). Using 403 would be semantically more correct ("authenticated but forbidden"), but would introduce an inconsistency with the rest of the API. Kept 401 to preserve the existing convention documented in ADR 0001/backend/CLAUDE.md.
- The frontend auto-logout matches on `'Not authorized, token failed'` only — the new error message `'Not authorized to view this order'` does NOT trigger auto-logout. Intentional.

**Trade-off 2 — Guard position (before vs after populate):**
- The check is placed AFTER `Order.findById(...).populate(...)` — meaning we still pay the DB cost of fetching the order before rejecting the user. The alternative (raw `findById` without populate for a quick user-field check) would save one populate call but adds code complexity for a negligible gain in a low-traffic endpoint.

**Trade-off 3 — `.toString()` vs `.equals()`:**
- Mongoose ObjectId has an `.equals()` method that handles type coercion. Both work correctly. `.toString()` was chosen because it matches the pattern used elsewhere in this codebase and is explicit/readable.

**What was NOT changed (per constraints):**
- Public API: response shape for 200 (full order JSON) and 404 unchanged ✅
- Error handling pattern: `res.status(NNN)` + `throw new Error()` preserved ✅
- No other files touched ✅
- No new dependencies ✅
- `getMyOrders`, `getOrders`, `updateOrderToPaid`, `updateOrderToDelivered` not touched ✅

---

## Test status

All **8/8** characterization tests pass on the fixed code:

```
# tests 8
# suites 1
# pass 8
# fail 0
# duration_ms 1300
```

| # | Test name | Result |
|---|---|---|
| 1 | CURRENT: order owner can read their own order → 200 | ✅ |
| 2 | CURRENT: admin can read any order → 200 | ✅ |
| 3 | FIXED: different authenticated user → 401 (IDOR closed) | ✅ |
| 4 | CURRENT: unauthenticated request → 401 | ✅ |
| 5 | CURRENT: non-existent order id → 404 | ✅ |
| 6 | CURRENT: malformed ObjectId → 500 | ✅ |
| 7 | CURRENT: response includes populated user name+email | ✅ |
| 8 | CURRENT: order not found returns error message string | ✅ |

Test file: `homework-m6/stage2-fix-top3/tests/test-idor-order.mjs`
Run: `node --test homework-m6/stage2-fix-top3/tests/test-idor-order.mjs`

---

## Lessons learned

1. **IDOR on ObjectIds is not "security through obscurity."** MongoDB ObjectIds embed a timestamp and are sequential — an attacker with one valid order id can trivially enumerate adjacent ids. The fix is always a server-side ownership check, never relying on ids being hard to guess.

2. **The characterization test for the vulnerability (test #3) served as both the proof of the bug AND the proof of the fix** — before the fix it asserted `status === 200` (documenting the broken behavior), after it was updated to assert `status === 401`. This two-phase pattern makes the before/after contract completely explicit.

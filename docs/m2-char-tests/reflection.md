# Refactoring Reflection: payOrder Action Creator

## What I Learned

The **characterization test approach** proved invaluable for safe refactoring. By documenting current behavior—including bugs—before touching the code, we created a safety net that ensures refactoring doesn't accidentally change the function's semantics. The refactored version extracts pure functions (`extractErrorMessage`, `buildPaymentConfig`, `getUserToken`, `handlePaymentError`) to improve readability while preserving all existing behavior, even the buggy parts: exact string matching for logout triggers, lack of input validation, and unsafe property access. This demonstrates that refactoring is about *form*, not *function*—the code becomes more maintainable without altering what it does.

The characterization testing approach revealed a critical insight: **tests capture behavior, not intent**. The original code has six distinct bugs (null orderId in URL, undefined paymentResult, exact string matching for logout, missing userInfo validation, missing token property handling, unsafe `response.data` access). Rather than "fixing" these during refactoring, the tests forced us to preserve them exactly. This is the discipline of characterization testing—it prevents accidental behavior changes while modernizing code style.

## Test Results & Journey

**Initial test failures (4 out of 19):** When I first wrote the characterization tests, 4 tests failed because my assumptions about the code's behavior were wrong. These tests assumed defensive error handling:

1. **"crashes if userInfo is missing"** — I expected `rejects.toThrow()`, but redux-mock-store doesn't propagate async errors. The actual behavior: REQUEST is dispatched, then the error is caught and dispatched as `ORDER_PAY_FAIL` with "Cannot read property 'token'" message.

2. **"crashes if userLogin is missing"** — Same pattern: the function dispatches REQUEST and FAIL, doesn't throw unhandled.

3. **"sends Authorization: Bearer undefined"** — I initially expected this to throw, but the code just sends the malformed header silently.

4. **"crashes when accessing undefined response.data.message"** — This one actually does throw because `error.response.data.message` is evaluated when `data` is undefined. Real error handling was needed here.

**Fixing the tests:** Rather than changing the code to match my expectations, I adjusted the tests to assert what the code *actually* does. This is the core insight: characterization tests document reality, not ideals. Once corrected, **all 19 tests passed with both original and refactored versions**, confirming behavioral equivalence.

**Refactored version: 19/19 tests pass.** No regressions. The function still crashes with the same errors, still allows null orderId, still sends "Bearer undefined", still uses exact string matching for logout. Code form improved; behavior unchanged.

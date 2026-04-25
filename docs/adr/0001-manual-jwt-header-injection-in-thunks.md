# ADR 0001: Manual JWT Header Injection in Every Redux Thunk

**Status:** Accepted  
**Confidence:** HIGH (explicitly implemented in all protected action creators)  
**Date:** 2026-04-25

## Context

The application protects API endpoints using JWT (JSON Web Tokens) in the `Authorization: Bearer <token>` header. Every Redux Thunk action creator that calls a protected endpoint must send the user's JWT token.

In most web applications, this cross-cutting concern is handled via HTTP client middleware (e.g., Axios request interceptors). However, ProShop implements JWT injection manually in every thunk action creator:

**Example from `frontend/src/actions/orderActions.js` (lines 31-40):**
```javascript
const { userLogin: { userInfo } } = getState()
const config = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userInfo.token}`,
  },
}
const { data } = await axios.post(`/api/orders`, order, config)
```

This pattern is replicated in every protected action:
- `createOrder()`, `getOrderDetails()`, `payOrder()`, `deliverOrder()`, `listMyOrders()`, `listOrders()`
- `getUserDetails()`, `updateUserProfile()`, `listUsers()`, `deleteUser()`, `updateUser()`
- `getProductDetails()`, `createProductReview()`, `deleteProduct()`, `createProduct()`, `updateProduct()`

## Decision

Manual JWT injection in every thunk action creator, rather than using Axios interceptors or middleware.

### Why This Pattern Was Chosen

1. **Explicit visibility** — The auth requirement is immediately obvious at the call site
2. **Per-action control** — Different actions can handle auth failures differently (e.g., auto-logout on token expiry)
3. **No global state mutation** — Reduces coupling between HTTP client and Redux
4. **Simplicity** — No need to configure interceptors at app startup

## Alternatives Considered

### 1. Axios Request Interceptor
```javascript
// frontend/src/index.js (app initialization)
axios.interceptors.request.use((config) => {
  const { userInfo } = store.getState().userLogin
  if (userInfo?.token) {
    config.headers.Authorization = `Bearer ${userInfo.token}`
  }
  return config
})
```

**Pros:**
- DRY: token injection happens once, not repeated in every action
- Consistent: all requests automatically include token
- Industry standard approach

**Cons:**
- Less visible at call site; harder to understand why a request needs auth
- Global state dependency (store instance)
- Error handling must also be centralized

### 2. Redux Middleware for HTTP Requests
Create custom middleware to intercept async actions and inject headers automatically.

**Pros:**
- Redux-native approach
- Clear separation of concerns

**Cons:**
- More boilerplate to implement
- Still couples Redux to HTTP client internals
- Higher complexity for error handling

### 3. Server-side Session (with httpOnly Cookie)
Store JWT in a secure, httpOnly cookie instead of localStorage.

**Pros:**
- XSS-protected (browser JS cannot read the token)
- Automatic inclusion in requests by browser
- No manual header injection needed

**Cons:**
- Requires CSRF token protection
- Tighter coupling between frontend and backend
- Less suitable for SPAs with CORS

### 4. Custom HTTP Client Wrapper
```javascript
// apiClient.js
export const authenticatedPost = (endpoint, data) => {
  const { userInfo } = store.getState().userLogin
  return axios.post(endpoint, data, {
    headers: { Authorization: `Bearer ${userInfo.token}` }
  })
}
```

**Pros:**
- Reduces some boilerplate in action creators
- Single point to modify auth behavior

**Cons:**
- Still manual but less explicit
- Doesn't eliminate the pattern, just abstracts it

## Consequences

### Positive
- **Explicit and searchable** — Auth requirements are visible in every action; grep for "Authorization" finds all protected endpoints
- **Debuggable** — Token injection is straightforward to trace in Redux DevTools + Network tab
- **Error string matching** — Each action can match the exact error message `'Not authorized, token failed'` and trigger logout
- **No interceptor registration** — No runtime dependency on global state being available

### Negative
- **High boilerplate** — 5+ lines of repetitive code in every protected action
- **Magic string coupling** — Frontend auto-logout depends on backend returning exact error: `'Not authorized, token failed'` (line 58 in orderActions.js). Renaming this string silently breaks logout across the app.
- **Maintenance burden** — Adding a new auth parameter (e.g., API key, custom header) requires updating every action
- **Inconsistency risk** — If a developer forgets to include the auth header, no error signals this until testing reveals the 401
- **Token always in memory** — No protection against XSS; malicious script can read `getState().userLogin.userInfo.token`

## Related Decisions

- **ADR 0002:** Selective state persistence explains why `userInfo.token` must be hydrated from localStorage into Redux at startup
- **Error handling pattern:** The specific error string `'Not authorized, token failed'` in `backend/middleware/authMiddleware.js` line 23 is a critical cross-cutting dependency

## Implementation Notes

- **Token extraction:** `getState()` is called on every action invocation. Token must be available in state at call time, or the action will send `Authorization: Bearer undefined`.
- **Error handling:** All action creators catch `error.response?.data.message` and check if it equals `'Not authorized, token failed'` before dispatching logout. This is a brittle coupling point.
- **No retry logic:** If token is invalid, there is no attempt to refresh. User is logged out immediately.

## Potential Future Changes

If the codebase grows to >20 protected actions, consider:
1. Axios interceptor (simplest refactor, no behavior change)
2. Custom HTTP client wrapper (more testable, still explicit)
3. Migration to httpOnly cookies (requires backend change to set `Set-Cookie`)

## See Also

- `frontend/src/actions/orderActions.js` — exemplar implementation
- `frontend/src/actions/userActions.js` — another protected domain
- `backend/middleware/authMiddleware.js` — where the error message is defined

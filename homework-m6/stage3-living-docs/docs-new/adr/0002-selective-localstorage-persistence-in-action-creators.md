# ADR 0002: Selective localStorage Persistence in Action Creators

**Status:** Accepted  
**Confidence:** HIGH (explicitly implemented with manual localStorage.setItem calls)  
**Date:** 2026-04-25

## Context

The application needs to persist some user state across page refreshes (so users don't lose their cart), but not all state (product lists, order details, etc. should be fresh). The persistence strategy is split into two parts:

1. **Initialization** (`frontend/src/store.js` lines 56-70) — hydrate persisted state from localStorage into Redux initial state
2. **Updates** (`frontend/src/actions/cartActions.js`, `userActions.js`) — manually write to localStorage after every state change

**Example from `frontend/src/store.js`:**
```javascript
const cartItemsFromStorage = localStorage.getItem('cartItems')
  ? JSON.parse(localStorage.getItem('cartItems'))
  : []
const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null
const shippingAddressFromStorage = localStorage.getItem('shippingAddress')
  ? JSON.parse(localStorage.getItem('shippingAddress'))
  : {}
const paymentMethodFromStorage = localStorage.getItem('paymentMethod')
  ? JSON.parse(localStorage.getItem('paymentMethod'))
  : null
```

**Example from `frontend/src/actions/cartActions.js` (lines 24, 33, 42, 51):**
```javascript
export const addToCart = (id, qty) => async (dispatch, getState) => {
  // ... dispatch action ...
  localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
}
export const removeFromCart = (id) => (dispatch, getState) => {
  // ... dispatch action ...
  localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
}
export const saveShippingAddress = (data) => (dispatch) => {
  // ... dispatch action ...
  localStorage.setItem('shippingAddress', JSON.stringify(data))
}
export const savePaymentMethod = (data) => (dispatch) => {
  // ... dispatch action ...
  localStorage.setItem('paymentMethod', JSON.stringify(data))
}
```

Only 4 slices are persisted:
- `cart.cartItems` — list of products in cart
- `userLogin.userInfo` — logged-in user data + JWT token
- `cart.shippingAddress` — delivery address
- `cart.paymentMethod` — payment method selection

All other state is ephemeral and lost on refresh:
- Product details and search results
- Order history
- Admin lists
- Notifications

## Decision

Explicitly persist only essential checkout state (cart, shipping, payment, user auth) to localStorage, via manual `localStorage.setItem()` calls in action creators. Hydrate on store initialization.

## Rationale

This approach was chosen to balance two concerns:
1. **User experience** — Don't lose cart or login across page refresh
2. **Data freshness** — Product listings, order details, etc. should be fetched fresh on each session

## Alternatives Considered

### 1. Redux Persist Middleware
```javascript
// Automatic persistence of entire Redux tree
import persistStore from 'redux-persist'
const persistor = persistStore(store, {
  whitelist: ['cart', 'userLogin'],
})
```

**Pros:**
- No boilerplate in action creators
- Single configuration point
- Industry standard (used in many apps)
- Automatic sync: every state change → localStorage

**Cons:**
- Hidden side effects; developers may not realize persistence happens automatically
- Entire Redux state is serialized on every action (performance impact)
- Requires additional library and setup
- Harder to debug (where did this value come from? Redux? localStorage?)

### 2. No Persistence (Always Fetch)
Remove localStorage entirely; always refetch user profile and cart from backend.

```javascript
// On app startup
axios.get('/api/users/profile').then(data => {
  dispatch(setUserInfo(data))
})
```

**Pros:**
- Single source of truth: backend always authoritative
- No localStorage XSS vulnerability
- Simpler Redux logic (no hydration)

**Cons:**
- Cart is cleared on every page reload (poor UX)
- Extra API call on every startup (slower for authenticated users)
- User must re-login on every session (backend session, not token)
- Mobile users on slow connections have poor experience

### 3. Server-side Persistence with httpOnly Cookies
Store JWT and user data in a secure, httpOnly cookie. Fetch user profile on startup.

```javascript
// Backend sets secure cookie on login
res.cookie('authToken', jwt, {
  httpOnly: true,
  secure: true,  // HTTPS only
  sameSite: 'strict'
})
```

**Pros:**
- XSS-safe (browser JS cannot read token)
- CSRF protection available (token rotation per request)
- Server controls token expiry (client cannot override)
- No frontend localStorage management needed

**Cons:**
- Requires backend changes (new cookie middleware, CORS adjustment)
- Tighter backend/frontend coupling (cookies travel in all requests)
- Requires CSRF token for POST/PUT/DELETE
- Not suitable for cross-domain APIs (CORS restriction)

### 4. IndexedDB for Larger State
```javascript
// More storage (MB vs KB), structured querying
import Dexie from 'dexie'
const db = new Dexie('proshop')
await db.cart.put({ items: state.cart.cartItems })
```

**Pros:**
- Can persist large objects and relationships
- Async API prevents main thread blocking
- Browser quota is larger than localStorage

**Cons:**
- Additional library dependency
- Async operations (useState overhead in React)
- Overkill for ProShop's minimal data
- Less supported in older browsers

### 5. Session Storage Only
```javascript
// Data lost when tab closes
localStorage → sessionStorage
```

**Pros:**
- Simpler mental model (session is atomic unit)
- Automatic cleanup (browser deletes on tab close)

**Cons:**
- Cart lost when user closes and reopens browser (bad UX)
- No persistence across browser sessions

## Consequences

### Positive
- **Explicit control** — Every persistence point is visible in the action creator; developers know exactly what gets saved
- **Minimal storage footprint** — Only essential checkout state in localStorage (~5 KB), not entire Redux tree
- **Debuggable** — Redux DevTools + browser DevTools localStorage tab show exactly what persists
- **No hidden side effects** — No middleware running in the background; cause and effect are adjacent

### Negative
- **Boilerplate** — Developers must remember to call `localStorage.setItem()` after every state change for persisted slices
- **Inconsistency risk** — If a developer updates a reducer but forgets the localStorage call, the data is lost on refresh. No error signals this.
- **Manual hydration** — Store initialization logic is verbose (lines 56-70); easy to forget a slice
- **XSS vulnerability** — `localStorage.getItem('userInfo')` returns a plain string containing JWT token. Malicious XSS script can read it: `JSON.parse(localStorage.getItem('userInfo')).token`
- **Stale data potential** — If backend and localStorage diverge (e.g., user's address was updated in another tab), the wrong data is used until next fetch
- **No optimistic updates** — Cart is only synced to localStorage *after* Redux state updates; offline scenarios are not handled

### Behavioral Gaps
- **paymentMethod edge case** — The payment method is saved to localStorage in `savePaymentMethod()` (cartActions.js line 51), but the frontend had a bug where it wasn't being rehydrated from localStorage. This was fixed in commit b697dcd, which added `paymentMethodFromStorage` to store.js.

## Related Decisions

- **ADR 0001:** Manual JWT injection is necessary because `userInfo.token` is stored in localStorage and must be extracted at action time
- **Cart state shape:** `state.cart.cartItems` vs. `state.cartItems` was influenced by persistence requirements; grouping related data simplifies hydration

## Implementation Notes

- **Serialization:** All persisted data is JSON-serializable (strings, objects, arrays). No class instances or functions.
- **Hydration order:** localStorage is read in store.js *before* the reducer is applied, so initial state correctly reflects user's previous session
- **Storage limit:** localStorage quota is 5-10 MB per origin. ProShop uses <1 MB.
- **No encryption:** localStorage data is plaintext; XSS or browser tools can inspect it

## Known Issues

1. **Circular hydration** — `paymentMethod` is saved in action, hydrated in store, but the initial Redux state initialization (lines 72-79) would overwrite it if hydration happened after reducer initialization. Currently works because hydration is in `initialState` parameter.

## Potential Future Changes

If user experience becomes an issue:
1. Persist more state (product search filters, order page state) — consider Redux Persist middleware
2. Implement IndexedDB for cross-session persistence of large datasets
3. Migrate JWT to httpOnly cookie (requires backend changes)
4. Add conflict resolution if same user logs in multiple tabs (server-side session)

## See Also

- `frontend/src/store.js` lines 56-79 — hydration logic
- `frontend/src/actions/cartActions.js` — exemplar persistence calls
- `frontend/src/actions/userActions.js` — where `userInfo` is persisted
- Commit b697dcd — bugfix for paymentMethod not being hydrated

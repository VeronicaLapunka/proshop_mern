# Frontend CLAUDE.md

Frontend-specific architecture, Redux patterns, and code review rules.

## Architecture

The frontend uses Redux for centralized state management:

- **`store.js`**: Redux store combining all reducers; initial cart/user state loaded from localStorage
- **`actions/`**: Redux action creators organized by domain (products, users, orders, cart)
- **`reducers/`**: Redux reducers, one file per domain
- **`components/`**: Reusable UI components (Header, Footer, ProductCarousel, Rating, etc.)
- **`screens/`**: Full-page components for each route (`*Screen.js`)
- **`constants/`**: Redux action type string constants, one file per domain
- **`index.js`**: React app entry point with Redux store provider

**Tech notes:**

- Redux Thunk for async action creators
- React Router v5 for client-side routing
- Bootstrap via `react-bootstrap`
- PayPal via `react-paypal-button-v2`
- `react-scripts` v3 (webpack 4) — requires `NODE_OPTIONS=--openssl-legacy-provider` on Node 17+ (already set in `package.json`)

## Redux Patterns

- **Action creators** (in `actions/`) are thunk functions that dispatch a REQUEST action, await the async call, then dispatch SUCCESS or FAIL.
- **State shape** for async operations: `{ loading, error, <data> }`. Mutation operations (create, update, delete) add `success: true` on SUCCESS.
- **RESET action** — every mutation reducer needs a RESET action type to clear stale `success: true` before re-entry (e.g. re-opening a form).
- **No selector functions** — components access state directly as `state.domainName.fieldName`.
- **localStorage persistence** — cart items and `userInfo` are written to localStorage in `store.js` and rehydrated on load.

## Code Review Rules

- **New authenticated actions must manually extract the token** — there is no axios interceptor. Every thunk calling a protected endpoint must do:
  ```js
  const {
    userLogin: { userInfo },
  } = getState();
  // then pass:
  {
    headers: {
      Authorization: `Bearer ${userInfo.token}`;
    }
  }
  ```
- **New reducers must follow the `{ loading, error, <data> }` shape** — mutation reducers also need `success: true` on SUCCESS and a RESET action type.
- **Error extraction must use the two-part pattern**:
  ```js
  error.response && error.response.data.message
    ? error.response.data.message
    : error.message;
  ```
  Do not simplify to optional chaining — the pattern must stay consistent across all actions.
- **Add constants before actions/reducers** — action type strings live in `frontend/src/constants/`. Never inline strings; add a constant first.
- **`react-scripts` v3 is incompatible with OpenSSL 3 (Node 17+)** — the `NODE_OPTIONS=--openssl-legacy-provider` flag is baked into `frontend/package.json` scripts. If invoking `react-scripts` via any other path, add the flag manually or use Node 16.

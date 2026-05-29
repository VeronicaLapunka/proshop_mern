# ProShop MERN Architecture Specification — 4 Key Modules

## Overview

This document defines the architecture of four critical modules in the ProShop MERN eCommerce platform:
1. **Backend Express Routing + Middleware Orchestration** — HTTP request dispatch and async error handling
2. **Frontend Redux Thunk Actions + State Management** — centralized state, async actions, localStorage persistence
3. **Feature Flags System (features.json + MCP server)** — runtime feature control with 25 flags
4. **MCP Docs-Search Integration (RAG Pipeline)** — vector-backed documentation search

Each section contains a 2–3 paragraph technical description, flow diagrams, key files, integration points, and known constraints.

---

## Module 1: Backend Express Routing + Middleware Orchestration

### Architecture Description

The backend uses Express.js to register five route groups (products, users, orders, uploads, featureFlags) via middleware stacking in `server.js`. Each route file exports a router that defines multiple endpoints; controllers wrap async handlers with `express-async-handler` to catch thrown errors and forward them to the global error middleware. The middleware chain follows a strict order: request enters through morgan logging → `express.json()` for body parsing → static file serving → route handlers, and any error thrown in a controller is caught by the asyncHandler, which calls `next(error)`, triggering the `errorHandler` middleware at the end. The `errorHandler` reads `res.statusCode` (set by the controller before throwing) and returns a JSON response with the error message.

Authentication uses two chained middleware functions: `protect` extracts the JWT from the `Authorization: Bearer <token>` header, verifies it with `jwt.verify()`, queries the User document from MongoDB, and sets `req.user`. Critically, `admin` middleware must always follow `protect` because it depends on `req.user` being populated. If a route needs admin-only access, it must use both: `router.delete('/:id', protect, admin, deleteProduct)`. The `notFound` middleware catches unmatched routes and creates a 404 error.

**Known bug:** `/api/products/top` is registered *after* `/:id` in `productRoutes.js` (line 16 after line 18–21), so Express treats the string `"top"` as a parametric id instead of matching the static route. The frontend's `listTopProducts` action calls `/api/products/top` and will fail with a CastError. This is a classic Express gotcha: static routes must be registered before parametric routes.

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client HTTP Request                          │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
        ┌──────────────┐
        │  morgan('dev')│ Log (dev only)
        └────┬─────────┘
             │
             ▼
    ┌────────────────────┐
    │ express.json()     │ Parse JSON body
    └────┬───────────────┘
         │
         ▼
  ┌────────────────────────┐
  │ static /uploads        │ Serve image files
  └────┬───────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │     Route Dispatch (5 route groups)     │
  ├─────────────────────────────────────────┤
  │  /api/products    (productRoutes)       │
  │  /api/users       (userRoutes)          │
  │  /api/orders      (orderRoutes)         │
  │  /api/upload      (uploadRoutes)        │
  │  /api/feature-flags (featureFlagRoutes) │
  └────┬──────────────────────────────────┬─┘
       │                                  │
       ▼ (for protected routes)           │
  ┌──────────────────────────────────┐    │
  │   protect Middleware              │    │ (public routes)
  │  • Extract JWT from Bearer header │    │
  │  • jwt.verify(token)              │    │
  │  • req.user = User.findById(id)   │    │
  └────┬─────────────────────────────┘    │
       │                                  │
       ▼ (if admin needed)                 │
  ┌──────────────────────────────────┐    │
  │   admin Middleware                │    │
  │  • Check req.user.isAdmin === true│    │
  │  • Call next() or throw Error     │    │
  └────┬─────────────────────────────┘    │
       │                                  │
       ├──────────────────────────────────┘
       ▼
   ┌────────────────────────────────┐
   │  Controller (asyncHandler)      │
   │  • Execute async DB logic       │
   │  • Throw Error if validation    │
   │  • res.json(data) on success    │
   └────┬─────────────────────────────┘
        │
        ├─ Success: res.json(data) ────────────┐
        │                                      │
        └─ Error thrown ──────────────────────┐│
                                              │▼
                                    ┌─────────────────────┐
                                    │  expressAsyncHandler│
                                    │  Catches error,     │
                                    │  calls next(error)  │
                                    └────────┬────────────┘
                                             │
                                             ▼
                                    ┌──────────────────────┐
                                    │  notFound Middleware │
                                    │  (if no route match) │
                                    └────┬─────────────────┘
                                         │
                                         ▼
                                    ┌──────────────────────┐
                                    │  errorHandler        │
                                    │  • Read statusCode   │
                                    │  • Default to 500    │
                                    │  • res.json(error)   │
                                    └──────────────────────┘
```

### Code Flow Example: Admin Delete Product

```
DELETE /api/products/:id (Admin-only)

1. Client sends Authorization: Bearer <token>
2. Express routes to productRoutes → router.delete('/:id', protect, admin, deleteProduct)
3. protect middleware:
   - Extracts token from header
   - Calls jwt.verify(token, JWT_SECRET)
   - Sets req.user = User.findById(decoded.id)
   - Calls next()
4. admin middleware:
   - Checks if req.user.isAdmin === true
   - If true, calls next()
   - If false, sets res.status(401) and throws new Error('Not authorized as an admin')
5. deleteProduct controller (wrapped by asyncHandler):
   - Finds Product by req.params.id
   - If found: product.remove() → res.json({ message: 'Product removed' })
   - If not found: sets res.status(404) and throws new Error('Product not found')
6. If error thrown:
   - asyncHandler catches it
   - Calls next(error)
   - errorHandler middleware runs
   - Reads res.statusCode (404 or 401)
   - Returns { message: error.message, stack: (dev only) }
```

### Key Files

| File Path | Role |
|-----------|------|
| `/backend/server.js` | Express app initialization; imports & registers 5 route groups; middleware stack order (morgan → json → static → routes → error handlers) |
| `/backend/middleware/authMiddleware.js` | `protect` (JWT extraction, User lookup); `admin` (isAdmin check); depends on `Authorization: Bearer` header format |
| `/backend/middleware/errorMiddleware.js` | `notFound` (404 handler); `errorHandler` (global error formatter; reads res.statusCode, defaults to 500) |
| `/backend/routes/productRoutes.js` | 5 endpoints: GET /, POST / (admin), GET /:id, DELETE /:id (admin), PUT /:id (admin), POST /:id/reviews (auth), GET /top (public, **registered after /:id** — BUG) |
| `/backend/routes/userRoutes.js` | 5 endpoints: POST / (register), POST /login, GET /profile (auth), PUT /profile (auth), GET /:id (admin), PUT /:id (admin), DELETE /:id (admin) |
| `/backend/routes/orderRoutes.js` | 5 endpoints: POST / (auth), GET / (admin), GET /myorders (auth), GET /:id (auth), PUT /:id/pay (auth), PUT /:id/deliver (admin) |
| `/backend/routes/uploadRoutes.js` | POST / (multer single image upload); stores to disk at `uploads/`; no auth middleware |
| `/backend/routes/featureFlagRoutes.js` | 3 endpoints: GET / (admin), GET /:name (public), PATCH /:name/status (admin), PATCH /:name/traffic (admin); reads/writes `features.json` |

### Integration Points

- **Error handling chain**: All controllers must use `asyncHandler`. Calling `res.status(NNN)` before throwing is required so errorHandler reads the correct code.
- **Auth chain**: `admin` must follow `protect`. Never apply `admin` alone; always pair them.
- **Route ordering**: Static routes registered before parametric routes (not followed for `/top` — known bug).
- **Feature flags backend**: `featureFlagRoutes` reads/writes `features.json` on every request; MCP server reads the same file for live state.

### Known Bugs & Constraints

1. **`/top` route CastError** — Route order in `productRoutes.js` (line 16 after line 18) causes Express to treat `/top` as an id. Triggers `CastError: Cast to ObjectId failed for value "top"` in `getProductById`.
2. **No CORS middleware** — Frontend and backend must be on same origin in production (Express serves React build).
3. **Multer writes to ephemeral disk** — `uploadRoutes` stores images to `uploads/` directory. On ephemeral filesystems (Heroku, cloud containers), files are lost on restart. Production needs S3/Cloudinary.
4. **Error string is hardcoded** — `'Not authorized, token failed'` is matched by frontend logout logic; renaming it breaks auto-logout across all thunks.

---

## Module 2: Frontend Redux Thunk Actions + State Management

### Architecture Description

The frontend uses Redux with Thunk middleware to manage centralized state across 5 domains (product, user, order, cart, featureFlag), each with its own reducer file. The store shape is initialized from `store.js`, which combines all reducers and hydrates `cartItems`, `userInfo`, `shippingAddress`, and `paymentMethod` from localStorage. Each async operation follows a three-action pattern: `*_REQUEST` (set `loading: true`), `*_SUCCESS` (set `loading: false` + data), and `*_FAIL` (set `loading: false` + error message). Mutation operations (create, update, delete) add `success: true` on SUCCESS, allowing components to reset forms. When a user re-enters a form, a `*_RESET` action clears `success: true`, enabling the form to be submitted again.

The thunk action creators (22 total across 5 files) manually extract the JWT token from `getState().userLogin.userInfo.token` and add it to the `Authorization: Bearer <token>` header for each protected request. There is no axios interceptor; every thunk implements the same manual pattern. Error handling is consistent: catch blocks use `error.response && error.response.data.message ? error.response.data.message : error.message`. If the error message is the exact string `'Not authorized, token failed'`, the thunk dispatches `logout()`, which clears localStorage, resets multiple slices of state, and redirects to `/login`. Cart actions do not use `getState()` to extract the token; instead, they dispatch CART_ADD_ITEM, CART_REMOVE_ITEM, etc., which the cartReducer handles purely locally.

### Redux State Shape Diagram

```
store.getState() =
{
  ┌─ Product Domain ────────────────────────┐
  │ productList: {                          │
  │   loading: bool,                        │
  │   error: string?,                       │
  │   products: Product[],                  │
  │   pages: number,                        │
  │   page: number,                         │
  │ }                                       │
  │ productDetails: {                       │
  │   loading: bool,                        │
  │   error: string?,                       │
  │   product: { reviews: [] }              │
  │ }                                       │
  │ productDelete: {                        │
  │   loading: bool,                        │
  │   error: string?,                       │
  │   success: bool? ← RESET clears this   │
  │ }                                       │
  │ productCreate/Update/ReviewCreate: idem │
  │ productTopRated: { loading, error, ... }│
  └─────────────────────────────────────────┘

  ┌─ User Domain ───────────────────────────┐
  │ userLogin: {                            │
  │   loading: bool,                        │
  │   error: string?,                       │
  │   userInfo: {                           │
  │     _id: string,                        │
  │     name: string,                       │
  │     email: string,                      │
  │     isAdmin: bool,                      │
  │     token: string ← JWT for all actions │
  │   }?                                    │
  │ }                                       │
  │ userRegister/Details/UpdateProfile: idem│
  │ userList/Delete/Update: idem (admin)    │
  └─────────────────────────────────────────┘

  ┌─ Order Domain ──────────────────────────┐
  │ orderCreate: {                          │
  │   loading: bool,                        │
  │   error: string?,                       │
  │   order: { _id, items, total }?         │
  │   success: bool?                        │
  │ }                                       │
  │ orderDetails/Pay/Deliver: idem          │
  │ orderListMy/orderList (admin): idem     │
  └─────────────────────────────────────────┘

  ┌─ Cart Domain ───────────────────────────┐
  │ cart: {                                 │
  │   cartItems: [{                         │
  │     product: id,                        │
  │     qty: number,                        │
  │     ...product fields                   │
  │   }],                                   │
  │   shippingAddress: { address, city... },│
  │   paymentMethod: string?                │
  │ }                                       │
  │ ← Persisted to localStorage on every    │
  │   cartReducer action                    │
  └─────────────────────────────────────────┘

  ┌─ Feature Flags Domain ──────────────────┐
  │ featureFlagList: {                      │
  │   loading: bool,                        │
  │   error: string?,                       │
  │   features: [{                          │
  │     feature_id: string,                 │
  │     name, status, traffic_percentage... │
  │   }]                                    │
  │ }                                       │
  │ featureFlagUpdateStatus/Traffic: idem   │
  └─────────────────────────────────────────┘
}
```

### Thunk Action Flow Example: deleteProduct

```
dispatch(deleteProduct(productId))
    ↓
Action Creator (deleteProduct) runs:
    const (dispatch, getState) => async {
    try:
        1. dispatch({ type: PRODUCT_DELETE_REQUEST })
           → productDeleteReducer sets { loading: true }

        2. const { userInfo } = getState().userLogin
           → Extract token from store

        3. const config = { headers: { Authorization: `Bearer ${token}` } }
           → Manually add auth header (NO interceptor)

        4. await axios.delete(`/api/products/${id}`, config)
           → Sends DELETE request with JWT

        5. dispatch({ type: PRODUCT_DELETE_SUCCESS })
           → productDeleteReducer sets { loading: false, success: true }

        6. Component sees success: true → enables "Delete Again" button

    catch (error):
        const message = error.response?.data.message ?? error.message

        if (message === 'Not authorized, token failed'):
            dispatch(logout())
            → Clears localStorage
            → dispatch(USER_LOGOUT)
            → Resets USER_DETAILS_RESET, ORDER_LIST_MY_RESET, USER_LIST_RESET
            → document.location.href = '/login'

        dispatch({ type: PRODUCT_DELETE_FAIL, payload: message })
        → productDeleteReducer sets { loading: false, error: message }
}
```

### localStorage Persistence

```
On successful login (userActions.js line 53):
  localStorage.setItem('userInfo', JSON.stringify(data))

On successful cart action (cartReducers.js, implicit via cartActions):
  cartReducer handles all CART_* actions
  → store.subscribe() or middleware saves to localStorage

On logout (userActions.js line 66–69):
  localStorage.removeItem('userInfo')
  localStorage.removeItem('cartItems')
  localStorage.removeItem('shippingAddress')
  localStorage.removeItem('paymentMethod')

On app load (store.js line 64–78):
  const cartItemsFromStorage = localStorage.getItem('cartItems')
    ? JSON.parse(localStorage.getItem('cartItems'))
    : []
  const userInfoFromStorage = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null

  initialState = { cart: { cartItems, shippingAddress, paymentMethod }, userLogin: { userInfo } }
  → Hydrates store on first render
```

### Key Files

| File Path | Lines | Role |
|-----------|-------|------|
| `/frontend/src/store.js` | 97 | Combines all 5 reducers; initializes cart/user state from localStorage; applies Thunk middleware |
| `/frontend/src/actions/productActions.js` | 248 | 7 thunks: `listProducts`, `listProductDetails`, `deleteProduct`, `createProduct`, `updateProduct`, `createProductReview`, `listTopProducts`; all use manual JWT extraction except listProducts/listProductDetails (public) |
| `/frontend/src/actions/userActions.js` | 305 | 7 thunks: `login`, `logout`, `register`, `getUserDetails`, `updateUserProfile`, `getUsers` (admin), `deleteUser` (admin), `updateUser` (admin); logout dispatches RESET actions on 4 reducers |
| `/frontend/src/actions/orderActions.js` | 263 | 6 thunks: `createOrder`, `getOrderDetails`, `payOrder`, `deliverOrder`, `listMyOrders`, `listOrders` (admin); all protected except `listOrders` (admin-only) |
| `/frontend/src/actions/cartActions.js` | 52 | 4 synchronous action creators: `addToCart`, `removeFromCart`, `saveShippingAddress`, `savePaymentMethod`; dispatches to cartReducer (no thunk, no API call) |
| `/frontend/src/actions/featureFlagActions.js` | 116 | 3 thunks: `listFeatureFlags` (admin), `updateFeatureFlagStatus` (admin), `updateFeatureFlagTraffic` (admin); manually extract JWT |
| `/frontend/src/reducers/productReducers.js` | 150+ | 7 reducers handling product domain; `productDeleteReducer`, `productCreateReducer`, `productUpdateReducer`, `productReviewCreateReducer` all handle SUCCESS → `success: true`; matching `*_RESET` actions clear success |
| `/frontend/src/reducers/userReducers.js` | 200+ | 7 reducers; `userLoginReducer` stores `userInfo` with token; logout clears all |
| `/frontend/src/reducers/cartReducers.js` | 55 | Pure local state; CART_ADD_ITEM, CART_REMOVE_ITEM, CART_SAVE_SHIPPING_ADDRESS, CART_SAVE_PAYMENT_METHOD, CART_CLEAR_ITEMS |
| `/frontend/src/reducers/orderReducers.js` | 150+ | 6 reducers; `orderCreateReducer` handles success flag for checkout completion |
| `/frontend/src/reducers/featureFlagReducers.js` | ~100 | 3 reducers: `featureFlagListReducer`, `featureFlagUpdateStatusReducer`, `featureFlagUpdateTrafficReducer` |
| `/frontend/src/constants/` | — | Action type strings (e.g., `PRODUCT_DELETE_REQUEST`, `USER_LOGIN_SUCCESS`, `CART_ADD_ITEM`) for all 5 domains |

### Integration Points

- **All protected thunks** → Manually call `getState().userLogin.userInfo.token` and add `Authorization: Bearer <token>` header.
- **Error handling standardization** → Every catch block uses `error.response?.data.message ?? error.message`.
- **Logout logic** → Matches exact string `'Not authorized, token failed'`; changing it breaks logout.
- **Cart persistence** → cartReducer is watched by a middleware or store.subscribe() handler (not shown) that persists to localStorage.
- **Feature flag state** → Loaded on app init by dispatching `listFeatureFlags()` on admin dashboard entry.

### Known Bugs & Constraints

1. **`paymentMethod` lost on refresh** — Stored in localStorage but missing from Redux `initialState` in `store.js` line 76–78. Values set at checkout are cleared on page refresh.
2. **`orderDetailsReducer` starts with `loading: true`** — Intentional but can mask real loading bugs; component must handle the initial truthy loading state.
3. **No axios interceptor** — Manual JWT extraction per thunk is repetitive but allows fine-grained control.
4. **Cart doesn't persist payment method on add-to-cart** — Only persisted when explicitly saved via `CART_SAVE_PAYMENT_METHOD` on checkout screen.

---

## Module 3: Feature Flags System (features.json + MCP Server)

### Architecture Description

The feature flags system is a two-layer architecture: (1) a static JSON file at `/backend/features.json` containing 25 feature flags, each with fields `name`, `description`, `status` (Enabled|Testing|Disabled), `traffic_percentage` (0–100%), `targeted_segments`, `rollout_strategy`, and optional `dependencies`; (2) an MCP server at `/mcp-feature-flags/src/server.ts` exposing four tools: `list_features()` (read all), `get_feature_info(feature_id)` (read one with dependency state), `set_feature_state(feature_id, state)` (write status + auto-set traffic), and `adjust_traffic_rollout(feature_id, percentage)` (change traffic while in Testing state).

The backend routes in `/backend/routes/featureFlagRoutes.js` handle HTTP requests to read and update flags: GET / (admin-only, returns all flags), GET /:name (public, returns one flag), PATCH /:name/status (admin, changes status with validation), PATCH /:name/traffic (admin, changes traffic_percentage). Each write operation reads the entire features.json, modifies the target flag, updates `last_modified` timestamp, and writes back atomically using temp file + rename.

The frontend integrates via Redux thunks that call the backend API and dispatch success/fail actions. When an admin loads the feature dashboard, `listFeatureFlags()` dispatches to fetch and store all flags in Redux state. The MCP server tools enforce state transition rules: transitioning to `Enabled` requires all dependencies to be `Enabled` (blocks with error if any dep is Disabled); transitioning to `Testing` warns if deps are not Enabled; transitioning to `Disabled` sets traffic to 0%. The intent is to prevent accidental cascade failures and partial rollouts.

### Feature Flag Lifecycle Diagram

```
                    ┌──────────────┐
                    │   Created    │
                    │  (Disabled)  │
                    │ traffic: 0%  │
                    └──────┬───────┘
                           │
                    ┌──────▼──────┐
                    │   Testing   │
                    │ traffic: 1–99%
                    │ (canary)    │
                    └──────┬──────┬──────────┐
                           │      │         │
            ┌──────────────┘      │         └─────────┐
            │                     │                   │
            ▼                     ▼                   ▼
      ┌──────────┐         ┌─────────────┐     ┌──────────┐
      │ Disabled │◀────────│  Testing    │────▶│ Enabled  │
      │ 0%       │ Rollback│ (Expand %)  │     │ 100%     │
      └──────────┘         └─────────────┘     └──────────┘
                                 │
                    ┌────────────┘│└──────────┐
                    │             │          │
        adjust_traffic_rollout()  │   set_feature_state()
        (5% → 25% → 50%)        dep check  (check dependencies)
                                 │
                    ┌────────────▼┴─────────┐
                    │  Dependencies Met?    │
                    │  All deps Enabled?    │
                    └────┬──────────────┬───┘
                         │              │
                       YES              NO
                         │              │
                    ┌────▼──────┐  ┌────▼──────────┐
                    │ Proceed   │  │ BLOCK: Error  │
                    │ to Enabled│  │ (or WARN)     │
                    └───────────┘  └───────────────┘
```

### features.json Structure (Sample)

```json
{
  "search_v2": {
    "name": "New Search Algorithm",
    "description": "Replaces legacy regex-based keyword matching...",
    "status": "Testing",
    "traffic_percentage": 85,
    "last_modified": "2026-05-24",
    "targeted_segments": ["beta_users", "internal"],
    "rollout_strategy": "canary",
    "dependencies": []
  },
  "semantic_search": {
    "name": "Semantic Vector Search",
    "description": "Augments keyword search with embedding...",
    "status": "Testing",
    "traffic_percentage": 25,
    "last_modified": "2026-05-11",
    "targeted_segments": ["internal"],
    "rollout_strategy": "canary",
    "dependencies": ["search_v2"]  ← requires search_v2 to be Enabled
  },
  "save_for_later": {
    "name": "Save Items for Later",
    "status": "Disabled",
    "traffic_percentage": 0,
    "targeted_segments": ["authenticated"],
    "dependencies": ["cart_redesign"]
  }
}
```

### MCP Server Tools Reference

| Tool | Input | Output | When to Use |
|------|-------|--------|-----------|
| `list_features()` | (none) | `{ feature_id, name, status, traffic_percentage, last_modified, dependencies[] }[]` | Get overview of all 25 flags; discover valid feature_ids |
| `get_feature_info(feature_id)` | `feature_id: string` | Full flag details + `dependency_states` map showing live status of all deps | Check single flag status; verify dependency chain before promoting to Enabled |
| `set_feature_state(feature_id, state)` | `feature_id, state: 'Disabled'\|'Testing'\|'Enabled'` | Updated flag + validation warnings | Change flag status; kill-switch activation; promote from Testing to Enabled |
| `adjust_traffic_rollout(feature_id, percentage)` | `feature_id, percentage: 0–100` | Updated traffic_percentage | Canary ladder steps (5→25→50→100%); only works if status='Testing' |

### Backend Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/feature-flags` | Admin | Fetch all 25 flags (JSON object keyed by feature_id) |
| GET | `/api/feature-flags/:name` | Public | Fetch one flag by name (no auth required) |
| PATCH | `/api/feature-flags/:name/status` | Admin | Set status to Disabled\|Testing\|Enabled; auto-adjust traffic_percentage |
| PATCH | `/api/feature-flags/:name/traffic` | Admin | Set traffic_percentage (0–100); must be in Testing status |

### Frontend Integration Points

- **Redux actions** (featureFlagActions.js):
  - `listFeatureFlags()` → GET /api/feature-flags (admin)
  - `updateFeatureFlagStatus(name, status)` → PATCH /api/feature-flags/:name/status
  - `updateFeatureFlagTraffic(name, traffic_percentage)` → PATCH /api/feature-flags/:name/traffic
  - All three manually extract JWT from `getState().userLogin.userInfo.token`

- **Redux state** (featureFlagReducers.js):
  - `featureFlagList` → { loading, error, features[] }
  - `featureFlagUpdateStatus` → { loading, error, success? }
  - `featureFlagUpdateTraffic` → { loading, error, success? }

### Key Files

| File Path | Role |
|-----------|------|
| `/backend/features.json` | 25 feature flag definitions; structure: `{ [feature_id]: { name, description, status, traffic_percentage, targeted_segments, rollout_strategy, dependencies?, last_modified } }` |
| `/backend/routes/featureFlagRoutes.js` | 4 endpoints; reads/writes features.json; enforces status/traffic validation |
| `/mcp-feature-flags/src/server.ts` | MCP server registration; 4 tools; stdio transport |
| `/mcp-feature-flags/src/helpers.ts` | Implementation of listFeatures, getFeatureInfo, setFeatureState, adjustTrafficRollout; file I/O + dependency checks |
| `/frontend/src/actions/featureFlagActions.js` | 3 thunks calling backend API; manual JWT extraction |
| `/frontend/src/reducers/featureFlagReducers.js` | 3 reducers for list, update status, update traffic |

### Known Constraints

1. **No atomic multi-flag updates** — Each flag is updated independently; if updating two dependent flags (e.g., `cart_redesign` then `save_for_later`), a rollback mid-way leaves the system in an inconsistent state.
2. **Dependency validation on write only** — The MCP server checks dependencies when `set_feature_state(state='Enabled')` is called, but the JSON file can be manually edited to bypass validation.
3. **traffic_percentage is advisory** — The backend serves the flag to frontend and controllers, but the actual percentage sampling (which users see the feature?) is implemented in application code, not enforced here.
4. **No A/B test bucketing** — `rollout_strategy` field (canary, ab_test, full_release) is metadata; actual bucketing logic is in application code, not in the flag system.

---

## Module 4: MCP Docs-Search Integration (RAG Pipeline)

### Architecture Description

The docs-search module implements a Retrieval-Augmented Generation (RAG) pipeline consisting of three stages: (1) **indexing** (offline, pre-computed): markdown files in `docs/project-data/` are chunked by heading hierarchy and stored as vectors in a Qdrant collection (proshop_docs); (2) **embedding**: incoming queries are embedded using Ollama's `nomic-embed-text` model; (3) **search**: the query vector is sent to Qdrant for cosine-similarity nearest-neighbor lookup, returning top-K chunks ranked by score. The MCP server exposes one tool, `search_project_docs(query, top_k=5)`, which accepts a natural-language search query, embeds it, searches Qdrant, and returns up to K chunks with metadata (source_file, file_path, title, parent_headings breadcrumb, similarity score 0–1, 200-char snippet).

The pipeline is designed to answer architectural, operational, and feature questions by searching the living documentation index rather than requiring code inspection. Scores above 0.6 are typically high-relevance results; scores below 0.6 should trigger a fallback to grep+read on the codebase. The search results include source file paths (e.g., `docs/project-data/features/auth.md`) so users can read the full source if needed. The MCP server requires Ollama and Qdrant services to be running locally; if either is unavailable, the tool returns an error instead of failing silently.

### RAG Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      OFFLINE: Indexing Phase                        │
│                    (run once, pre-computed)                         │
└─────────────────────────────────────────────────────────────────────┘

docs/project-data/
├── architecture.md
├── feature-flags-spec.md
├── features/
│   ├── auth.md
│   ├── cart.md
│   ├── catalog.md
│   ├── checkout.md
│   ├── payments.md
│   └── admin.md
├── runbooks/
│   ├── deploy.md
│   ├── incident-response.md
│   ├── db-seed-and-reset.md
│   └── local-setup.md
└── adr/
    └── *.md

    ↓ (Markdown → Chunk by Heading)

Chunks: {
  text: "## JWT Flow\nTokens are issued at login...",
  metadata: {
    source_file: "auth.md",
    file_path: "docs/project-data/features/auth.md",
    title: "Authentication",
    parent_headings: ["Authentication", "JWT Flow"],
    keywords: ["JWT", "token", "login"],
  }
}

    ↓ (Embed each chunk via Ollama)

Embedded Chunks: [
  { text_embedding: [0.12, -0.45, 0.88, ...], payload: {...} },
  { text_embedding: [0.33, 0.02, -0.61, ...], payload: {...} },
  ...
]

    ↓ (Upload to Qdrant Collection: proshop_docs)

Qdrant Vector DB
  collection: proshop_docs
  dimension: 768 (nomic-embed-text output)
  storage: ~500–1000 vectors (chunks)

┌─────────────────────────────────────────────────────────────────────┐
│              ONLINE: Query Search Phase (every request)             │
└─────────────────────────────────────────────────────────────────────┘

User Query:
  "How does JWT authentication work in ProShop?"

  ↓ (MCP Tool: search_project_docs)

  ├─ query: "JWT authentication flow"
  └─ top_k: 5

  ↓ (Ollama: Embed Query)

  query_embedding = embed("JWT authentication flow")
                  = [0.15, -0.42, 0.85, ...]  (768-dim vector)

  ↓ (Qdrant: Cosine Similarity Search)

  search(collection=proshop_docs, vector=query_embedding, limit=5)

  ↓ (Rank by Score)

  Results (sorted by cosine similarity):
    1. { source: auth.md, title: "JWT Flow", score: 0.92, snippet: "..." }
    2. { source: auth.md, title: "Token Expiry", score: 0.87, snippet: "..." }
    3. { source: adr/jwt-vs-session.md, score: 0.78, snippet: "..." }
    4. { source: deploy.md, score: 0.45, snippet: "..." }  ← low score, fallback
    5. { source: incident.md, score: 0.32, snippet: "..." } ← low score, fallback

  ↓ (Return to Claude Code)

  {
    source_file: "auth.md",
    file_path: "docs/project-data/features/auth.md",
    title: "Authentication",
    parent_headings: ["Authentication", "JWT Flow"],
    score: 0.92,
    snippet: "Tokens are issued at login via POST /api/users/login, verified on protected routes via the protect middleware, and expire after..."
  }

  ↓ (Claude Code evaluates scores)

  IF all scores >= 0.6:
    Synthesize answer from search results
  ELSE:
    Fallback: grep/read specific code files identified in chunk metadata
```

### Search Example Query/Result

**Query:**
```
search_project_docs({ query: "cart architecture Redux state localStorage", top_k: 5 })
```

**Results:**
```json
[
  {
    "source_file": "cart.md",
    "file_path": "docs/project-data/features/cart.md",
    "title": "Cart Feature",
    "parent_headings": ["Cart Feature", "Redux State Management"],
    "score": 0.94,
    "snippet": "The cart is managed via Redux cartReducer with state shape { cartItems: [], shippingAddress, paymentMethod }. Items are added/removed synchronously via CART_ADD_ITEM/CART_REMOVE_ITEM actions. cartReducer persists to localStorage after every action via a store.subscribe middleware…"
  },
  {
    "source_file": "checkout.md",
    "file_path": "docs/project-data/features/checkout.md",
    "title": "Checkout Flow",
    "parent_headings": ["Checkout Flow", "Shipping Address Entry"],
    "score": 0.87,
    "snippet": "After selecting items in the cart, users proceed to ShippingScreen where they enter a shipping address. This address is saved to Redux state via CART_SAVE_SHIPPING_ADDRESS and persisted to localStorage for future checkouts…"
  },
  {
    "source_file": "local-setup.md",
    "file_path": "docs/project-data/runbooks/local-setup.md",
    "title": "Local Development Setup",
    "parent_headings": ["Local Development Setup", "Frontend: Cart Debugging"],
    "score": 0.62,
    "snippet": "To inspect the cart state in dev tools, open Redux DevTools (browser extension) and look for the 'cart' slice under state. The slice contains cartItems, shippingAddress, and paymentMethod. localStorage updates should be visible in DevTools Application tab…"
  }
]
```

### Key Files

| File Path | Role |
|-----------|------|
| `/docs/chunks.jsonl` | JSONL index of all markdown chunks with metadata; read by scripts/ingest.ts to populate Qdrant; ~500–1000 lines |
| `/mcp-docs-search/src/server.ts` | MCP server registration; exposes `search_project_docs` tool via stdio transport; calls searchDocs() |
| `/mcp-docs-search/src/search.ts` | Core logic: embed query via Ollama → search Qdrant → format results; exports `searchDocs(query, topK)` |
| `/docs/project-data/` | Source markdown files organized by domain (features/, runbooks/, adr/, etc.); indexed offline into Qdrant |
| `scripts/ingest.ts` | (Not in scope, offline) Reads markdown tree, chunks by heading, embeds via Ollama, uploads to Qdrant |

### Service Dependencies

- **Ollama (http://localhost:11434)** — Provides `nomic-embed-text` model for query/chunk embedding. If not running, `search_project_docs` returns SEARCH_FAILED error.
- **Qdrant (http://localhost:6333)** — Vector database storing proshop_docs collection. If not running, `search_project_docs` returns SEARCH_FAILED error.

### Integration with Claude Code Workflow

**CLAUDE.md guidance (for Claude Code users):**

1. For any feature/architecture/runbook question: **CALL `search_project_docs` FIRST** (fast, returns top-K chunks with scores).
2. If all results have score >= 0.6: Synthesize answer from search results.
3. If any result has score < 0.6 or results are empty: Fallback to grep+read on code files identified in chunk metadata or other locations.
4. For real-time feature flag state: Use `get_feature_info` (feature-flags MCP), NOT `search_project_docs` (docs are static).
5. For end-to-end workflows: Complete all `search_project_docs` calls and analyze dependencies BEFORE calling feature-flags MCP tools. Do not parallelize across the two MCPs.

### Implementation Details

- **Embedding model**: Ollama `nomic-embed-text` (768-dimensional vectors)
- **Similarity metric**: Cosine distance
- **Chunk boundary**: Markdown heading hierarchies (e.g., # Auth, ## JWT Flow, ### Token Validation)
- **Snippet extraction**: Markdown syntax stripped (code blocks, links, lists), plain text truncated to 200 chars
- **Result scoring**: Cosine similarity 0–1; higher = more relevant
- **Env vars** (`.env` or defaults):
  - `OLLAMA_URL` = http://localhost:11434
  - `OLLAMA_MODEL` = nomic-embed-text
  - `QDRANT_URL` = http://localhost:6333
  - `QDRANT_COLLECTION` = proshop_docs

---

## Cross-Module Integration Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Frontend React + Redux                         │
├─────────────────────────────────────────────────────────────────────┤
│  Actions (Thunks):                                                  │
│    • productActions.js → calls backend routes                       │
│    • userActions.js → calls /api/users/login, /api/users/:id        │
│    • orderActions.js → calls /api/orders                            │
│    • cartActions.js → local Redux (no API)                          │
│    • featureFlagActions.js → calls /api/feature-flags (admin)       │
│                                                                      │
│  State (Reducers):                                                  │
│    • Each domain (product, user, order, cart, featureFlag)          │
│    • Pattern: { loading, error, data? }                             │
│    • Mutations: add success: true on SUCCESS                        │
│    • Hydrate from localStorage on init                              │
└────┬─────────────────────────────────────────────────────────────────┘
     │
     │ HTTP API calls (manual JWT extraction)
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend Express + Routes                         │
├─────────────────────────────────────────────────────────────────────┤
│  Middleware Stack (server.js):                                      │
│    1. morgan('dev')                                                 │
│    2. express.json()                                                │
│    3. static /uploads                                               │
│    4. Route dispatch (5 groups)                                     │
│       ├─ protect (extract JWT, find User)                           │
│       ├─ admin (check isAdmin)                                      │
│       └─ async controller (express-async-handler)                   │
│    5. errorHandler (global error formatter)                         │
│                                                                      │
│  Route Groups:                                                       │
│    • /api/products (productRoutes)                                  │
│    • /api/users (userRoutes) → auth source                          │
│    • /api/orders (orderRoutes)                                      │
│    • /api/upload (uploadRoutes) → Multer disk storage               │
│    • /api/feature-flags (featureFlagRoutes) ←─────────┐             │
│                                                       │             │
│  Controllers:                                        │             │
│    • productController, userController, etc.         │             │
│    • Each wrapped with asyncHandler                  │             │
│    • Error handling: res.status(NNN) before throw    │             │
└────┬──────────────────────────────────────────────────┼─────────────┘
     │                                                  │
     │ Read/Write                                       │ Sync
     ▼                                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     MongoDB + Mongoose                               │
│  Collections: Product, User, Order (Mongoose schemas)                │
│  Connection: db.js via MONGO_URI env var                             │
└──────────────────────────────────────────────────────────────────────┘

     │ (featureFlagRoutes reads/writes)
     │
     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  features.json (25 flags)                            │
│  • Status: Disabled | Testing | Enabled                             │
│  • Traffic: 0–100%                                                   │
│  • Dependencies: cascade validation                                  │
└────┬───────────────────────────┬──────────────────────────────────────┘
     │                           │
     │ MCP Server                │ HTTP API
     │ (set_feature_state,       │ (PATCH /api/feature-flags/:name/status)
     │  get_feature_info,        │
     │  adjust_traffic_rollout)  │
     │                           │
     ▼                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│            Feature Flags MCP + Feature Flags Reducers                │
│  Claude Code tool interface (feature-flags MCP)                      │
│  Redux state: featureFlagList, featureFlagUpdateStatus, etc.        │
└──────────────────────────────────────────────────────────────────────┘


     │ (Frontend Q: "how does auth work?")
     │
     ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Docs-Search MCP + RAG Pipeline                          │
│  Claude Code tool: search_project_docs(query, top_k)                 │
│  Returns: ranked chunks from docs/project-data/* via Qdrant          │
│  Dependencies: Ollama (nomic-embed-text), Qdrant                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Summary: File Locations & Responsibility Matrix

| File | Lines | Responsibility |
|------|-------|---|
| `/backend/server.js` | 63 | Express app init, route registration, middleware stack order |
| `/backend/middleware/authMiddleware.js` | 43 | JWT extraction + User lookup (`protect`); isAdmin check (`admin`) |
| `/backend/middleware/errorMiddleware.js` | 16 | 404 handler; global error formatter (reads res.statusCode, defaults to 500) |
| `/backend/routes/productRoutes.js` | 24 | 7 endpoints; **BUG: /top after /:id** |
| `/backend/routes/userRoutes.js` | 28 | Auth endpoints (/login, /register) + profile/admin CRUD |
| `/backend/routes/orderRoutes.js` | 20 | Order lifecycle: create, pay, deliver, list (admin) |
| `/backend/routes/uploadRoutes.js` | 42 | Multer file upload; saves to disk at `uploads/` |
| `/backend/routes/featureFlagRoutes.js` | 76 | Read/write features.json; status + traffic validation |
| `/frontend/src/store.js` | 97 | Combine reducers, init from localStorage, Thunk middleware |
| `/frontend/src/actions/productActions.js` | 248 | 7 thunks (listProducts, delete, create, update, review, topRated) |
| `/frontend/src/actions/userActions.js` | 305 | 8 thunks (login, logout, register, details, profile, list, delete, update) |
| `/frontend/src/actions/orderActions.js` | 263 | 6 thunks (create, details, pay, deliver, myOrders, list) |
| `/frontend/src/actions/cartActions.js` | 52 | 4 sync actions (add, remove, save address, save payment) |
| `/frontend/src/actions/featureFlagActions.js` | 116 | 3 thunks (list, update status, update traffic) |
| `/frontend/src/reducers/*.js` | 800+ | 5 domains; pattern: { loading, error, data? }, mutations: success: true |
| `/backend/features.json` | — | 25 flags: { name, status, traffic_percentage, dependencies?, ... } |
| `/mcp-feature-flags/src/server.ts` | 183 | MCP registration; 4 tools (list, get, set, adjust) |
| `/mcp-docs-search/src/server.ts` | 136 | MCP registration; search_project_docs tool |
| `/mcp-docs-search/src/search.ts` | 100+ | Embed query via Ollama, search Qdrant, format results |
| `/docs/chunks.jsonl` | — | Pre-computed index of ~500–1000 markdown chunks (JSONL) |
| `/docs/project-data/` | — | 15+ markdown files organized by domain (features/, runbooks/, adr/) |

---

## Conclusion

These four modules form the backbone of ProShop's architecture:

1. **Express Routing** enables HTTP request handling with a clean middleware chain and standardized error responses.
2. **Redux Thunks** centralize frontend state with async operation handling, manual JWT extraction per action, and localStorage persistence.
3. **Feature Flags** provide runtime control of 25 features with dependency validation and canary/A/B test orchestration.
4. **Docs-Search RAG** enables semantic navigation of the living documentation via vector similarity.

Integration between these modules is explicit: thunks call backend routes (with manual JWT); routes read/write features.json; the MCP servers expose the flags and docs to Claude Code for command-line operations. Understanding the data flow, middleware chain, state shape, and error handling patterns in each module is essential for extending or debugging the system.

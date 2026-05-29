# Frontend Redux State Management Specification

**Module:** Frontend Redux Thunk Actions + State Management
**File:** `frontend/src/store.js`, `frontend/src/actions/*`, `frontend/src/reducers/*`
**Language:** JavaScript (React + Redux)
**Key Dependency:** Redux Thunk, Axios, localStorage

## Architecture

The frontend uses Redux for centralized state management with 5 core domains: **product**, **user**, **order**, **cart**, **featureflag**. Each domain has:
- `*Actions.js` — Thunk action creators that make API calls via Axios
- `*Reducers.js` — Pure reducer functions
- Constants file with action type strings

**Critical pattern:** Manual token extraction in every thunk (no interceptors). Each action creator manually extracts JWT from `localStorage.getItem('userInfo')`, parses it, and includes in `Authorization: Bearer <token>` header.

## State Persistence

localStorage persists:
- **cart:** Full cart state (items, shippingAddress, paymentMethod)
- **userInfo:** User data including JWT token

**Known bug:** `paymentMethod` is written to localStorage but NOT in Redux initialState in `store.js`, causing loss on page refresh.

## Error Handling Pattern

All thunks use consistent error extraction:
```javascript
error.response?.data.message ?? error.message
```

## Redux Domains

| Domain | Actions File | Reducers File | State Keys |
|--------|--------------|---------------|-----------|
| product | productActions.js | productReducers.js | products, productDetails |
| user | userActions.js | userReducers.js | userLogin, userRegister, userDetails |
| order | orderActions.js | orderReducers.js | orderCreate, orderDetails, orderPay |
| cart | cartActions.js | cartReducers.js | cartItems, shippingAddress, paymentMethod |
| featureflag | featureFlagActions.js | featureFlagReducers.js | featureFlags |

## Integration Points

- **Backend API:** All calls to `/api/products`, `/api/users`, `/api/orders`, `/api/featureFlag`
- **localStorage:** Automatic persistence for cart + userInfo
- **Screens:** 16 screens dispatch actions and subscribe to state slices
- **Components:** 13 components connect via mapStateToProps

## File References

- `frontend/src/store.js` — Store initialization with middleware + reducers
- `frontend/src/actions/` — Thunk action creators (5 files)
- `frontend/src/reducers/` — Pure reducers (5 files)
- `frontend/src/constants/` — Action type strings
- `frontend/src/screens/` — Screen components (16 files)
- `frontend/src/components/` — Reusable components (13 files)

## Middleware Chain

- Redux Thunk — Enables async action creators
- localStorage persistence — Hydrates cart + userInfo on app start

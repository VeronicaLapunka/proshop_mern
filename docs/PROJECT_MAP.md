# ProShop MERN — Project Map

Generated: 2026-05-29T00:40:36.776282Z
Source: `project-index.json` (machine-readable module catalog)

---

## Backend

**Location:** `backend/`

### Models

- [order](backend/models/orderModel.js)
- [product](backend/models/productModel.js)
- [user](backend/models/userModel.js)

### Controllers

- [orderController](backend/controllers/orderController.js)
- [productController](backend/controllers/productController.js)
- [userController](backend/controllers/userController.js)

### Routes

- [featureFlagRoutes](backend/routes/featureFlagRoutes.js) → `/api/featureFlag` (4 endpoints)
- [orderRoutes](backend/routes/orderRoutes.js) → `/api/order` (N/A endpoints)
- [productRoutes](backend/routes/productRoutes.js) → `/api/product` (1 endpoints)
- [uploadRoutes](backend/routes/uploadRoutes.js) → `/api/upload` (1 endpoints)
- [userRoutes](backend/routes/userRoutes.js) → `/api/user` (1 endpoints)

**Total Backend Endpoints:** 7

---

## Frontend

**Location:** `frontend/src/`

### Screens

**Public Pages**

- [CartScreen](frontend/src/screens/CartScreen.js)
- [FeatureDashboardScreen](frontend/src/screens/FeatureDashboardScreen.js)
- [HomeScreen](frontend/src/screens/HomeScreen.js)
- [OrderListScreen](frontend/src/screens/OrderListScreen.js)
- [OrderScreen](frontend/src/screens/OrderScreen.js)
- [PaymentScreen](frontend/src/screens/PaymentScreen.js)
- [PlaceOrderScreen](frontend/src/screens/PlaceOrderScreen.js)
- [ProductEditScreen](frontend/src/screens/ProductEditScreen.js)
- [ProductListScreen](frontend/src/screens/ProductListScreen.js)
- [ProductScreen](frontend/src/screens/ProductScreen.js)
- [ShippingScreen](frontend/src/screens/ShippingScreen.js)
- [UserEditScreen](frontend/src/screens/UserEditScreen.js)
- [UserListScreen](frontend/src/screens/UserListScreen.js)

**Authenticated Pages**

- [LoginScreen](frontend/src/screens/LoginScreen.js)
- [ProfileScreen](frontend/src/screens/ProfileScreen.js)
- [RegisterScreen](frontend/src/screens/RegisterScreen.js)


### Components

- [AutoPilotControls](frontend/src/components/AutoPilotControls.js)
- [CheckoutSteps](frontend/src/components/CheckoutSteps.js)
- [Footer](frontend/src/components/Footer.js)
- [FormContainer](frontend/src/components/FormContainer.js)
- [Header](frontend/src/components/Header.js)
- [Loader](frontend/src/components/Loader.js)
- [Message](frontend/src/components/Message.js)
- [Meta](frontend/src/components/Meta.js)
- [Paginate](frontend/src/components/Paginate.js)
- [Product](frontend/src/components/Product.js)
- [ProductCarousel](frontend/src/components/ProductCarousel.js)
- [Rating](frontend/src/components/Rating.js)
- [SearchBox](frontend/src/components/SearchBox.js)

### Redux Domains

- **Cart**
  - Actions: [`frontend/src/actions/cartActions.js`](frontend/src/actions/cartActions.js)
  - Reducers: [`frontend/src/reducers/cartReducers.js`](frontend/src/reducers/cartReducers.js)
- **Featureflag**
  - Actions: [`frontend/src/actions/featureFlagActions.js`](frontend/src/actions/featureFlagActions.js)
  - Reducers: [`frontend/src/reducers/featureFlagReducers.js`](frontend/src/reducers/featureFlagReducers.js)
- **Order**
  - Actions: [`frontend/src/actions/orderActions.js`](frontend/src/actions/orderActions.js)
  - Reducers: [`frontend/src/reducers/orderReducers.js`](frontend/src/reducers/orderReducers.js)
- **Product**
  - Actions: [`frontend/src/actions/productActions.js`](frontend/src/actions/productActions.js)
  - Reducers: [`frontend/src/reducers/productReducers.js`](frontend/src/reducers/productReducers.js)
- **User**
  - Actions: [`frontend/src/actions/userActions.js`](frontend/src/actions/userActions.js)
  - Reducers: [`frontend/src/reducers/userReducers.js`](frontend/src/reducers/userReducers.js)

---

## Features

**Total Feature Flags:** 25

For detailed feature flag information, see [`features.json`](features.json)

---

## MCP Servers

### mcp-docs-search
**Location:** `mcp-docs-search/`  
**Language:** TypeScript

Tools: `search_project_docs`

### mcp-feature-flags
**Location:** `mcp-feature-flags/`  
**Language:** TypeScript

Tools: `list_features`, `get_feature_info`, `set_feature_state`, `adjust_traffic_rollout`

---

## Documentation

**Location:** `docs/`

- [ADRs](docs/adr/) — Architecture Decision Records
- [Project Data](docs/project-data/) — API specs, features, runbooks, incidents
- [Archived Docs](docs/archived-2026-05-28/) — Historical references
- [Deferred Docs](docs/deferred-2026-05-28/) — Placeholder templates

See [`docs/INDEX.md`](docs/INDEX.md) for full documentation navigation.

---

For machine-readable module catalog, see [`project-index.json`](project-index.json)

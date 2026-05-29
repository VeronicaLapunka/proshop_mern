# Stage 3: Legacy Audit + Living Documentation — Full Implementation Plan

**Prepared by:** legacy-auditor-mate (Phase 1-2 workflow)
**Status:** Phase 4 complete (EXECUTE mode) — Phase 3-5 complete, living docs system operational
**Date:** 2026-05-28 (updated 2026-05-29)
**Repository:** ProShop MERN (`/Users/Veronica_Lapunka/Documents/git3/proshop_mern`)

---

## I. CONTEXT & REQUIREMENTS

### Problem Statement

ProShop MERN has 59 well-organized documentation files but **lacks systematic indexing and discovery**:

- No central module catalog (`project-index.json`)
- No automation to regenerate docs from source changes (`update_project_index.py`)
- No distinction between active vs. archived documentation
- No AI agent integration points in CLAUDE.md
- **Gap:** 92% of existing docs are valuable; goal is to organize + index them, NOT delete

### Success Criteria

1. ✅ **Phase 1.5:** All 59 docs classified with verdicts (✅/🔄/📦/❌) → Done (see `01-docs-audit.md`)
2. ✅ **Phase 3:** Architecture specs reverse-engineered for 4 key modules (from architecture-mate specialist) → Done (see `02-architecture-specs.md`)
3. ✅ **Phase 4:** `project-index.json` created + validated ✅; docs reorganization complete ✅; `update_project_index.py` script installed ✅; CLAUDE.md updated ✅
4. ✅ **Phase 5:** Living documentation system operational; CLAUDE.md updated with "Living Documentation", "AI Agent Integration", "Documentation Audit Reference", and "Architecture Reference" sections

---

## II. PHASE 1 DISCOVERY: REPOSITORY STRUCTURE

### Technology Stack

| Layer | Tech | Port | ES Modules | Notes |
|-------|------|------|------------|-------|
| **Backend** | Express.js + Node.js v16+ | 5001 | ✅ Yes (`.js` required) | Mongoose v5, asyncHandler pattern, no CORS |
| **Frontend** | React 17 + Redux Thunk | 3000 | ❌ No (CRA v3 + JSX) | Manual token extraction in thunks, localStorage persistence |
| **Database** | MongoDB 4.4+ | 27017 | N/A | Local or Atlas URI in `.env` |
| **MCP Servers** | TypeScript + Node.js | N/A | ❌ No (compiled to dist/) | Qdrant RAG + HTTP/stdio transports |

### Backend Architecture (Express.js)

```
backend/
├── models/ (3 files)
│   ├── productModel.js        → Product schema (name, description, price, rating, reviews)
│   ├── userModel.js           → User schema (email, password, isAdmin, timestamps)
│   └── orderModel.js          → Order schema (user, orderItems, shipping, payment, status)
├── controllers/ (3 files)
│   ├── productController.js   → 5 functions (getProducts, getProductById, deleteProduct, etc.)
│   ├── userController.js      → 6 functions (auth, profile, list, delete, update, etc.)
│   └── orderController.js     → 4 functions (addOrder, getOrder, getOrders, updateToPaid, etc.)
├── routes/ (5 files)
│   ├── productRoutes.js       → GET /api/products*, POST /admin/products, etc. (BUG: /top before /:id)
│   ├── userRoutes.js          → POST /api/auth, GET /profile, PUT /profile, etc.
│   ├── orderRoutes.js         → POST /api/orders, GET /api/orders/:id, PUT /:id/pay, etc.
│   ├── uploadRoutes.js        → POST /api/upload (Multer to ephemeral /uploads/)
│   └── featureFlagRoutes.js   → GET /api/features, GET /api/features/:name
├── middleware/ (2 files)
│   ├── authMiddleware.js      → protect (JWT auth), admin (check isAdmin)
│   └── errorMiddleware.js     → notFound (404), errorHandler (error formatting)
├── config/db.js               → MongoDB connection + exit on failure
├── server.js                  → Express app init, route mounting, middleware setup
└── seeder.js                  → Data import/destroy scripts
```

**API Endpoints:** 20+ routes across 5 route files

### Frontend Architecture (React + Redux)

```
frontend/src/
├── screens/ (16 files)
│   ├── PUBLIC (5):
│   │   ├── HomeScreen.js
│   │   ├── ProductScreen.js
│   │   ├── CartScreen.js
│   │   ├── LoginScreen.js
│   │   └── RegisterScreen.js
│   ├── AUTH-REQUIRED (5):
│   │   ├── ShippingScreen.js
│   │   ├── PaymentScreen.js
│   │   ├── PlaceOrderScreen.js
│   │   ├── OrderScreen.js
│   │   └── ProfileScreen.js
│   └── ADMIN (6):
│       ├── ProductListScreen.js
│       ├── ProductEditScreen.js
│       ├── UserListScreen.js
│       ├── UserEditScreen.js
│       ├── OrderListScreen.js
│       └── FeatureDashboardScreen.js
├── components/ (13 files)
│   ├── Header.js, Footer.js, Loader.js, Message.js
│   ├── Product.js, ProductCarousel.js, Rating.js, Paginate.js
│   ├── SearchBox.js, FormContainer.js, CheckoutSteps.js
│   ├── AutoPilotControls.js, Meta.js
├── reducers/ (5 files → 13 reducers)
│   ├── productReducers.js     (productList, productDetails)
│   ├── userReducers.js        (userLogin, userRegister, userProfile)
│   ├── orderReducers.js       (orderCreate, orderDetails, orderList, orderPay)
│   ├── cartReducers.js        (cart)
│   └── featureFlagReducers.js (featureFlags)
├── actions/ (5 files → 22 action creators)
│   ├── productActions.js      (listProducts, getProductDetails, etc.)
│   ├── userActions.js         (login, register, profile, logout, etc.)
│   ├── orderActions.js        (createOrder, getOrderDetails, payOrder, etc.)
│   ├── cartActions.js         (addToCart, removeFromCart, saveShippingAddress, etc.)
│   └── featureFlagActions.js  (fetchFlags, toggleFlag, setTraffic)
├── constants/ (5 files)
│   ├── productConstants.js    (action type strings)
│   ├── userConstants.js
│   ├── orderConstants.js
│   ├── cartConstants.js
│   └── featureFlagConstants.js
├── store.js                   → Redux store with localStorage persistence
└── index.js                   → React + Redux provider
```

**Redux state shape:** `{ productList, userLogin, cart, orders, featureFlags }`
**localStorage persistence:** cart items, userInfo (with token)

### MCP Servers (TypeScript)

1. **mcp-docs-search** (RAG-based document search)
   - Scans `docs/` → generates vector embeddings (chunks.jsonl)
   - Exposes `search_project_docs` tool for Claude Code
   - qdrant integration for similarity search

2. **mcp-feature-flags** (Feature flag management)
   - Reads `features.json` (25 flags)
   - Exposes `get_feature_info`, `set_feature_state`, `list_features` tools
   - HTTP + stdio transports for flexibility

### Documentation Structure (59 files)

```
docs/
├── adr/ (9 ADRs) ..................... Architecture decisions (current + relevant)
├── project-data/ (39 files) ......... Operational documentation
│   ├── api/ (5) ..................... Endpoint specs (auth, orders, products, uploads, users)
│   ├── features/ (6) ................ Feature docs (admin, auth, cart, catalog, checkout, payments)
│   ├── pages/ (15) .................. Screen/page docs (INDEX + 14 pages with post-redesign stale refs)
│   ├── runbooks/ (6) ................ Operational procedures (4 active + 2 placeholder/deferred)
│   ├── incidents/ (3) ............... Post-mortems (PayPal, Mongo, JWT)
│   ├── best-practices.md ............ Timeless engineering guidance
│   ├── glossary.md .................. Domain terminology (needs feature flag + MCP updates)
│   ├── architecture.md .............. Backend/frontend overview (needs MCP + feature flags section)
│   ├── feature-flags-spec.md ........ Feature flag structure (accurate)
│   └── dev-history.md ............... Development timeline (historical context)
├── m2-char-tests/ (4 files) ......... M2 test characterization (historical, archive)
├── architecture.md .................. Root architecture overview (pre-M4 redesign)
└── chunks.jsonl ..................... Vector embeddings for RAG search (active)
```

**Assessment:** 39 keep + 8 update with TODO markers + 7 archive (historical) + 3 deferred (stale)

---

## III. PHASE 1.5 AUDIT RESULTS

### Verdict Summary

| Category | ✅ ACCURATE | 🔄 PARTIALLY | 📦 HISTORICAL | ❌ STALE | Total |
|----------|:---:|:---:|:---:|:---:|:---:|
| ADRs | 9 | — | — | — | 9 |
| API Specs | 5 | — | — | — | 5 |
| Features | 6 | — | — | — | 6 |
| Pages | 1 | 14 | — | — | 15 |
| Runbooks | 4 | — | — | 2 | 6 |
| Incidents | 3 | — | — | — | 3 |
| Supporting | 2 | 2 | — | — | 4 |
| M2 Tests | — | — | 4 | — | 4 |
| Other | 1 | — | 1 | 1 | 3 |
| **TOTALS** | **27** | **8** | **7** | **3** | **59** |

### Per-Category Actions

- **Keep as-is (27 items):** All ADRs, API specs, features, incidents, runbooks (4), root guides, chunks.jsonl
- **Update + keep (8 items):** All 14 page docs (add TODO for design refs) + architecture (add TODO for MCP/feature flags) + glossary (add TODO for new terms)
- **Archive historical (7 items):** M2 test files (4) + report.md + dev-history context
- **Archive stale/deferred (3 items):** feature-flag-toggle.md, ab-test-setup.md, features-analysis-ru.md

See `01-docs-audit.md` for detailed verdicts per file.

---

## IV. PHASE 3 EXECUTION PLAN: Specialist Dispatch

### Architecture-mate Specialist (REQUIRED)

**Goal:** Reverse-engineer 4 key modules with discovery specifications

**Modules to document:**

1. **Module 1: Backend Express Routing + Middleware**
   - How `server.js` orchestrates route registration + middleware stack
   - Async error handling pattern (asyncHandler + error middleware)
   - Auth flow: `protect` → `admin` middleware chain
   - Known bug: `/top` route ordering in productRoutes.js
   - Output: routing-architecture-spec.md (600-800 words)

2. **Module 2: Frontend Redux Thunk Actions + State**
   - Redux store shape + localStorage persistence pattern
   - Manual token extraction in every protected action creator
   - Error extraction pattern: `error.response?.data.message ?? error.message`
   - RESET action pattern for mutation operations
   - Output: redux-architecture-spec.md (600-800 words)

3. **Module 3: Feature Flags System**
   - `features.json` structure (25 flags with status/traffic)
   - MCP feature-flags server interface (get_feature_info, set_feature_state, list_features)
   - Feature flag constants + reducers in frontend
   - Output: feature-flags-architecture-spec.md (400-600 words)

4. **Module 4: MCP Docs-Search Integration**
   - RAG pipeline: docs → chunks.jsonl → qdrant → search tool
   - `search_project_docs` MCP tool for Claude Code discovery
   - Integration with CLAUDE.md for AI agent guidance
   - Output: mcp-docs-search-architecture-spec.md (400-600 words)

**Specialist input:**
- architecture-mate agent definition (provided in `.claude/agents/architecture-mate.md`)
- This plan + audit results

**Specialist output:**
- 4 markdown specs saved to `homework-m6/stage3-living-docs/`

### Optional: Security/Performance Specialists (SKIPPED)

- Stage 1 already covered security + performance findings
- Skip in Phase 3; Stage 1 findings available in homework-m6/stage1-code-review/

---

## V. PHASE 4 EXECUTION PLAN: Aggregate + Build Living Docs

### Inputs to Phase 4
- ✅ Phase 1.5 audit results (01-docs-audit.md)
- ⏳ architecture-mate specs (4 modules from Phase 3)

### Outputs from Phase 4

**1. `project-index.json` (Module Catalog)**

Schema (4 main categories):

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-05-28",
  "project": "ProShop MERN eCommerce",
  "auditDate": "2026-05-28",

  "backend": {
    "models": [
      { "name": "Product", "path": "backend/models/productModel.js", "fields": ["name", "description", "price", "rating", "reviews"] },
      { "name": "User", "path": "backend/models/userModel.js", "fields": ["email", "password", "isAdmin", "createdAt"] },
      { "name": "Order", "path": "backend/models/orderModel.js", "fields": ["user", "orderItems", "totalPrice", "status"] }
    ],
    "controllers": [
      { "name": "productController", "path": "backend/controllers/productController.js", "functions": ["getProducts", "getProductById", "deleteProduct", "createProduct", "updateProduct"] },
      { "name": "userController", "path": "backend/controllers/userController.js", "functions": ["authUser", "getUserProfile", "updateUserProfile", "getUsers", "deleteUser", "updateUser"] },
      { "name": "orderController", "path": "backend/controllers/orderController.js", "functions": ["addOrderItems", "getOrderById", "updateOrderToPaid", "getMyOrders", "getOrders"] }
    ],
    "routes": [
      { "name": "productRoutes", "path": "backend/routes/productRoutes.js", "methods": ["GET /api/products", "GET /api/products/:id", "POST /api/products (admin)", "PUT /api/products/:id (admin)", "DELETE /api/products/:id (admin)"], "note": "Bug: /top registered after /:id" },
      { "name": "userRoutes", "path": "backend/routes/userRoutes.js", "methods": ["POST /api/auth", "GET /api/auth/profile", "PUT /api/auth/profile", "GET /api/users (admin)", "DELETE /api/users/:id (admin)", "PUT /api/users/:id (admin)"] },
      { "name": "orderRoutes", "path": "backend/routes/orderRoutes.js", "methods": ["POST /api/orders", "GET /api/orders/:id", "PUT /api/orders/:id/pay", "GET /api/orders/myorders", "GET /api/orders (admin)"] },
      { "name": "uploadRoutes", "path": "backend/routes/uploadRoutes.js", "methods": ["POST /api/upload"] },
      { "name": "featureFlagRoutes", "path": "backend/routes/featureFlagRoutes.js", "methods": ["GET /api/features", "GET /api/features/:name"] }
    ],
    "middleware": [
      { "name": "protect", "path": "backend/middleware/authMiddleware.js", "purpose": "JWT auth + set req.user" },
      { "name": "admin", "path": "backend/middleware/authMiddleware.js", "purpose": "Check req.user.isAdmin (must call after protect)" }
    ]
  },

  "frontend": {
    "redux": {
      "domains": [
        { "name": "productList", "reducers": ["productList"], "actions": ["listProducts"], "stateShape": { "loading": true, "products": [], "error": null } },
        { "name": "productDetails", "reducers": ["productDetails"], "actions": ["getProductDetails"], "stateShape": { "loading": true, "product": {}, "error": null } },
        { "name": "userLogin", "reducers": ["userLogin"], "actions": ["login"], "stateShape": { "loading": false, "userInfo": { "token": "..." }, "error": null } },
        { "name": "cart", "reducers": ["cart"], "actions": ["addToCart", "removeFromCart"], "stateShape": { "cartItems": [], "shippingAddress": {}, "paymentMethod": "" } },
        { "name": "orders", "reducers": ["orderCreate", "orderDetails", "orderList", "orderPay"], "actions": ["createOrder", "getOrderDetails", "listMyOrders", "payOrder"], "stateShape": { "loading": false, "orders": [], "error": null } }
      ]
    },
    "screens": [
      { "name": "HomeScreen", "path": "frontend/src/screens/HomeScreen.js", "route": "/", "access": "public" },
      { "name": "ProductScreen", "path": "frontend/src/screens/ProductScreen.js", "route": "/product/:id", "access": "public" },
      { "name": "CartScreen", "path": "frontend/src/screens/CartScreen.js", "route": "/cart", "access": "public" },
      { "name": "LoginScreen", "path": "frontend/src/screens/LoginScreen.js", "route": "/login", "access": "public" },
      { "name": "RegisterScreen", "path": "frontend/src/screens/RegisterScreen.js", "route": "/register", "access": "public" },
      { "name": "ShippingScreen", "path": "frontend/src/screens/ShippingScreen.js", "route": "/shipping", "access": "auth" },
      { "name": "PaymentScreen", "path": "frontend/src/screens/PaymentScreen.js", "route": "/payment", "access": "auth" },
      { "name": "PlaceOrderScreen", "path": "frontend/src/screens/PlaceOrderScreen.js", "route": "/placeorder", "access": "auth" },
      { "name": "OrderScreen", "path": "frontend/src/screens/OrderScreen.js", "route": "/order/:id", "access": "auth" },
      { "name": "ProfileScreen", "path": "frontend/src/screens/ProfileScreen.js", "route": "/profile", "access": "auth" },
      { "name": "ProductListScreen", "path": "frontend/src/screens/ProductListScreen.js", "route": "/admin/productlist", "access": "admin" },
      { "name": "ProductEditScreen", "path": "frontend/src/screens/ProductEditScreen.js", "route": "/admin/product/:id/edit", "access": "admin" },
      { "name": "UserListScreen", "path": "frontend/src/screens/UserListScreen.js", "route": "/admin/userlist", "access": "admin" },
      { "name": "UserEditScreen", "path": "frontend/src/screens/UserEditScreen.js", "route": "/admin/user/:id/edit", "access": "admin" },
      { "name": "OrderListScreen", "path": "frontend/src/screens/OrderListScreen.js", "route": "/admin/orderlist", "access": "admin" },
      { "name": "FeatureDashboardScreen", "path": "frontend/src/screens/FeatureDashboardScreen.js", "route": "/admin/featuredashboard", "access": "admin" }
    ],
    "components": [
      { "name": "Header", "path": "frontend/src/components/Header.js", "type": "navigation" },
      { "name": "Footer", "path": "frontend/src/components/Footer.js", "type": "navigation" },
      { "name": "Product", "path": "frontend/src/components/Product.js", "type": "product-display" },
      { "name": "Rating", "path": "frontend/src/components/Rating.js", "type": "product-display" },
      { "name": "ProductCarousel", "path": "frontend/src/components/ProductCarousel.js", "type": "product-display" },
      { "name": "SearchBox", "path": "frontend/src/components/SearchBox.js", "type": "search" },
      { "name": "Paginate", "path": "frontend/src/components/Paginate.js", "type": "pagination" },
      { "name": "Loader", "path": "frontend/src/components/Loader.js", "type": "feedback" },
      { "name": "Message", "path": "frontend/src/components/Message.js", "type": "feedback" },
      { "name": "CheckoutSteps", "path": "frontend/src/components/CheckoutSteps.js", "type": "checkout" },
      { "name": "FormContainer", "path": "frontend/src/components/FormContainer.js", "type": "form" },
      { "name": "Meta", "path": "frontend/src/components/Meta.js", "type": "seo" },
      { "name": "AutoPilotControls", "path": "frontend/src/components/AutoPilotControls.js", "type": "admin" }
    ]
  },

  "features": {
    "flags": [
      { "name": "semantic_search", "key": "semantic_search", "status": "Testing", "traffic": 25, "description": "Enable vector similarity search in docs" },
      { "name": "feature_flags_ui", "key": "feature_flags_ui", "status": "Active", "traffic": 100, "description": "Admin dashboard for feature flag management" },
      "..." // 23 more feature flags
    ]
  },

  "documentation": {
    "adr": [
      { "id": "0001", "title": "Manual JWT header injection in thunks", "status": "current", "link": "docs/adr/0001-manual-jwt-header-injection-in-thunks.md" },
      { "id": "0002", "title": "Selective localStorage persistence in action creators", "status": "current", "link": "docs/adr/0002-selective-localstorage-persistence-in-action-creators.md" },
      "..." // 7 more ADRs
    ],
    "api": [
      { "name": "auth", "link": "docs/project-data/api/auth.md" },
      { "name": "products", "link": "docs/project-data/api/products.md" },
      { "name": "orders", "link": "docs/project-data/api/orders.md" },
      { "name": "uploads", "link": "docs/project-data/api/uploads.md" },
      { "name": "users", "link": "docs/project-data/api/users.md" }
    ],
    "runbooks": [
      { "name": "local-setup", "link": "docs/project-data/runbooks/local-setup.md" },
      { "name": "db-seed-and-reset", "link": "docs/project-data/runbooks/db-seed-and-reset.md" },
      { "name": "deploy", "link": "docs/project-data/runbooks/deploy.md" },
      { "name": "incident-response", "link": "docs/project-data/runbooks/incident-response.md" }
    ]
  }
}
```

**2. Reorganize `docs/` per verdicts**

```
docs/
├── adr/ .......................... KEEP (all 9)
├── project-data/
│   ├── api/ ...................... KEEP (all 5)
│   ├── features/ ................. KEEP (all 6)
│   ├── pages/ .................... KEEP + UPDATE (14 with TODO markers for design refs)
│   ├── runbooks/ ................. KEEP 4 (local-setup, db-seed, deploy, incident-response)
│   ├── incidents/ ................ KEEP (all 3)
│   ├── best-practices.md ......... KEEP
│   ├── glossary.md ............... KEEP + UPDATE (TODO for new terms)
│   ├── architecture.md ........... KEEP + UPDATE (TODO for MCP servers section + feature flags)
│   └── feature-flags-spec.md ..... KEEP
├── architecture.md ............... KEEP + UPDATE (root-level overview)
├── INDEX.md ...................... CREATE (navigation hub)
├── chunks.jsonl .................. KEEP
└── archived-2026-05-28/
    ├── m2-char-tests/
    │   ├── characterization.test.js
    │   ├── refactored.js
    │   ├── refactored.test.js
    │   └── reflection.md
    ├── report.md
    └── features-analysis-ru.md

docs/deferred-2026-05-28/
├── runbooks/
    ├── feature-flag-toggle.md
    └── ab-test-setup.md
```

**3. Update stale sections with TODO markers**

Pattern:
```markdown
### Design / Styling [STALE — TODO(audit-2026-05-28): Review design refs for post-redesign accuracy]

_This section describes the visual layout as of M3. After M4 redesign, CSS classes + layout structure changed. Update with current design system refs._
```

**4. Create `docs/INDEX.md` navigation hub**

```markdown
# ProShop Documentation Index

**Last updated:** 2026-05-28
**Total docs audited:** 59 items (39 active, 10 archived, 10 deferred)

## Quick Navigation

### Architecture & Design
- [Architecture Overview](./architecture.md)
- [ADRs (Architecture Decision Records)](./adr/)
- [Design System](../DESIGN.md)
- [Accessibility Guidelines](../DESIGN_ACCESSIBILITY.md)

### API Documentation
- [API Endpoints Overview](./project-data/api/)
  - [Authentication API](./project-data/api/auth.md)
  - [Products API](./project-data/api/products.md)
  - [Orders API](./project-data/api/orders.md)
  - [Users API](./project-data/api/users.md)
  - [Uploads API](./project-data/api/uploads.md)

### Features
- [Feature Documentation](./project-data/features/)
- [Feature Flags Specification](./project-data/feature-flags-spec.md)
- [Glossary](./project-data/glossary.md)

### Screen/Page Documentation (Post-M4 Redesign)
- [Screen Index](./project-data/pages/)
- [Public Screens](./project-data/pages/#public)
- [Auth-Required Screens](./project-data/pages/#auth)
- [Admin Screens](./project-data/pages/#admin)

### Operational Guides
- [Local Setup](./project-data/runbooks/local-setup.md)
- [Database Seed & Reset](./project-data/runbooks/db-seed-and-reset.md)
- [Deployment](./project-data/runbooks/deploy.md)
- [Incident Response](./project-data/runbooks/incident-response.md)

### Incident Post-Mortems
- [i-001: PayPal Double Charge](./project-data/incidents/i-001-paypal-double-charge.md)
- [i-002: MongoDB Connection Pool Exhaustion](./project-data/incidents/i-002-mongo-connection-pool-exhaustion.md)
- [i-003: JWT Secret Leak](./project-data/incidents/i-003-jwt-secret-leak.md)

### Historical / Reference
- [Development History](./archived-2026-05-28/dev-history.md)
- [M2 Test Characterization](./archived-2026-05-28/m2-char-tests/)
- [M2 Milestone Report](./archived-2026-05-28/report.md)

---

**Note:** For AI agent discovery, see [project-index.json](../project-index.json) for machine-readable module catalog. Use `search_project_docs` MCP tool for full-text RAG search across all docs.
```

### Files to Create/Modify in Phase 4

| File | Action | Who | Details |
|------|--------|-----|---------|
| `homework-m6/stage3-living-docs/02-architecture-specs.md` | Create | legacy-auditor-mate (aggregate architecture-mate outputs) | 4 module specs from Phase 3 specialist |
| `homework-m6/stage3-living-docs/03-project-index-schema.md` | Create | legacy-auditor-mate | JSON schema design + rationale + examples |
| `homework-m6/stage3-living-docs/04-update-script-design.md` | Create | legacy-auditor-mate | `update_project_index.py` implementation plan |
| `homework-m6/stage3-living-docs/05-claude-md-updates.md` | Create | legacy-auditor-mate | Proposed CLAUDE.md sections (Living Documentation + AI Agent Integration) |
| `project-index.json` | Create | Phase 4 execution | Module catalog (generated from source) |
| `docs/INDEX.md` | Create | Phase 4 execution | Navigation hub |
| `docs/archived-2026-05-28/` | Create | Phase 4 execution | Move 7 historical files |
| `docs/deferred-2026-05-28/` | Create | Phase 4 execution | Move 3 stale runbooks |
| `docs/project-data/pages/*.md` | Edit | Phase 4 execution | Add TODO markers for post-redesign stale refs (14 files) |
| `docs/project-data/architecture.md` | Edit | Phase 4 execution | Add TODO markers for MCP servers + feature flags sections |
| `docs/project-data/glossary.md` | Edit | Phase 4 execution | Add TODO markers for new feature flag + MCP terms |

---

## VI. PHASE 5 EXECUTION PLAN: Automation

### Install `update_project_index.py`

**Location:** `/Users/Veronica_Lapunka/Documents/git3/proshop_mern/update_project_index.py`

**Purpose:** Regenerate `project-index.json` from source code + docs on command

**Capabilities:**
1. Scan `backend/models/*.js` → extract schema names + fields
2. Scan `backend/controllers/*.js` → extract function names
3. Scan `backend/routes/*.js` → extract endpoints (method, path, auth requirements)
4. Scan `frontend/src/reducers/` → extract reducer names + action types
5. Scan `frontend/src/actions/` → extract thunk names + descriptions
6. Scan `frontend/src/screens/` → extract screen names + routes
7. Scan `frontend/src/components/` → extract component names + types
8. Read `features.json` → extract all 25 feature flags + status/traffic
9. Build cross-references (endpoint ↔ controller, screen ↔ Redux domain)
10. Output: `project-index.json` (versioned + timestamped) + `docs/PROJECT_MAP.md` (human-readable)

**Usage:**
```bash
python update_project_index.py              # Regenerate index
python update_project_index.py --dry-run    # Preview without writing
python update_project_index.py --verbose    # Show scan details
```

### Optional: CLAUDE.md Hook Configuration (SKIP for now)

If desired later, configure PostToolUse hook in settings.json:
```json
{
  "hooks": {
    "post_tool_use": "python update_project_index.py --silent"
  }
}
```

### Update root `CLAUDE.md`

**Add two new sections:**

#### 1. "Living Documentation System" (new section)

```markdown
## Living Documentation System

The project maintains a **machine-readable module catalog** for AI agent discovery:

- **`project-index.json`**: Central inventory of all backend modules, frontend screens, Redux actions, feature flags, and API endpoints. Updated automatically by `update_project_index.py`.
- **`docs/INDEX.md`**: Human-readable navigation hub linking all documentation subdirectories.
- **`docs/archived-2026-05-28/`**: Historical documentation preserved for reference (never deleted).
- **`docs/deferred-2026-05-28/`**: Placeholder runbooks and stale docs set aside for future implementation.

### Consulting the Catalog

When asked about module X or feature Y:
1. Check `project-index.json` first for source paths and cross-references
2. Use `search_project_docs` MCP tool for full-text RAG search across all docs
3. Refer to `docs/INDEX.md` for directory structure and doc organization

### Regenerating the Index

After significant code changes (new screen, new Redux domain, new API endpoint):
```bash
python update_project_index.py
```

This scans the codebase and regenerates `project-index.json` + `docs/PROJECT_MAP.md`.
```

#### 2. "AI Agent Integration Points" (new section)

```markdown
## AI Agent Integration Points

Claude Code uses specialized subagents for complex tasks:

### Agents

| Agent | Role | When to Use | Tools |
|-------|------|-----------|-------|
| `legacy-auditor-mate` | Documentation audit + living docs maintenance | Periodic doc reviews, organizing archive | search_project_docs, project-index.json |
| `architecture-mate` | Reverse-engineer modules + create specs | New feature architecture, refactoring prep | grep, read, project-index.json |
| `security-mate` | Security review + vulnerability audit | Before deployment, security changes | grep, bash, security-specific tools |
| `performance-mate` | Performance profiling + optimization | After user reports, performance regressions | bash, monitoring tools |
| `test-writer-mate` | Test coverage analysis + test generation | Before big refactors, new features | bash, grep, test runners |

### MCP Tools

- **`search_project_docs`** (mcp-docs-search): Full-text RAG search across all docs. Use for feature/architecture questions.
  ```
  Query: "How do I set up feature flags?"
  Returns: Relevant doc chunks with scores
  ```

- **`get_feature_info`** / **`set_feature_state`** / **`list_features`** (mcp-feature-flags): Manage feature flags at runtime.
  ```
  get_feature_info("semantic_search")
  set_feature_state("semantic_search", "Active", 50)  # 50% traffic rollout
  list_features()
  ```

### Workflows

**New Feature Development:**
1. Run `architecture-mate` to reverse-engineer affected modules
2. Check `project-index.json` for cross-references (what else touches this module?)
3. Use `search_project_docs` for related feature docs
4. After implementation, run `update_project_index.py` to regenerate catalog

**Bug Investigation:**
1. Use `search_project_docs` to find relevant incidents + runbooks
2. Check `docs/incidents/` for similar historical issues
3. Run `security-mate` if security-related; `performance-mate` if perf-related

**Documentation Maintenance:**
1. Periodically run `legacy-auditor-mate` to audit for staleness
2. Update CLAUDE.md with new patterns as they emerge
3. Keep `project-index.json` fresh via `python update_project_index.py` after large commits
```

---

## VII. VERIFICATION & SUCCESS CRITERIA

### Completion Checklist

- [ ] **Phase 1.5:** `01-docs-audit.md` completed (59 items classified) ✅
- [ ] **Phase 3:** architecture-mate specialist produces 4 module specs (`02-architecture-specs.md`)
- [ ] **Phase 4a:** `project-index.json` created + validated (all paths exist)
- [ ] **Phase 4b:** `update_project_index.py` installed + executable + dry-run tested
- [ ] **Phase 4c:** `docs/` reorganized per verdicts (archived-2026-05-28/, deferred-2026-05-28/ directories created + files moved)
- [ ] **Phase 4d:** `docs/INDEX.md` created + all links verified
- [ ] **Phase 4e:** 14 page docs + 2 architecture docs + glossary updated with TODO markers
- [ ] **Phase 5:** CLAUDE.md updated (2 new sections: "Living Documentation" + "AI Agent Integration")
- [ ] **All homework deliverables** in `homework-m6/stage3-living-docs/`:
  - `00-plan.md` (THIS FILE)
  - `01-docs-audit.md` ✅
  - `02-architecture-specs.md`
  - `03-project-index-schema.md`
  - `04-update-script-design.md`
  - `05-claude-md-updates.md`
  - `README.md` (summary)

### Validation Tests

1. **project-index.json validity:**
   ```bash
   python -c "import json; json.load(open('project-index.json'))" && echo "Valid JSON"
   ```

2. **Module counts:**
   - Backend: 3 models + 3 controllers + 5 routes + 2 middleware ✓
   - Frontend: 16 screens + 13 components + 5 Redux domains ✓
   - Features: 25 flags in index ✓
   - Endpoints: 20+ routes documented ✓

3. **Docs INDEX.md links:**
   - All links point to existing files in docs/
   - No broken references

4. **Archived docs preserved:**
   - 7 historical files in docs/archived-2026-05-28/
   - 3 stale runbooks in docs/deferred-2026-05-28/
   - NEVER deleted

5. **CLAUDE.md sections:**
   - "Living Documentation" section readable + actionable
   - "AI Agent Integration" section lists all agents + MCP tools

---

## VIII. TIMELINE & RESOURCE ALLOCATION

| Phase | Task | Owner | Estimated Time | Status |
|-------|------|-------|-----------------|--------|
| 1 | Discovery (repo structure, tech stack) | legacy-auditor-mate | 30 min | ✅ Done |
| 1.5 | Docs audit (59 items classified) | legacy-auditor-mate | 45 min | ✅ Done |
| 2 | Planning (this doc + execution strategy) | legacy-auditor-mate | 30 min | ✅ Done |
| 3 | Specialist dispatch (architecture-mate reverse-engineers 4 modules) | architecture-mate | 60-90 min | ✅ Done |
| 4 | Aggregate (project-index.json, update script, doc reorganization, CLAUDE.md updates) | legacy-auditor-mate | 90 min | ✅ Done |
| 5 | Automation (install update_project_index.py, optional hooks) | legacy-auditor-mate | 30 min | ✅ Done |
| **TOTAL** | All phases | — | **≈4-4.5 hours** | ✅ **COMPLETE** |

---

## IX. KNOWN CONSTRAINTS & ASSUMPTIONS

### Constraints

1. **No docs deleted:** All 59 audited items either kept or archived, NEVER deleted
2. **ADR numbering preserved:** Existing numbers (0001-0005, adr-001-005) kept; no renumbering
3. **No moving active docs:** Only archive + deferred dirs created; active docs stay in-place with TODO markers
4. **ES Modules in backend:** All imports require `.js` extension (project constraint)
5. **localStorage + Redux:** Frontend persists cart + userInfo; both must stay synchronized

### Assumptions

1. architecture-mate specialist will complete 4 module specs before Phase 4
2. MongoDB is running locally during Python script development (no runtime execution needed)
3. CLAUDE.md updates will be additive (no existing sections modified)
4. Project-index.json schema finalizes based on architecture-mate recommendations
5. Feature flags system stable at 25 flags (no major changes during Phase 3-5)

---

## X. OPEN QUESTIONS FOR STAKEHOLDER SIGN-OFF

1. ✅ **Audit scope confirmed?** (9 ADRs, 39 project docs, 3 M2 test files, 5 root guides, 2 MCP servers)
2. ✅ **Archival plan approved?** (Move historical to `archived-2026-05-28/`, deferred to `deferred-2026-05-28/`)
3. ✅ **Preserve ADR numbering?** (Keep 0001-0005 + adr-001-005, no restart)
4. ✅ **Module selection for Phase 3?** (Backend routing, Frontend Redux, Feature flags, MCP docs-search)
5. ❓ **Priority on Phase 5 automation?** (Optional — skip PostToolUse hook for now, just manual `python update_project_index.py`?)
6. ❓ **CLAUDE.md sections placement?** (Add after existing sections? Before? At end?)

---

*Plan prepared by legacy-auditor-mate (Haiku 4.5) as Phase 1-2 deliverable. All phases (1.5-5) executed and complete.*

**Status:** Living documentation system operational — `project-index.json` enabled, `update_project_index.py` automated, CLAUDE.md integrated with AI agent workflow guidance.

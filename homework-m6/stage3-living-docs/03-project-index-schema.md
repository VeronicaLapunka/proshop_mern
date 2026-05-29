# Project Index Schema Design

**Document:** 03-project-index-schema.md
**Purpose:** Define the JSON schema for `project-index.json` — the central module catalog for ProShop MERN
**Schema Version:** 1.0
**Date:** 2026-05-28

---

## Overview

`project-index.json` is the single source of truth for all modules, endpoints, components, features, and documentation structure in ProShop MERN. It enables:

1. **Automated discovery** — Scripts can parse this index to understand what modules exist
2. **AI agent integration** — MCP tools and Claude Code can reference this index for context
3. **Documentation navigation** — Living docs stay in sync with actual codebase structure
4. **Dependency mapping** — Visualize how modules connect (Redux → Express routes → MongoDB models)
5. **Feature flag visibility** — All 25 feature flags cataloged with their integration points

---

## JSON Schema Structure

### Root Level

```json
{
  "metadata": { ... },
  "backend": { ... },
  "frontend": { ... },
  "features": { ... },
  "documentation": { ... },
  "cross_references": { ... }
}
```

---

### 1. Metadata Section

Identifies the index itself, version, and generation timestamp.

```json
{
  "metadata": {
    "version": "1.0",
    "generated_at": "2026-05-28T14:32:00Z",
    "generated_by": "update_project_index.py",
    "repository": "proshop_mern",
    "project_description": "MERN eCommerce platform (deprecated fork)",
    "tech_stack": ["Node.js (ES Modules)", "Express.js 4.x", "React 17 + Redux", "MongoDB + Mongoose 5"],
    "ports": {
      "backend": 5001,
      "frontend": 3000,
      "database": 27017
    }
  }
}
```

---

### 2. Backend Section

Catalogs all server-side modules: models, controllers, routes, middleware, utilities.

```json
{
  "backend": {
    "base_path": "backend/",
    "language": "JavaScript (ES Modules)",
    "entry_point": "backend/server.js",
    "models": [
      {
        "name": "Product",
        "file": "backend/models/productModel.js",
        "fields": [
          { "name": "name", "type": "String", "required": true },
          { "name": "price", "type": "Number", "required": true },
          { "name": "description", "type": "String" },
          { "name": "image", "type": "String" },
          { "name": "brand", "type": "String" },
          { "name": "category", "type": "String" },
          { "name": "countInStock", "type": "Number", "required": true },
          { "name": "rating", "type": "Number", "default": 0 },
          { "name": "numReviews", "type": "Number", "default": 0 }
        ],
        "relationships": ["reviews (embedded)"]
      },
      {
        "name": "User",
        "file": "backend/models/userModel.js",
        "fields": [
          { "name": "name", "type": "String", "required": true },
          { "name": "email", "type": "String", "required": true, "unique": true },
          { "name": "password", "type": "String", "required": true },
          { "name": "isAdmin", "type": "Boolean", "default": false }
        ],
        "relationships": []
      },
      {
        "name": "Order",
        "file": "backend/models/orderModel.js",
        "fields": [
          { "name": "user", "type": "ObjectId", "ref": "User", "required": true },
          { "name": "orderItems", "type": "Array", "items_schema": "{ product: ObjectId, qty: Number, price: Number }" },
          { "name": "shippingAddress", "type": "Object" },
          { "name": "paymentMethod", "type": "String" },
          { "name": "paymentResult", "type": "Object" },
          { "name": "itemsPrice", "type": "Number", "default": 0 },
          { "name": "taxPrice", "type": "Number", "default": 0 },
          { "name": "shippingPrice", "type": "Number", "default": 0 },
          { "name": "totalPrice", "type": "Number", "default": 0 },
          { "name": "isPaid", "type": "Boolean", "default": false },
          { "name": "isDelivered", "type": "Boolean", "default": false }
        ],
        "relationships": ["User (ref)"]
      }
    ],
    "controllers": [
      {
        "name": "productController",
        "file": "backend/controllers/productController.js",
        "actions": [
          { "name": "getProducts", "route": "GET /api/products", "async": true },
          { "name": "getProductById", "route": "GET /api/products/:id", "async": true },
          { "name": "deleteProduct", "route": "DELETE /api/products/:id", "async": true, "auth": "admin" },
          { "name": "createProduct", "route": "POST /api/products", "async": true, "auth": "admin" },
          { "name": "updateProduct", "route": "PUT /api/products/:id", "async": true, "auth": "admin" },
          { "name": "createProductReview", "route": "POST /api/products/:id/reviews", "async": true, "auth": "user" },
          { "name": "getTopProducts", "route": "GET /api/products/top/:limit", "async": true }
        ]
      },
      {
        "name": "userController",
        "file": "backend/controllers/userController.js",
        "actions": [
          { "name": "authUser", "route": "POST /api/users/login", "async": true },
          { "name": "getUserProfile", "route": "GET /api/users/profile", "async": true, "auth": "user" },
          { "name": "updateUserProfile", "route": "PUT /api/users/profile", "async": true, "auth": "user" },
          { "name": "getUsers", "route": "GET /api/users", "async": true, "auth": "admin" },
          { "name": "deleteUser", "route": "DELETE /api/users/:id", "async": true, "auth": "admin" },
          { "name": "getUserById", "route": "GET /api/users/:id", "async": true, "auth": "admin" },
          { "name": "updateUser", "route": "PUT /api/users/:id", "async": true, "auth": "admin" },
          { "name": "registerUser", "route": "POST /api/users", "async": true }
        ]
      },
      {
        "name": "orderController",
        "file": "backend/controllers/orderController.js",
        "actions": [
          { "name": "addOrderItems", "route": "POST /api/orders", "async": true, "auth": "user" },
          { "name": "getOrderById", "route": "GET /api/orders/:id", "async": true, "auth": "user" },
          { "name": "updateOrderToPaid", "route": "PUT /api/orders/:id/pay", "async": true, "auth": "user" },
          { "name": "getMyOrders", "route": "GET /api/orders/myorders", "async": true, "auth": "user" },
          { "name": "getOrders", "route": "GET /api/orders", "async": true, "auth": "admin" },
          { "name": "updateOrderToDelivered", "route": "PUT /api/orders/:id/deliver", "async": true, "auth": "admin" }
        ]
      }
    ],
    "routes": [
      {
        "name": "productRoutes",
        "file": "backend/routes/productRoutes.js",
        "base_path": "/api/products",
        "endpoints": 7
      },
      {
        "name": "userRoutes",
        "file": "backend/routes/userRoutes.js",
        "base_path": "/api/users",
        "endpoints": 8
      },
      {
        "name": "orderRoutes",
        "file": "backend/routes/orderRoutes.js",
        "base_path": "/api/orders",
        "endpoints": 6
      },
      {
        "name": "uploadRoutes",
        "file": "backend/routes/uploadRoutes.js",
        "base_path": "/api/upload",
        "endpoints": 1
      },
      {
        "name": "featureFlagRoutes",
        "file": "backend/routes/featureFlagRoutes.js",
        "base_path": "/api/features",
        "endpoints": 4
      }
    ],
    "middleware": [
      {
        "name": "authMiddleware",
        "file": "backend/middleware/authMiddleware.js",
        "functions": [
          { "name": "protect", "purpose": "Verify JWT token in Authorization header, extract user info to req.user" },
          { "name": "admin", "purpose": "Check req.user.isAdmin = true (must follow protect middleware)" }
        ]
      },
      {
        "name": "errorMiddleware",
        "file": "backend/middleware/errorMiddleware.js",
        "functions": [
          { "name": "notFound", "purpose": "Catch 404 requests, forward to error handler" },
          { "name": "errorHandler", "purpose": "Standardize error response format: { message, status }" }
        ]
      }
    ],
    "utilities": [
      {
        "name": "generateToken",
        "file": "backend/utils/generateToken.js",
        "purpose": "Create JWT token with user ID payload, expires in 30 days"
      }
    ],
    "total_endpoints": 26,
    "authentication_required_endpoints": 14,
    "admin_only_endpoints": 8
  }
}
```

---

### 3. Frontend Section

Catalogs React components, Redux state management, screens.

```json
{
  "frontend": {
    "base_path": "frontend/src/",
    "framework": "React 17 + Redux",
    "screens": [
      {
        "name": "HomeScreen",
        "file": "frontend/src/screens/HomeScreen.js",
        "route": "/",
        "auth_required": false,
        "description": "Product listing with pagination"
      },
      {
        "name": "ProductScreen",
        "file": "frontend/src/screens/ProductScreen.js",
        "route": "/product/:id",
        "auth_required": false,
        "description": "Product detail with reviews and ratings"
      },
      {
        "name": "CartScreen",
        "file": "frontend/src/screens/CartScreen.js",
        "route": "/cart",
        "auth_required": false,
        "description": "Shopping cart management"
      },
      {
        "name": "LoginScreen",
        "file": "frontend/src/screens/LoginScreen.js",
        "route": "/login",
        "auth_required": false,
        "description": "User authentication"
      },
      {
        "name": "RegisterScreen",
        "file": "frontend/src/screens/RegisterScreen.js",
        "route": "/register",
        "auth_required": false,
        "description": "User account creation"
      },
      {
        "name": "ProfileScreen",
        "file": "frontend/src/screens/ProfileScreen.js",
        "route": "/profile",
        "auth_required": true,
        "description": "User profile and order history"
      },
      {
        "name": "ShippingScreen",
        "file": "frontend/src/screens/ShippingScreen.js",
        "route": "/shipping",
        "auth_required": true,
        "description": "Checkout step: shipping address"
      },
      {
        "name": "PaymentScreen",
        "file": "frontend/src/screens/PaymentScreen.js",
        "route": "/payment",
        "auth_required": true,
        "description": "Checkout step: payment method selection"
      },
      {
        "name": "PlaceOrderScreen",
        "file": "frontend/src/screens/PlaceOrderScreen.js",
        "route": "/placeorder",
        "auth_required": true,
        "description": "Checkout step: order review and placement"
      },
      {
        "name": "OrderScreen",
        "file": "frontend/src/screens/OrderScreen.js",
        "route": "/order/:id",
        "auth_required": true,
        "description": "Order details and tracking"
      },
      {
        "name": "OrderListScreen",
        "file": "frontend/src/screens/OrderListScreen.js",
        "route": "/admin/orderlist",
        "auth_required": true,
        "admin_only": true,
        "description": "Admin: view all orders"
      },
      {
        "name": "ProductListScreen",
        "file": "frontend/src/screens/ProductListScreen.js",
        "route": "/admin/productlist",
        "auth_required": true,
        "admin_only": true,
        "description": "Admin: manage product catalog"
      },
      {
        "name": "ProductEditScreen",
        "file": "frontend/src/screens/ProductEditScreen.js",
        "route": "/admin/product/:id/edit",
        "auth_required": true,
        "admin_only": true,
        "description": "Admin: edit product details"
      },
      {
        "name": "UserListScreen",
        "file": "frontend/src/screens/UserListScreen.js",
        "route": "/admin/userlist",
        "auth_required": true,
        "admin_only": true,
        "description": "Admin: manage users"
      },
      {
        "name": "UserEditScreen",
        "file": "frontend/src/screens/UserEditScreen.js",
        "route": "/admin/user/:id/edit",
        "auth_required": true,
        "admin_only": true,
        "description": "Admin: edit user details"
      },
      {
        "name": "FeatureDashboardScreen",
        "file": "frontend/src/screens/FeatureDashboardScreen.js",
        "route": "/admin/features",
        "auth_required": true,
        "admin_only": true,
        "description": "Admin: feature flag management dashboard"
      }
    ],
    "components": [
      {
        "name": "Header",
        "file": "frontend/src/components/Header.js",
        "type": "Layout",
        "purpose": "Navigation header with search and user menu"
      },
      {
        "name": "Footer",
        "file": "frontend/src/components/Footer.js",
        "type": "Layout",
        "purpose": "Footer with company info and links"
      },
      {
        "name": "Product",
        "file": "frontend/src/components/Product.js",
        "type": "Card",
        "purpose": "Product card for grid display"
      },
      {
        "name": "Rating",
        "file": "frontend/src/components/Rating.js",
        "type": "Display",
        "purpose": "Star rating display component"
      },
      {
        "name": "Paginate",
        "file": "frontend/src/components/Paginate.js",
        "type": "Navigation",
        "purpose": "Pagination controls for product lists"
      },
      {
        "name": "Loader",
        "file": "frontend/src/components/Loader.js",
        "type": "Feedback",
        "purpose": "Loading spinner"
      },
      {
        "name": "Message",
        "file": "frontend/src/components/Message.js",
        "type": "Feedback",
        "purpose": "Alert messages (error, success, warning)"
      },
      {
        "name": "FormContainer",
        "file": "frontend/src/components/FormContainer.js",
        "type": "Layout",
        "purpose": "Centered form wrapper"
      },
      {
        "name": "CheckoutSteps",
        "file": "frontend/src/components/CheckoutSteps.js",
        "type": "Navigation",
        "purpose": "Multi-step checkout progress indicator"
      },
      {
        "name": "SearchBox",
        "file": "frontend/src/components/SearchBox.js",
        "type": "Form",
        "purpose": "Product search input with autocomplete"
      },
      {
        "name": "ProductCarousel",
        "file": "frontend/src/components/ProductCarousel.js",
        "type": "Display",
        "purpose": "Carousel for featured/trending products"
      },
      {
        "name": "Meta",
        "file": "frontend/src/components/Meta.js",
        "type": "Utility",
        "purpose": "Dynamic page title and meta tags"
      },
      {
        "name": "PrivateRoute",
        "file": "frontend/src/components/PrivateRoute.js",
        "type": "Route",
        "purpose": "Auth-required route wrapper"
      }
    ],
    "redux_domains": [
      {
        "name": "product",
        "actions_file": "frontend/src/actions/productActions.js",
        "reducers_file": "frontend/src/reducers/productReducers.js",
        "constants_file": "frontend/src/constants/productConstants.js",
        "state_shape": {
          "products": { "loading": "bool", "error": "string|null", "data": "Product[]" },
          "productDetails": { "loading": "bool", "error": "string|null", "data": "Product" },
          "productDelete": { "loading": "bool", "error": "string|null", "success": "bool" },
          "productCreate": { "loading": "bool", "error": "string|null", "success": "bool", "data": "Product" },
          "productUpdate": { "loading": "bool", "error": "string|null", "success": "bool", "data": "Product" },
          "productReviewCreate": { "loading": "bool", "error": "string|null", "success": "bool" }
        },
        "action_count": 6
      },
      {
        "name": "user",
        "actions_file": "frontend/src/actions/userActions.js",
        "reducers_file": "frontend/src/reducers/userReducers.js",
        "constants_file": "frontend/src/constants/userConstants.js",
        "state_shape": {
          "userLogin": { "loading": "bool", "error": "string|null", "userInfo": "User" },
          "userRegister": { "loading": "bool", "error": "string|null", "userInfo": "User" },
          "userDetails": { "loading": "bool", "error": "string|null", "user": "User" },
          "userUpdateProfile": { "loading": "bool", "error": "string|null", "success": "bool", "userInfo": "User" },
          "userList": { "loading": "bool", "error": "string|null", "users": "User[]" },
          "userDelete": { "loading": "bool", "error": "string|null", "success": "bool" },
          "userUpdate": { "loading": "bool", "error": "string|null", "success": "bool", "user": "User" }
        },
        "action_count": 8
      },
      {
        "name": "order",
        "actions_file": "frontend/src/actions/orderActions.js",
        "reducers_file": "frontend/src/reducers/orderReducers.js",
        "constants_file": "frontend/src/constants/orderConstants.js",
        "state_shape": {
          "orderCreate": { "loading": "bool", "error": "string|null", "success": "bool", "order": "Order" },
          "orderDetails": { "loading": "bool", "error": "string|null", "order": "Order" },
          "orderPay": { "loading": "bool", "error": "string|null", "success": "bool" },
          "orderDeliver": { "loading": "bool", "error": "string|null", "success": "bool" },
          "orderList": { "loading": "bool", "error": "string|null", "orders": "Order[]" }
        },
        "action_count": 6
      },
      {
        "name": "cart",
        "actions_file": "frontend/src/actions/cartActions.js",
        "reducers_file": "frontend/src/reducers/cartReducers.js",
        "constants_file": "frontend/src/constants/cartConstants.js",
        "state_shape": {
          "cartItems": "CartItem[]",
          "shippingAddress": "ShippingAddress",
          "paymentMethod": "string",
          "localStorage_persistence": true
        },
        "action_count": 1
      },
      {
        "name": "featureFlag",
        "actions_file": "frontend/src/actions/featureFlagActions.js",
        "reducers_file": "frontend/src/reducers/featureFlagReducers.js",
        "constants_file": "frontend/src/constants/featureFlagConstants.js",
        "state_shape": {
          "featureFlagList": { "loading": "bool", "error": "string|null", "flags": "FeatureFlag[]" },
          "featureFlagDetails": { "loading": "bool", "error": "string|null", "flag": "FeatureFlag" },
          "featureFlagUpdate": { "loading": "bool", "error": "string|null", "success": "bool" }
        },
        "action_count": 3
      }
    ],
    "total_screens": 16,
    "total_components": 13,
    "redux_domains": 5,
    "localStorage_keys": ["cartItems", "userInfo"]
  }
}
```

---

### 4. Features Section

Catalogs all 25 feature flags from features.json with integration points.

```json
{
  "features": {
    "total_count": 25,
    "by_status": {
      "Enabled": 8,
      "Testing": 6,
      "Disabled": 11
    },
    "by_category": {
      "search": 3,
      "cart": 3,
      "checkout": 4,
      "payments": 3,
      "recommendations": 1,
      "ui": 4,
      "admin": 4,
      "reviews": 3
    },
    "flags": [
      {
        "name": "search_v2",
        "status": "Testing",
        "traffic_percentage": 85,
        "category": "search",
        "integration_points": [
          "backend: productController.search endpoint",
          "frontend: HomeScreen search input",
          "MCP: feature-flags/get_feature_info"
        ],
        "dependencies": []
      },
      {
        "name": "semantic_search",
        "status": "Testing",
        "traffic_percentage": 25,
        "category": "search",
        "integration_points": [
          "backend: productController with embedding query",
          "frontend: SearchBox component",
          "MCP: feature-flags/list_features"
        ],
        "dependencies": ["search_v2"]
      }
    ]
  }
}
```

---

### 5. Documentation Section

Catalogs all 59 documentation files organized by verdict.

```json
{
  "documentation": {
    "base_path": "docs/",
    "total_files": 59,
    "audit_date": "2026-05-28",
    "by_verdict": {
      "accurate": 27,
      "partially_accurate": 8,
      "historical": 7,
      "stale_archived": 3,
      "deferred": 3
    },
    "categories": [
      {
        "name": "ADRs",
        "path": "docs/adr/",
        "count": 9,
        "verdict": "✅ ACCURATE",
        "action": "keep as-is"
      },
      {
        "name": "API Specifications",
        "path": "docs/project-data/api/",
        "count": 5,
        "verdict": "✅ ACCURATE",
        "action": "keep as-is"
      },
      {
        "name": "Feature Documentation",
        "path": "docs/project-data/features/",
        "count": 6,
        "verdict": "✅ ACCURATE",
        "action": "keep as-is"
      },
      {
        "name": "Page/Screen Documentation",
        "path": "docs/project-data/pages/",
        "count": 14,
        "verdict": "🔄 PARTIALLY ACCURATE",
        "action": "update with TODO markers for design refs (post-Stage4 redesign)"
      },
      {
        "name": "Runbooks",
        "path": "docs/project-data/runbooks/",
        "count": 6,
        "verdict": "🔄 PARTIALLY ACCURATE (4 accurate, 2 stale)",
        "action": "keep 4 accurate, move 2 stale to deferred/"
      },
      {
        "name": "Incidents",
        "path": "docs/project-data/incidents/",
        "count": 3,
        "verdict": "✅ ACCURATE",
        "action": "keep as-is"
      },
      {
        "name": "Architecture & Supporting Docs",
        "path": "docs/project-data/",
        "count": 4,
        "verdict": "✅ (2) + 🔄 (2)",
        "action": "keep 2, update 2 with TODO (architecture.md, glossary.md)"
      },
      {
        "name": "M2 Test Characterization",
        "path": "docs/m2-char-tests/",
        "count": 4,
        "verdict": "📦 HISTORICAL",
        "action": "archive to docs/archived-2026-05-28/"
      },
      {
        "name": "Other Files",
        "path": "docs/",
        "count": 2,
        "verdict": "✅ (1) + ❌ (1)",
        "action": "keep chunks.jsonl, archive features-analysis-ru.md"
      }
    ],
    "archived_2026_05_28": {
      "reason": "historical but valuable for context",
      "files": [
        "docs/m2-char-tests/characterization.test.js",
        "docs/m2-char-tests/refactored.js",
        "docs/m2-char-tests/reflection.md",
        "docs/project-data/report.md",
        "docs/project-data/feature-flags-analysis-ru.md"
      ]
    },
    "deferred_2026_05_28": {
      "reason": "stale placeholder templates, may be revisited",
      "files": [
        "docs/project-data/runbooks/ab-test-setup.md",
        "docs/project-data/runbooks/feature-flag-toggle.md",
        "docs/project-data/features/features-analysis-ru.md"
      ]
    },
    "todo_updates_required": [
      {
        "file": "docs/project-data/pages/*",
        "reason": "post-Stage4 redesign, design refs stale",
        "marker": "TODO(audit-2026-05-28): Update design references for Stage 4 redesign"
      },
      {
        "file": "docs/project-data/architecture.md",
        "reason": "missing MCP servers and feature flags documentation",
        "marker": "TODO(audit-2026-05-28): Add MCP servers (docs-search, feature-flags) and features.json architecture"
      },
      {
        "file": "docs/project-data/glossary.md",
        "reason": "missing new feature flag terminology",
        "marker": "TODO(audit-2026-05-28): Add terms for feature flags, traffic rollout, dependencies"
      }
    ]
  }
}
```

---

### 6. Cross-References Section

Maps dependencies and integration points across modules.

```json
{
  "cross_references": {
    "frontend_to_backend_actions": [
      {
        "frontend_action": "deleteProduct (productActions.js)",
        "backend_route": "DELETE /api/products/:id",
        "backend_controller": "productController.deleteProduct",
        "auth": "admin",
        "description": "Admin product deletion flow"
      }
    ],
    "redux_to_localstorage": [
      {
        "redux_domain": "cart",
        "key": "cartItems",
        "persistence": "manual dispatch in cartReducers",
        "recovery": "store.subscribe() on app init"
      },
      {
        "redux_domain": "user",
        "key": "userInfo",
        "persistence": "manual dispatch in userReducers on login",
        "recovery": "store.subscribe() on app init"
      }
    ],
    "feature_flags_integration": [
      {
        "flag": "search_v2",
        "backend_integration": "productController search path branch",
        "frontend_integration": "HomeScreen/SearchBox conditional rendering",
        "mcp_tool": "get_feature_info('search_v2')"
      }
    ],
    "docs_search_integration": [
      {
        "purpose": "Find architecture documentation",
        "mcp_tool": "search_project_docs('architecture')",
        "expected_results": "Chunks from docs/adr/, docs/project-data/architecture.md, docs/project-data/api/*"
      }
    ]
  }
}
```

---

## Example Usage

### Querying the Index

```python
import json

with open('project-index.json') as f:
    index = json.load(f)

# Find all admin-only backend endpoints
admin_endpoints = [
    ep for ctrl in index['backend']['controllers']
    for ep in ctrl['actions'] if ep.get('auth') == 'admin'
]
print(f"Found {len(admin_endpoints)} admin-only endpoints")

# Find all feature flags in Testing status
testing_flags = [
    flag for flag in index['features']['flags']
    if flag['status'] == 'Testing'
]
print(f"Found {len(testing_flags)} features in Testing status")

# Find all screens with auth_required = true
protected_screens = [
    screen for screen in index['frontend']['screens']
    if screen.get('auth_required')
]
print(f"Found {len(protected_screens)} protected screens")
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-28 | Initial schema design for legacy audit Phase 4 |

---

## Maintenance Notes

- **Generated by:** `update_project_index.py` (Phase 5)
- **Update frequency:** Manual or post-commit (configurable hook in Phase 5)
- **Last manually edited:** Never (always regenerated from source)
- **Breaking changes:** If schema version changes, all downstream consumers must update parsing logic


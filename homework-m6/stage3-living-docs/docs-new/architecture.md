# ProShop MERN Architecture

## System Overview

ProShop is a full-stack eCommerce platform built with MongoDB, Express, React, and Node.js. This document describes the architectural design, component interaction, and data flow.

## C4 Container Diagram

```mermaid
graph TB
    subgraph Browser["🌐 Browser / Client"]
        UI["React App<br/>frontend/src/App.js"]
        Redux["Redux Store<br/>frontend/src/store.js"]
        LocalStorage["Local Storage<br/>cartItems, userInfo<br/>shippingAddress, paymentMethod"]
        ServiceWorker["Service Worker<br/>frontend/src/serviceWorker.js"]
    end

    subgraph FrontendLayer["📦 Frontend Components & Logic"]
        Screens["Screen Components<br/>frontend/src/screens/<br/>• HomeScreen.js<br/>• ProductScreen.js<br/>• CartScreen.js<br/>• LoginScreen.js<br/>• ShippingScreen.js<br/>• PaymentScreen.js<br/>• PlaceOrderScreen.js<br/>• OrderScreen.js<br/>• ProductListScreen.js"]
        
        UIComponents["UI Components<br/>frontend/src/components/<br/>• Header.js<br/>• Footer.js<br/>• Product.js<br/>• Rating.js<br/>• SearchBox.js<br/>• Paginate.js"]
        
        Actions["Redux Action Creators<br/>frontend/src/actions/<br/>• productActions.js<br/>• cartActions.js<br/>• userActions.js<br/>• orderActions.js"]
        
        Reducers["Redux Reducers<br/>frontend/src/reducers/<br/>• productReducers.js<br/>• cartReducers.js<br/>• userReducers.js<br/>• orderReducers.js"]
    end

    subgraph BackendLayer["🖥️ Backend API Server"]
        Server["Express App<br/>backend/server.js"]
        
        Routes["Route Handlers<br/>backend/routes/<br/>• productRoutes.js<br/>• userRoutes.js<br/>• orderRoutes.js<br/>• uploadRoutes.js"]
        
        Controllers["Controllers<br/>backend/controllers/<br/>• productController.js<br/>• userController.js<br/>• orderController.js"]
        
        Middleware["Middleware<br/>backend/middleware/<br/>• authMiddleware.js<br/>• errorMiddleware.js"]
        
        Utils["Utilities<br/>backend/utils/<br/>• generateToken.js"]
    end

    subgraph DataLayer["💾 Data & Persistence"]
        Models["Data Models<br/>backend/models/<br/>• productModel.js<br/>• userModel.js<br/>• orderModel.js"]
        
        DB["MongoDB<br/>proshop<br/>Collections:<br/>• products<br/>• users<br/>• orders"]
        
        Uploads["File Storage<br/>uploads/<br/>product images<br/>user avatars"]
        
        SampleData["Seed Data<br/>backend/data/<br/>• products.js<br/>• users.js<br/>(Used by seeder.js)"]
    end

    subgraph ExternalServices["🔗 External Services & APIs"]
        PayPal["PayPal API<br/>sandbox.paypal.com"]
        ConfigEndpoint["PayPal Config<br>/api/config/paypal<br/>PAYPAL_CLIENT_ID"]
    end

    subgraph CLI["⚙️ CLI Tools"]
        Seeder["Database Seeder<br/>backend/seeder.js<br/>npm run data:import<br/>npm run data:destroy"]
    end

    %% Frontend to Redux
    Screens -->|dispatch actions| Redux
    UIComponents -->|connect to state| Redux
    Redux -->|push to localStorage| LocalStorage
    LocalStorage -->|rehydrate state| Redux

    %% Frontend to Backend
    Actions -->|HTTP Requests<br/>Axios| Server
    Actions -->|GET /api/products| Routes
    Actions -->|POST /api/users/login| Routes
    Actions -->|POST /api/orders| Routes
    Actions -->|POST /api/upload| Routes

    %% Backend routing
    Routes -->|delegate| Controllers
    Controllers -->|auth check| Middleware
    Controllers -->|JWT token| Utils

    %% Backend to Database
    Controllers -->|CRUD ops| Models
    Models -->|read/write| DB
    Models -->|reference| Models
    Seeder -->|populate| DB
    Seeder -->|read| SampleData

    %% Static files
    Server -->|serve| Uploads

    %% PayPal integration
    Actions -->|Load client ID| ConfigEndpoint
    Actions -->|Approve payment<br/>POST /api/orders/:id/pay| Controllers
    Controllers -->|Verify payment| PayPal

    %% Production build
    Server -->|serve SPA<br/>production mode| Screens

    %% Styling
    classDef frontend fill:#4A90E2,stroke:#2E5C8A,color:#fff
    classDef backend fill:#7ED321,stroke:#4A7A1A,color:#000
    classDef data fill:#F5A623,stroke:#A0670B,color:#000
    classDef external fill:#BD10E0,stroke:#6B0078,color:#fff
    classDef cli fill:#50E3C2,stroke:#1C8C6B,color:#000

    class Browser,FrontendLayer,Screens,UIComponents,Actions,Reducers frontend
    class BackendLayer,Server,Routes,Controllers,Middleware,Utils backend
    class DataLayer,Models,DB,Uploads,SampleData data
    class ExternalServices,PayPal,ConfigEndpoint external
    class CLI,Seeder cli
```

## Data Flow: "Place Order" Use Case

The following sequence shows the complete data flow when a user places an order with PayPal payment:

```mermaid
sequenceDiagram
    actor User
    participant Browser as Browser<br/>React + Redux
    participant FE_Action as frontend/src/actions/<br/>orderActions.js
    participant Backend as Express Server<br/>backend/server.js
    participant Controller as backend/controllers/<br/>orderController.js
    participant Model as backend/models/<br/>orderModel.js
    participant DB as MongoDB<br/>proshop.orders
    participant PayPal as PayPal Sandbox API

    User->>Browser: Click "Place Order"
    Browser->>Redux: Dispatch ORDER_CREATE_REQUEST
    Redux->>FE_Action: placeOrder(order)
    FE_Action->>Backend: POST /api/orders + JWT token<br/>{orderItems, shippingAddress, paymentMethod}
    
    Backend->>Backend: authMiddleware: verify JWT
    Backend->>Controller: createOrder()
    Controller->>Model: Order.create({...})
    Model->>DB: Insert new order document
    DB-->>Model: Return order._id
    Model-->>Controller: Saved order object
    
    Controller-->>Backend: res.status(201).json(order)
    Backend-->>FE_Action: 201 Created
    FE_Action->>Redux: Dispatch ORDER_CREATE_SUCCESS
    Redux->>Browser: Update state + redirect
    
    User->>Browser: PayPal button click
    Browser->>PayPal: Load PayPal client<br/>(via PAYPAL_CLIENT_ID from /api/config/paypal)
    PayPal-->>Browser: Approve payment
    
    Browser->>FE_Action: onApprove(details, data)
    FE_Action->>Backend: POST /api/orders/:id/pay<br/>{paymentResult}
    Backend->>Controller: updateOrderToPaid()
    Controller->>Model: Order.findByIdAndUpdate()
    Model->>DB: Update order.isPaid = true<br/>order.paidAt = Date.now()
    DB-->>Controller: Updated order
    Controller-->>FE_Action: 200 OK
    FE_Action->>Redux: Dispatch ORDER_PAY_SUCCESS
    Redux->>Browser: Mark order as paid
    Browser-->>User: Show "Order Confirmed" message
```

## Entry Points

### Frontend Entry Points
- **`frontend/src/index.js`** — React app initialization, Provider wraps Redux store
- **`frontend/src/App.js`** — Main router, defines all screen routes
- **Screen Components** — Entry points for user interactions (`HomeScreen`, `LoginScreen`, etc.)
- **Action Creators** (`frontend/src/actions/*`) — Initiate HTTP requests via Redux Thunk

### Backend Entry Points
- **`backend/server.js`** — Express app, middleware registration, route mounting
- **Routes** (`backend/routes/*`) — HTTP endpoints (e.g., `POST /api/orders`)
- **Controllers** (`backend/controllers/*`) — Business logic handlers
- **CLI Commands** — `backend/seeder.js` (data import/destroy via npm scripts)

### External Entry Points
- **PayPal Sandbox API** — Called from frontend via `react-paypal-button-v2` library
- **Multer File Upload** — `backend/routes/uploadRoutes.js` saves to `uploads/` directory

## Data Stores

### MongoDB Collections
- **`products`** — Product catalog with prices, reviews, stock
- **`users`** — User accounts with hashed passwords, roles (admin/customer)
- **`orders`** — Order records with items, shipping address, payment status

### Browser Local Storage
- **`cartItems`** — Array of products in cart
- **`userInfo`** — Logged-in user data + JWT token
- **`shippingAddress`** — Delivery address
- **`paymentMethod`** — Payment method selection (Credit Card / PayPal)

### File System Storage
- **`uploads/`** — Product images and user avatars (ephemeral on cloud platforms)

## External Services & APIs

### PayPal
- **Endpoint**: `sandbox.paypal.com` (development) / `paypal.com` (production)
- **Client ID**: Configured via `PAYPAL_CLIENT_ID` environment variable
- **Config endpoint**: `GET /api/config/paypal` — frontend fetches client ID before rendering PayPal button
- **Payment approval**: Frontend calls PayPal SDK → user approves → sends payment details to `POST /api/orders/:id/pay`

## Technology Stack

### Frontend
- **React 16+** — UI library, component-based architecture
- **Redux** — Centralized state management with Redux Thunk for async actions
- **React Router v5** — Client-side routing between screens
- **Axios** — HTTP client for API calls
- **React Bootstrap** — UI components
- **react-paypal-button-v2** — PayPal payment integration

### Backend
- **Express.js** — HTTP server framework
- **Mongoose** — MongoDB object modeling
- **bcryptjs** — Password hashing
- **jsonwebtoken** — JWT token generation and verification
- **Multer** — File upload handling
- **express-async-handler** — Async route error wrapping
- **morgan** — HTTP request logging (development)
- **dotenv** — Environment variable management

### Database
- **MongoDB 4+** — NoSQL document database
- **Mongoose 5** — Schema validation and relationships

### DevOps & Environment
- **Node.js 14.6+** — ES Modules support
- **npm** — Package management
- **Heroku** — Primary deployment target (with `heroku-postbuild`)
- **Docker** — Optional MongoDB containerization

## Authentication & Authorization Flow

```
User → LoginScreen (frontend/src/screens/LoginScreen.js)
  ↓
dispatch userLoginAction (frontend/src/actions/userActions.js)
  ↓
POST /api/users/login (backend/routes/userRoutes.js)
  ↓
userController.authUser() (backend/controllers/userController.js)
  ↓
generateToken (backend/utils/generateToken.js)
  ↓
Response includes JWT token
  ↓
Frontend stores token in localStorage.userInfo
  ↓
Protected routes require authMiddleware (backend/middleware/authMiddleware.js)
  ↓
authMiddleware extracts JWT from Authorization: Bearer <token> header
  ↓
Verified user attached to req.user
  ↓
Controller can access req.user for authorization checks
```

Auto-logout occurs when backend returns error: `'Not authorized, token failed'` (matched by frontend catch handlers in all action creators).

## File Organization

```
proshop_mern/
├── frontend/
│   ├── src/
│   │   ├── index.js                     # React entry point
│   │   ├── App.js                       # Main router
│   │   ├── store.js                     # Redux store configuration
│   │   ├── actions/                     # Redux action creators (Thunks)
│   │   ├── reducers/                    # Redux reducers
│   │   ├── screens/                     # Full-page components
│   │   ├── components/                  # Reusable UI components
│   │   ├── constants/                   # Redux action type strings
│   │   └── serviceWorker.js             # PWA service worker
│   └── package.json                     # Frontend dependencies
│
├── backend/
│   ├── server.js                        # Express app entry point
│   ├── seeder.js                        # CLI: Database initialization
│   ├── config/
│   │   └── db.js                        # MongoDB connection
│   ├── routes/                          # HTTP endpoint definitions
│   ├── controllers/                     # Request handlers
│   ├── models/                          # Mongoose schemas
│   ├── middleware/                      # Auth & error handling
│   ├── utils/                           # Helper functions
│   ├── data/                            # Sample seed data
│   └── CLAUDE.md                        # Backend architecture guide
│
├── uploads/                             # Product images & avatars
├── docs/                                # Project documentation
├── .env                                 # Environment variables (local dev)
├── .env.example                         # Environment variables template
├── CLAUDE.md                            # Main project guide
└── package.json                         # Root dependencies & scripts
```

## Deployment Architecture

### Development
```
npm run dev
├── Frontend: React dev server (:3000) — Webpack, hot reload, proxy to backend
└── Backend: Node.js (:5001) — nodemon, Morgan logging
```

### Production
```
node backend/server.js (PORT injected by platform)
├── Frontend: Static build (frontend/build/) served by Express
└── Backend: Minified Node.js app
```

## Known Limitations & Gotchas

1. **File Storage is Ephemeral** — `uploads/` exists only on the running instance. On cloud platforms with auto-scaling or container restart, uploaded files are lost. Replace with S3, Cloudinary, or similar.

2. **No CORS Middleware** — CRA dev proxy handles cross-origin during development; production relies on same-origin. If frontend and backend are on separate domains, add `cors` package.

3. **Port 5000 Reserved** — macOS Control Center holds port 5000. Backend uses 5001. Mismatch between `.env` PORT and frontend `package.json` proxy causes silent `ECONNREFUSED`.

4. **JWT Token in localStorage** — XSS-vulnerable. Consider moving to secure, httpOnly cookies in production.

5. **Mongoose Version Lock** — Cannot upgrade past v5 without removing `useCreateIndex: true` config.

## Performance Considerations

- **No API caching** — Every screen reload fetches fresh data from backend
- **No pagination lazy-loading** — Product list loads entire page at once
- **No image optimization** — Uploaded images served as-is, no CDN or resizing
- **No code splitting** — Entire React app bundled into single JS file (requires webpack refactor)
- **Redux DevTools in prod** — `composeWithDevTools` left enabled, adds memory overhead

## Security Considerations

- JWT tokens stored in localStorage (XSS-readable)
- No CSRF protection tokens
- No rate limiting on endpoints
- Passwords hashed with bcryptjs (secure)
- Admin routes depend on `admin` middleware after `protect` (correct order enforced)
- File uploads not validated for type/size

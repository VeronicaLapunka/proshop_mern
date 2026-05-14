# ProShop MERN eCommerce Platform

A full-stack eCommerce application built with MongoDB, Express.js, React, and Node.js. Users can browse products, write reviews, add items to cart, and complete purchases with PayPal integration. Admin users can manage products, users, and orders.

## ⚠️ Project Status

This is a legacy/deprecated project created for educational purposes. It has been superseded by [ProShop v2](https://github.com/bradtraversy/proshop-v2) which uses Redux Toolkit. This version is maintained as-is for reference.

---

## Tech Stack

TypeScript SDK + Zod

### Backend

- **Node.js** 14.6+ (ES Modules)
- **Express.js** 4.17.1 — REST API
- **Mongoose** 5.10.6 — MongoDB ODM
- **jsonwebtoken** 8.5.1 — JWT authentication
- **bcryptjs** 2.4.3 — Password hashing
- **dotenv** 8.2.0 — Environment variable loading
- **morgan** 1.10.0 — HTTP logging
- **multer** 1.4.2 — File uploads
- **express-async-handler** 1.1.4 — Async error handling
- **concurrently** 5.3.0 — Run frontend + backend concurrently (dev)
- **nodemon** 2.0.4 — Auto-restart on code changes (dev)

### Frontend

- **React** 16.13.1 — UI framework
- **Redux** 4.0.5 + **redux-thunk** 2.3.0 — State management
- **React Router** 5.2.0 — Client-side routing
- **Axios** 0.20.0 — HTTP client
- **react-bootstrap** 1.3.0 — Bootstrap components
- **react-paypal-button-v2** 2.6.2 — PayPal integration
- **react-scripts** 3.4.3 — CRA build tooling

---

## Project Structure

```
proshop_mern/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection setup
│   ├── controllers/
│   │   ├── productControllers.js
│   │   ├── userControllers.js
│   │   └── orderControllers.js    # Request handlers
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification
│   │   └── errorMiddleware.js     # Error formatting
│   ├── models/
│   │   ├── productModel.js
│   │   ├── userModel.js
│   │   └── orderModel.js          # Mongoose schemas
│   ├── routes/
│   │   ├── productRoutes.js
│   │   ├── userRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── uploadRoutes.js        # API endpoint definitions
│   │   └── featureFlagRoutes.js   # GET /api/feature-flags (reads features.json live)
│   ├── data/
│   │   ├── products.js
│   │   └── users.js               # Sample data for seeding
│   ├── utils/
│   │   └── generateToken.js       # JWT creation
│   ├── server.js                  # Express app initialization
│   ├── seeder.js                  # Database seeding script
│   ├── CLAUDE.md                  # Backend code guidelines
│   └── package.json
│
├── frontend/
│   ├── public/                    # Static files (favicon, index.html)
│   ├── src/
│   │   ├── actions/               # Redux action creators (async thunks)
│   │   ├── reducers/              # Redux state reducers
│   │   ├── components/            # Reusable UI components (Header, Footer, Rating, etc.)
│   │   ├── screens/               # Full-page components (*Screen.js)
│   │   ├── constants/             # Redux action type constants
│   │   ├── App.js                 # Router and main layout
│   │   ├── store.js               # Redux store initialization
│   │   ├── index.js               # React entry point
│   │   └── index.css
│   ├── CLAUDE.md                  # Frontend code guidelines
│   ├── package.json               # Frontend dependencies (includes proxy to backend)
│   └── .env.local                 # Frontend-specific env vars (optional)
│
├── uploads/                       # User-uploaded product images (Multer output)
├── features.json                  # Feature flag definitions — read live by /api/feature-flags
├── .env                           # Backend environment variables (root)
├── package.json                   # Root scripts (dev, data:import, data:destroy)
├── CLAUDE.md                      # Project-wide guidance
└── Procfile                       # Heroku deployment config
```

---

## Prerequisites

### System Requirements

- **Node.js** 14.6 or higher
  - Check version: `node --version`
  - **On Node 17+**: The frontend requires `NODE_OPTIONS=--openssl-legacy-provider` (already set in `frontend/package.json`, but needed if running `react-scripts` directly)

- **MongoDB** (any version)
  - **Option 1 (Local)**: Install from [mongodb.com/try/download](https://www.mongodb.com/try/download/community) or via Homebrew:
    ```bash
    brew install mongodb-community
    brew services start mongodb-community
    ```
  - **Option 2 (Docker)**: If Docker is installed:
    ```bash
    docker run -d -p 27017:27017 --name mongo mongo:7
    ```
  - **Option 3 (MongoDB Atlas)**: Use a free cloud database at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) — get a connection URI and use it in `.env`

### Verify MongoDB is Running

```bash
mongosh  # or 'mongo' for older MongoDB
# Should connect without error. Type 'exit' to quit.
```

- check it in Docker mongo in Exec tab

---

## Installation

### 1. Clone and Install Root Dependencies

```bash
git clone https://github.com/bradtraversy/proshop_mern.git
cd proshop_mern
npm install
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Create `.env` File in Project Root

Create a file named `.env` in the root directory (same level as `package.json`) with the following variables:

```
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/proshop
JWT_SECRET=your_secret_key_here_can_be_any_string
PAYPAL_CLIENT_ID=sandbox
```

#### Environment Variable Reference

| Variable           | Required | Default | Notes                                                                                                                        |
| ------------------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`         | Yes      | —       | Set to `development` for dev (enables morgan logging); `production` for prod                                                 |
| `PORT`             | No       | `5000`  | **Important**: Use `5001` on macOS (port 5000 is held by Control Center). Frontend proxy is set to `5001`                    |
| `MONGO_URI`        | Yes      | —       | `mongodb://localhost:27017/proshop` for local; or MongoDB Atlas URI                                                          |
| `JWT_SECRET`       | Yes      | —       | Any long random string; changes invalidate all sessions                                                                      |
| `PAYPAL_CLIENT_ID` | Yes      | —       | Use `sandbox` for development; get a real client ID from [developer.paypal.com](https://developer.paypal.com) for production |

### 4. Seed the Database (Optional)

Load sample products and users:

```bash
npm run data:import
```

**Sample Login Credentials** (after seeding):

- **Admin**: `admin@example.com` / `123456`
- **Customer**: `john@example.com` / `123456`
- **Customer**: `jane@example.com` / `123456`

To wipe all data:

```bash
npm run data:destroy
```

---

## Running the Application

### Development Mode (Frontend + Backend Running Together)

```bash
npm run dev
```

This starts:

- **Backend**: `http://localhost:5001` (Express API)
- **Frontend**: `http://localhost:3000` (React dev server)

The frontend proxy (in `frontend/package.json`) automatically routes `/api/*` calls to the backend.

### Backend Only

```bash
npm run server
```

Runs on `http://localhost:5001`. Useful for testing API endpoints with Postman or curl.

### Frontend Only

```bash
npm run client
```

Runs on `http://localhost:3000`. Make sure the backend is running separately on port 5001.

---

## Feature Flags

Feature flags are defined in [`features.json`](./features.json) at the project root. The backend reads this file on **every request** (no caching), so changes made by the MCP Feature Flags server are immediately visible without restarting the backend.

### Admin Dashboard (UI)

After seeding the database and starting the app, log in as admin and navigate to:

```
http://localhost:3000/admin/features
```

Or use the **Admin → Feature Flags** link in the top navigation bar.

**Admin credentials** (requires `npm run data:import` first):
- Email: `admin@example.com`
- Password: `123456`

The dashboard shows all 25 feature flags in a table: name, status, traffic %, last modified, dependencies, and description. Data is fetched live from `GET /api/feature-flags` on every page load.

### API Endpoints

| Method | Endpoint                   | Access        | Description                       |
| ------ | -------------------------- | ------------- | --------------------------------- |
| GET    | `/api/feature-flags`       | Private/Admin | Returns all feature flags as JSON |
| GET    | `/api/feature-flags/:name` | Private/Admin | Returns a single flag by key name |

Both endpoints require a valid JWT token with `isAdmin: true`. Pass the token in the `Authorization: Bearer <token>` header.

### Verify via curl (authenticated)

```bash
# 1. Log in to get a token
TOKEN=$(curl -s -X POST http://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Fetch all flags
curl http://localhost:5001/api/feature-flags -H "Authorization: Bearer $TOKEN"

# 3. Fetch a single flag
curl http://localhost:5001/api/feature-flags/dark_mode -H "Authorization: Bearer $TOKEN"
```

### Updating Flags via MCP Server

Start the MCP Feature Flags server in a separate terminal:

```bash
cd mcp-feature-flags
npm run dev
```

Any changes applied through the MCP server write back to `features.json`. The next request to `/api/feature-flags` will reflect the updated state automatically.

---

## Building for Production

### Create a Frontend Production Build

```bash
cd frontend
npm run build
```

Creates an optimized bundle in `frontend/build/`. The backend will serve this on startup if `NODE_ENV=production`.

### Test Production Build Locally

```bash
npm run build --prefix frontend
npm start
```

Then open `http://localhost:5001`. The backend serves the frontend build from `/` and the API from `/api/`.

---

## Troubleshooting

### MongoDB Connection Fails Immediately

**Error**: `Error: ECONNREFUSED` or `MongoDB connection error`

**Solution**:

- Verify MongoDB is running: `mongosh` (or `mongo`)
- Check `MONGO_URI` in `.env` is correct
- If using MongoDB Atlas, ensure your IP is whitelisted in Atlas network settings
- The app has no retry logic — it exits immediately if it can't connect

### Frontend Shows "Network Error" / `ECONNREFUSED` on API Calls

**Error**: All `/api/` requests fail immediately

**Likely causes**:

1. **Backend not running** — run `npm run server` in a separate terminal
2. **Port mismatch** — verify `.env` has `PORT=5001` and `frontend/package.json` has `"proxy": "http://127.0.0.1:5001"`
3. **Proxy not picked up** — restart the dev server: stop and re-run `npm run dev`

### Port 5001 Already in Use

**Error**: `Error: listen EADDRINUSE :::5001`

**Solution**:

- Find what's using the port: `lsof -i :5001` (macOS/Linux)
- Kill the process: `kill -9 <PID>`
- Or change `PORT` in `.env` to something else (e.g., `5002`) and update `frontend/package.json` proxy to match

### Port 5000 Always Fails on macOS

**Issue**: Port 5000 is permanently held by macOS Control Center

**Solution**: Use `PORT=5001` in `.env` (already recommended above)

### React App Won't Start / "react-scripts: command not found"

**Error**: `react-scripts not found` when running `npm run dev`

**Solution**:

```bash
cd frontend
npm install
cd ..
npm run dev
```

### OpenSSL Error on Node 17+ (Frontend Build Fails)

**Error**: `error:0308010C:digital envelope routines::unsupported`

**Solution**: This is already handled in `frontend/package.json` with `NODE_OPTIONS=--openssl-legacy-provider` in the `start` and `build` scripts. If still failing:

- Restart the dev server
- Clear node_modules and reinstall: `cd frontend && rm -rf node_modules && npm install`

### PayPal Sandbox Button Not Working

**Error**: "PayPal button does not appear" or "Invalid client ID"

**Cause**: `PAYPAL_CLIENT_ID` is not set or is set to `sandbox` (a placeholder)

**Solution**:

1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Log in with your PayPal account (or create one)
3. Create a Sandbox business account
4. Get your **Sandbox Client ID**
5. Set `PAYPAL_CLIENT_ID=<your_sandbox_client_id>` in `.env`
6. Restart the backend: stop and run `npm run server`

For production, use a real client ID.

### Uploaded Product Images Not Showing

**Issue**: Image upload succeeds, but images don't display on the site

**Causes & Solutions**:

- Check that `uploads/` folder exists (created automatically on first upload)
- Verify backend is serving `/uploads/` static route: `http://localhost:5001/uploads/<filename>` should return the file
- On production with ephemeral storage (Heroku, Docker, AWS Lambda), uploaded files are lost on restart — replace Multer with cloud storage (S3, Cloudinary)

### "Not authorized, token failed" Error After Logout

**Issue**: Logged-in user suddenly sees "Not authorized, token failed" and is logged out

**Normal behavior**: JWT token expires after 30 days, or was manually cleared from localStorage. To stay logged in indefinitely:

- Edit `backend/utils/generateToken.js` and increase the `expiresIn` value (currently `'30d'`)
- Or implement token refresh logic (not included in this version)

---

## Common Commands Reference

```bash
# Development
npm run dev              # Start frontend + backend concurrently
npm run server           # Start backend only
npm run client           # Start frontend only

# Database
npm run data:import      # Seed database with sample data
npm run data:destroy     # Wipe all database data

# Production
npm run build --prefix frontend   # Build frontend for production
npm start                         # Start backend in production mode (serves frontend)
```

---

## Key Implementation Notes

- **No CORS middleware**: In development, the frontend proxy handles cross-origin requests. In production, both frontend and backend run on the same origin.
- **JWT in localStorage**: The token is stored in browser localStorage (XSS-readable). For higher security, use httpOnly cookies (requires backend changes).
- **File uploads to disk**: Multer saves files to the `uploads/` folder. In production with ephemeral filesystems, use cloud storage.
- **ES Modules**: All backend imports require `.js` file extension (e.g., `import connectDB from './config/db.js'`)

---

## Redesigned Pages (HW4)

All 16 screens have been redesigned with a custom WCAG 2.1 AA design system (`ps-` namespace), replacing Bootstrap components with native HTML + CSS.

| #   | Page                         | Route                               | File                        | Видимость |    Сделал?     |
| --- | ---------------------------- | ----------------------------------- | --------------------------- | --------- | :------------: |
| 1   | Home / Search results        | `/`, `/search/:keyword`, `/page/:n` | `HomeScreen.js`             | public    |       ✅       |
| 2   | Product details              | `/product/:id`                      | `ProductScreen.js`          | public    |       ✅       |
| 3   | Cart                         | `/cart/:id?`                        | `CartScreen.js`             | public    |       ✅       |
| 4   | Login                        | `/login`                            | `LoginScreen.js`            | public    |       ✅       |
| 5   | Register                     | `/register`                         | `RegisterScreen.js`         | public    |       ✅       |
| 6   | Profile                      | `/profile`                          | `ProfileScreen.js`          | auth      |       ✅       |
| 7   | Shipping                     | `/shipping`                         | `ShippingScreen.js`         | auth      |       ✅       |
| 8   | Payment                      | `/payment`                          | `PaymentScreen.js`          | auth      |       ✅       |
| 9   | Place Order                  | `/placeorder`                       | `PlaceOrderScreen.js`       | auth      |       ✅       |
| 10  | Order details                | `/order/:id`                        | `OrderScreen.js`            | auth      |       ✅       |
| 11  | Admin: Users list            | `/admin/userlist`                   | `UserListScreen.js`         | admin     |       ✅       |
| 12  | Admin: User edit             | `/admin/user/:id/edit`              | `UserEditScreen.js`         | admin     |       ✅       |
| 13  | Admin: Products list         | `/admin/productlist`                | `ProductListScreen.js`      | admin     |       ✅       |
| 14  | Admin: Product edit          | `/admin/product/:id/edit`           | `ProductEditScreen.js`      | admin     |       ✅       |
| 15  | Admin: Orders list           | `/admin/orderlist`                  | `OrderListScreen.js`        | admin     |       ✅       |
| 16  | **Admin: Feature Dashboard** | `/admin/featuredashboard`           | `FeatureDashboardScreen.js` | admin     | ✅ обязательно |

Before/after screenshots for all pages: `tmp/screenshots/`.

---

## Additional Resources

- Backend code guidelines: See [backend/CLAUDE.md](backend/CLAUDE.md)
- Frontend code guidelines: See [frontend/CLAUDE.md](frontend/CLAUDE.md)
- Project guidelines: See [CLAUDE.md](CLAUDE.md)

---

## License

MIT License © 2020 Traversy Media

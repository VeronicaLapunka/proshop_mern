# Backend CLAUDE.md

Backend-specific architecture, code review rules, and deployment guidance.

## Architecture

The backend follows a traditional MVC pattern:

- **`server.js`**: Express app initialization, route mounting, middleware setup
- **`config/db.js`**: MongoDB connection setup
- **`models/`**: Mongoose schemas (Product, User, Order)
- **`routes/`**: API endpoint definitions for products, users, orders, uploads
- **`controllers/`**: Request handlers for each route group
- **`middleware/`**: Error handling and authentication logic
- **`data/`**: Sample data for seeding the database
- **`seeder.js`**: Database initialization script

**Key architectural notes:**

- Uses ES Modules (`"type": "module"` in root `package.json`) — all local imports require `.js` extension
- Error handling via custom middleware (`notFound`, `errorHandler`) that standardizes responses
- Authentication uses JWT tokens in `Authorization: Bearer <token>` headers
- Async route handlers wrapped with `express-async-handler` for error catching

## Code Review Rules

- **Wrap every async controller with `asyncHandler`** — bare `async` functions do not forward thrown errors to Express error middleware.
- **Call `res.status(NNN)` before `throw new Error(...)`** — the error handler reads `res.statusCode`; if it is still 200 at that point, it defaults to 500.
- **Always chain `admin` after `protect`** — `admin` middleware depends on `req.user` being set by `protect`. Never apply `admin` without `protect` preceding it on the same route.
- **Register static routes before parametric routes** — in Express, `router.get('/top', ...)` must come before `router.route('/:id')`, otherwise `/top` is treated as an id. (Known existing bug: `productRoutes.js` has this reversed for `/top`.)
- **All local ES Module imports require `.js` extension** — omitting it causes `ERR_MODULE_NOT_FOUND` at runtime with no helpful message.
- **Do not rename the error string `'Not authorized, token failed'`** — the frontend auto-logout in every action's `catch` block matches this exact string. Changing it silently breaks the logout flow.
- **Do not upgrade Mongoose past v5 without removing `useCreateIndex`** — `useCreateIndex: true` was dropped in Mongoose 6 and causes a startup crash.

## Deployment

### Heroku (primary target)

- `heroku-postbuild` in root `package.json` handles the frontend build automatically:
  ```
  NPM_CONFIG_PRODUCTION=false npm install --prefix frontend && npm run build --prefix frontend
  ```
  `NPM_CONFIG_PRODUCTION=false` is required so Heroku installs devDependencies (including `react-scripts`) before building.
- `Procfile` starts the app with `node backend/server.js`. Heroku injects `PORT` at runtime; the app uses `process.env.PORT || 5001`.

### Other platforms (Render, Railway, Fly.io, etc.)

- Set **build command** to:
  ```
  NPM_CONFIG_PRODUCTION=false npm install --prefix frontend && npm run build --prefix frontend
  ```
  and **start command** to `node backend/server.js`.
- Set all five env vars: `NODE_ENV`, `PORT`, `MONGO_URI`, `JWT_SECRET`, `PAYPAL_CLIENT_ID`.

### Platform-agnostic gotchas

- **`frontend/build/` is not committed** — must be produced by the build step. If missing, the production catch-all `res.sendFile(...)` will 404 every route.
- **`uploads/` is ephemeral** — Multer saves images to `uploads/` on disk. On platforms with ephemeral filesystems (Heroku dynos, most containers) uploaded files are lost on restart. For production, replace Multer with cloud storage (S3, Cloudinary).
- **No CORS middleware is installed** — the CRA dev proxy handles cross-origin during development; in production the Express server serves the React build from the same origin. If frontend and backend are ever on separate domains, add the `cors` package.

## Design rules: see ./DESIGN.md

## Design rules screens except FeatureDashboardScreen: see ./DESIGN_ACCESSIBILITY.md

## Anti-slop rules: see ./ANTI_SLOP.md

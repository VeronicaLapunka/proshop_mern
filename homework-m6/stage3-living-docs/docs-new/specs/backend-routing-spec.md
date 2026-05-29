# Backend Express Routing Specification

**Module:** Backend Express Routing + Middleware Orchestration
**File:** `backend/server.js`, `backend/routes/*`, `backend/middleware/*`
**Language:** JavaScript (ES Modules)
**Key Dependency:** Express.js, Mongoose, JWT

## Architecture

The backend uses Express.js to register five route groups (products, users, orders, uploads, featureFlags) via middleware stacking in `server.js`. Each route file exports a router that defines multiple endpoints; controllers wrap async handlers with `express-async-handler` to catch thrown errors and forward them to the global error middleware.

The middleware chain follows a strict order:
1. morgan logging (dev only)
2. express.json() for body parsing
3. static file serving (/uploads)
4. route handlers (5 groups)
5. error middleware (global catch)

**Critical pattern:** Any error thrown in a controller is caught by asyncHandler, which calls `next(error)`, triggering the `errorHandler` middleware at the end. The errorHandler reads `res.statusCode` (set by the controller before throwing) and returns a JSON response.

## Authentication

Two chained middleware functions:
- **protect:** Extracts JWT from `Authorization: Bearer <token>` header, verifies with `jwt.verify()`, queries User document, sets `req.user`
- **admin:** Must always follow `protect` (depends on `req.user`). Checks `req.user.isAdmin === true`

**Usage pattern:** `router.delete('/:id', protect, admin, deleteProduct)`

## Routes

| Route Group | File | Endpoints | Base Path |
|-------------|------|-----------|-----------|
| Products | productRoutes.js | ~7 | /api/products |
| Users | userRoutes.js | ~5 | /api/users |
| Orders | orderRoutes.js | ~5 | /api/orders |
| Uploads | uploadRoutes.js | ~1 | /api/upload |
| FeatureFlags | featureFlagRoutes.js | ~4 | /api/featureFlag |

## Known Bugs

- **`/api/products/top` CastError** — Static route `/top` registered AFTER parametric `/:id` in `productRoutes.js`. Express treats `"top"` as an id parameter. **Fix:** Move `/top` route before `/:id` route.

## Integration Points

- **Models:** productModel, userModel, orderModel (Mongoose schemas)
- **Controllers:** productController, userController, orderController (async handlers)
- **Middleware:** authMiddleware (protect, admin), errorMiddleware (global error handler)

## File References

- `backend/server.js` — Express app initialization, route mounting
- `backend/routes/productRoutes.js` — Product endpoints
- `backend/routes/userRoutes.js` — User endpoints
- `backend/routes/orderRoutes.js` — Order endpoints
- `backend/routes/uploadRoutes.js` — Upload endpoints
- `backend/routes/featureFlagRoutes.js` — Feature flag endpoints
- `backend/middleware/authMiddleware.js` — JWT auth logic
- `backend/middleware/errorMiddleware.js` — Global error handler

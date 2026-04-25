# Project Report

## Primary IDE: Claude Code

### How It Was Used in This Project

- **Setup**: forked the repo, cloned locally, created `.env`, installed dependencies
- **Environment fixes**: identified macOS port 5000 conflict, switched backend to 5001, updated frontend proxy
- **Compatibility fix**: added `NODE_OPTIONS=--openssl-legacy-provider` to `frontend/package.json` scripts for Node 17+ / webpack 4 incompatibility
- **Database**: started MongoDB via Docker (`mongo:7`), seeded sample data with `npm run data:import`
- **Documentation**: split monolithic `CLAUDE.md` into three scoped files (`/`, `backend/`, `frontend/`) to stay within 150-line limit per file

### CLAUDE.md Structure

Claude Code loads `CLAUDE.md` files automatically — from the project root and from any subdirectory being worked in:

```
CLAUDE.md              # project overview, commands, env, gotchas
backend/CLAUDE.md      # backend architecture, code review rules, deployment
frontend/CLAUDE.md     # frontend architecture, Redux patterns, code review rules
```

## Rules diff

Added to root `CLAUDE.md` to codify patterns and pitfalls:

- **Code Review Rules** (Backend + Frontend subsections): checklist for asyncHandler wrapping, error status codes, middleware chaining (`admin` after `protect`), route ordering, ES Module `.js` extensions, Redux token extraction, state shape conventions, and avoiding string-matching fragility in auto-logout.
- **Deployment Quirks**: Heroku-specific (heroku-postbuild script, NPM_CONFIG_PRODUCTION flag), other platforms (manual build command), and platform-agnostic (ephemeral `frontend/build/` and `uploads/`, no CORS middleware, Node 17+ OpenSSL flag, missing `.env.example`).
- **Local Gotchas**: Port/proxy mismatch (5001 ≠ 5000), MongoDB startup requirement, three known bugs (products/top CastError, paymentMethod not rehydrated, orderDetails spinner), localStorage XSS risk, and security notes.
- **Post-execution meta-directive**: Claude Code now explains what each command actually did, what it means, side effects, and next steps (e.g., after seeding or dev startup).
- **Port documentation fix**: Corrected Project Overview and Development commands from "port 5000" to "port 5001 by default" to match actual `.env`.

## Checking Frontend -> Backend Communication

- Checked in Newtwork API requests and response during going through the site:
  http://localhost:3000/api/products?keyword=&pageNumber=1
  http://localhost:3000/api/products/top
  http://localhost:3000/api/products?keyword=Phone&pageNumber=1
  http://localhost:3000/api/products/69ec655930dae26bb69e196c

- Checked Backend console logs:
  started in terminal 'npm run dev'
  see backend logs in terminal and in network tab:
  GET /api/products/69ec655930dae26bb69e196c 304 51.138 ms - -
  [0] GET /api/products/top 304 8.970 ms - -
  [0] GET /api/products?keyword=&pageNumber=1 304 15.842 ms - -
  [0] GET /api/products?keyword=Phone&pageNumber=1 304 5.203 ms

- Checked MongoDB has data
  In Docker container-> Exec tab-> mongosh->
  use proshop
  db.products.find() - See ALL products (like SELECT \* FROM products)
  db.products.find().limit(2) - See first 2 products only
  db.products.find({ name: { $regex: "Camera", $options: "i" } }) - Search for products with "Camera" in name
  db.products.countDocuments() - Count total products
  db.users.find() - See all users
  db.orders.find() - See all orders

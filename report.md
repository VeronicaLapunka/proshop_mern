# M2 - Report

## IDE:

- Primary: Claude Code -> /proshop_mern/CLAUDE.md

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

Ran locally using Docker mongo and 'npm run dev'

## NH-1 Mermaid-diagramm

- Done

## NH-2 ADPx3

- Done

## NH-3 Characterization tests for 1 function

I picked 'payOrder'
Tests were generated: /Users/Veronica_Lapunka/Documents/git3/proshop_mern/frontend/src/actions/**tests**/payOrder.test.js
Command for run tests:
cd frontend && npm test -- src/actions/**tests**/payOrder.test.js --watchAll=false

## 3 questions

- ~5 hours
- I used promt for diagramm generation
- AI generated tests, but some of them failed. Later AI fixed them (e.g. The issue is that redux-mock-store doesn't propagate async errors the same way. Let me fix the tests to characterize the actual behavior)

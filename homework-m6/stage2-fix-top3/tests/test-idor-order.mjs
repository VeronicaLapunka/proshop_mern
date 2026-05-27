/**
 * Characterization tests — Finding #2: IDOR on GET /api/orders/:id
 * File: backend/controllers/orderController.js:43
 *
 * PURPOSE: Pin down CURRENT behavior — getOrderById has no ownership check.
 * Any authenticated user can read ANY order by guessing its ObjectId.
 *
 * Strategy: start a minimal Express app on a test port with real MongoDB,
 * mint JWT tokens directly (no round-trip login needed), create fixtures,
 * then assert HTTP behavior.
 *
 * Run: node --test homework-m6/stage2-fix-top3/tests/test-idor-order.mjs
 */

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ── project imports (ES modules, must use .js extension) ─────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

// Load env before importing controllers (they rely on process.env.JWT_SECRET)
const dotenv = await import("dotenv");
dotenv.config({ path: path.join(REPO_ROOT, ".env") });

const { default: orderRouter } = await import(
  path.join(REPO_ROOT, "backend/routes/orderRoutes.js")
);
const { notFound, errorHandler } = await import(
  path.join(REPO_ROOT, "backend/middleware/errorMiddleware.js")
);
const { default: User } = await import(
  path.join(REPO_ROOT, "backend/models/userModel.js")
);
const { default: Order } = await import(
  path.join(REPO_ROOT, "backend/models/orderModel.js")
);

const TEST_PORT = 15001;
const TEST_DB = "proshop_chartest_idor";
const MONGO_URI = `mongodb://localhost:27017/${TEST_DB}`;
const JWT_SECRET = process.env.JWT_SECRET || "abc123";

// ── helpers ──────────────────────────────────────────────────────────────────

function mintToken(userId, isAdmin = false) {
  return jwt.sign({ id: userId, isAdmin }, JWT_SECRET, { expiresIn: "1h" });
}

async function apiReq(path, token) {
  const url = `http://localhost:${TEST_PORT}${path}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

// ── fixtures ─────────────────────────────────────────────────────────────────

let server;
let user1, user2, adminUser;
let tokenUser1, tokenUser2, tokenAdmin;
let order1Id; // order owned by user1

before(async () => {
  // Connect to isolated test DB
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Clean slate
  await User.deleteMany({ email: /chartest/ });
  await Order.deleteMany({ "shippingAddress.postalCode": "CHARTEST" });

  // Create users directly in DB (bypass password hashing for speed)
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.default.hash("password123", 10);

  user1 = await User.create({ name: "Char User1", email: "chartest1@example.com", password: hash, isAdmin: false });
  user2 = await User.create({ name: "Char User2", email: "chartest2@example.com", password: hash, isAdmin: false });
  adminUser = await User.create({ name: "Char Admin", email: "chartestadmin@example.com", password: hash, isAdmin: true });

  tokenUser1 = mintToken(user1._id, false);
  tokenUser2 = mintToken(user2._id, false);
  tokenAdmin = mintToken(adminUser._id, true);

  // Create an order owned by user1
  const o = await Order.create({
    user: user1._id,
    orderItems: [{ name: "Test Widget", qty: 1, image: "/img/test.jpg", price: 9.99, product: new mongoose.Types.ObjectId() }],
    shippingAddress: { address: "1 Test St", city: "Testville", postalCode: "CHARTEST", country: "US" },
    paymentMethod: "PayPal",
    itemsPrice: 9.99,
    taxPrice: 1.00,
    shippingPrice: 0,
    totalPrice: 10.99,
  });
  order1Id = o._id.toString();

  // Start minimal Express app
  const app = express();
  app.use(express.json());
  app.use("/api/orders", orderRouter);
  app.use(notFound);
  app.use(errorHandler);

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, resolve);
  });
});

after(async () => {
  server?.close();
  await User.deleteMany({ email: /chartest/ });
  await Order.deleteMany({ "shippingAddress.postalCode": "CHARTEST" });
  await mongoose.disconnect();
});

// ── test suite ────────────────────────────────────────────────────────────────

describe("Finding #2 — IDOR on GET /api/orders/:id (characterization)", () => {

  // ── HAPPY PATH ──────────────────────────────────────────────────────────────

  test("CURRENT: order owner can read their own order → 200", async () => {
    const { status, json } = await apiReq(`/api/orders/${order1Id}`, tokenUser1);
    assert.equal(status, 200);
    assert.equal(json._id, order1Id);
    assert.equal(json.totalPrice, 10.99);
  });

  test("CURRENT: admin can read any order → 200", async () => {
    const { status, json } = await apiReq(`/api/orders/${order1Id}`, tokenAdmin);
    assert.equal(status, 200);
    assert.equal(json._id, order1Id);
  });

  // ── VULNERABILITY (IDOR) — CURRENT behavior to pin ──────────────────────────

  test("FIXED: different authenticated user is now rejected → 401 (IDOR closed)", async () => {
    // BEFORE fix: returned 200 — any authenticated user could read any order.
    // AFTER fix: ownership check added → non-owner, non-admin gets 401.
    const { status, json } = await apiReq(`/api/orders/${order1Id}`, tokenUser2);
    assert.equal(status, 401, "Non-owner must be rejected with 401");
    assert.ok(json.message, "Error response must have message field");
    assert.match(json.message, /not authorized/i);
  });

  // ── ERROR PATHS (preserved across fix) ──────────────────────────────────────

  test("CURRENT: unauthenticated request → 401", async () => {
    const { status, json } = await apiReq(`/api/orders/${order1Id}`, null);
    assert.equal(status, 401);
    assert.ok(json.message, "Error response must have message field");
  });

  test("CURRENT: non-existent order id → 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const { status } = await apiReq(`/api/orders/${fakeId}`, tokenUser1);
    assert.equal(status, 404);
  });

  test("CURRENT: malformed ObjectId → 500 (Mongoose CastError becomes unhandled)", async () => {
    const { status } = await apiReq("/api/orders/not-a-valid-id", tokenUser1);
    // Mongoose throws CastError → asyncHandler catches → errorHandler returns 500
    assert.equal(status, 500);
  });

  // ── EDGE CASES ───────────────────────────────────────────────────────────────

  test("CURRENT: response includes populated user name+email (not just ObjectId)", async () => {
    // getOrderById does .populate('user', 'name email')
    const { status, json } = await apiReq(`/api/orders/${order1Id}`, tokenUser1);
    assert.equal(status, 200);
    assert.equal(typeof json.user, "object", "user field should be populated object");
    assert.ok(json.user.name, "populated user should have name");
    assert.ok(json.user.email, "populated user should have email");
    assert.equal(json.user.password, undefined, "password must NOT appear in response");
  });

  test("CURRENT: order not found returns error message string", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const { json } = await apiReq(`/api/orders/${fakeId}`, tokenUser1);
    assert.ok(json.message, "404 response must have message field");
    assert.match(json.message, /order not found/i);
  });
});

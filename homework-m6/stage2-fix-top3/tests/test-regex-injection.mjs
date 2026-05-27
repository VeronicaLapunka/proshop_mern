/**
 * Characterization tests — Finding #3: $regex injection + full collection scan
 * File: backend/controllers/productController.js:14
 *
 * PURPOSE: Pin down CURRENT behavior before fixing.
 * - keyword is passed directly to MongoDB $regex with no escaping
 * - regex metacharacters (.  *  +  ?  ^  $  {  }  [  ]  |  \  ()  ) are treated as regex
 * - no length limit on the keyword parameter
 * - two full collection scans per request (countDocuments + find)
 *
 * Run: node --test homework-m6/stage2-fix-top3/tests/test-regex-injection.mjs
 */

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const dotenv = await import("dotenv");
dotenv.config({ path: path.join(REPO_ROOT, ".env") });

const { default: productRouter } = await import(
  path.join(REPO_ROOT, "backend/routes/productRoutes.js")
);
const { notFound, errorHandler } = await import(
  path.join(REPO_ROOT, "backend/middleware/errorMiddleware.js")
);
const { default: Product } = await import(
  path.join(REPO_ROOT, "backend/models/productModel.js")
);
const { default: User } = await import(
  path.join(REPO_ROOT, "backend/models/userModel.js")
);

const TEST_PORT = 15002;
const TEST_DB = "proshop_chartest_regex";
const MONGO_URI = `mongodb://localhost:27017/${TEST_DB}`;

// ── helpers ──────────────────────────────────────────────────────────────────

async function apiGet(path) {
  const res = await fetch(`http://localhost:${TEST_PORT}${path}`);
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

// ── fixtures ─────────────────────────────────────────────────────────────────

let server;
let adminUser;

const SAMPLE_PRODUCTS = [
  { name: "Airpods Wireless Bluetooth Headphones", price: 89.99, brand: "Apple" },
  { name: "iPhone 11 Pro 256GB Memory", price: 599.99, brand: "Apple" },
  { name: "Cannon EOS 80D DSLR Camera", price: 929.99, brand: "Cannon" },
  { name: "Sony Playstation 4 Pro White Version", price: 399.99, brand: "Sony" },
  { name: "Logitech G-Series Gaming Mouse", price: 49.99, brand: "Logitech" },
];

before(async () => {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Clean slate
  await Product.deleteMany({ brand: { $in: ["Apple", "Cannon", "Sony", "Logitech"] } });
  await User.deleteMany({ email: "chartestprod@example.com" });

  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.default.hash("password123", 10);
  adminUser = await User.create({
    name: "Prod Test Admin",
    email: "chartestprod@example.com",
    password: hash,
    isAdmin: true,
  });

  // Insert test products
  for (const p of SAMPLE_PRODUCTS) {
    await Product.create({
      ...p,
      user: adminUser._id,
      image: "/images/test.jpg",
      category: "Electronics",
      countInStock: 10,
      numReviews: 0,
      rating: 0,
      description: "Test product",
    });
  }

  const app = express();
  app.use(express.json());
  app.use("/api/products", productRouter);
  app.use(notFound);
  app.use(errorHandler);

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, resolve);
  });
});

after(async () => {
  server?.close();
  await Product.deleteMany({ brand: { $in: ["Apple", "Cannon", "Sony", "Logitech"] } });
  await User.deleteMany({ email: "chartestprod@example.com" });
  await mongoose.disconnect();
});

// ── test suite ────────────────────────────────────────────────────────────────

describe("Finding #3 — $regex injection in keyword search (characterization)", () => {

  // ── HAPPY PATH ──────────────────────────────────────────────────────────────

  test("CURRENT: no keyword returns all products with pagination metadata", async () => {
    const { status, json } = await apiGet("/api/products");
    assert.equal(status, 200);
    assert.ok(Array.isArray(json.products), "products must be an array");
    assert.ok(typeof json.page === "number", "page must be a number");
    assert.ok(typeof json.pages === "number", "pages must be a number");
    assert.ok(json.products.length >= 5, `Expected >= 5 products, got ${json.products.length}`);
  });

  test("CURRENT: normal keyword search returns matching products", async () => {
    const { status, json } = await apiGet("/api/products?keyword=iPhone");
    assert.equal(status, 200);
    assert.ok(json.products.length >= 1, "Should find iPhone product");
    assert.ok(
      json.products.every((p) => /iphone/i.test(p.name)),
      "All results must match keyword"
    );
  });

  test("CURRENT: keyword search is case-insensitive ($options: 'i')", async () => {
    const { status: s1, json: j1 } = await apiGet("/api/products?keyword=airpods");
    const { status: s2, json: j2 } = await apiGet("/api/products?keyword=AIRPODS");
    assert.equal(s1, 200);
    assert.equal(s2, 200);
    assert.equal(j1.products.length, j2.products.length, "Case should not matter");
    assert.ok(j1.products.length >= 1);
  });

  test("CURRENT: pageNumber param controls pagination", async () => {
    const { status, json } = await apiGet("/api/products?pageNumber=1");
    assert.equal(status, 200);
    assert.equal(json.page, 1);
  });

  test("CURRENT: response shape is { products, page, pages }", async () => {
    const { json } = await apiGet("/api/products");
    assert.ok("products" in json);
    assert.ok("page" in json);
    assert.ok("pages" in json);
    assert.equal(Object.keys(json).sort().join(","), "page,pages,products");
  });

  // ── VULNERABILITY: regex metacharacters treated as regex ──────────────────

  test("FIXED: '.*' keyword now treated as literal string → 0 matches (escaped to \\.\\*)", async () => {
    // BEFORE fix: '.*' acted as regex wildcard → matched all products.
    // AFTER fix: metacharacters escaped → searches for literal string '.*' → 0 results.
    const { status, json } = await apiGet("/api/products?keyword=.*");
    assert.equal(status, 200);
    assert.equal(json.products.length, 0,
      `'.*' must match 0 products after escaping (found ${json.products.length})`
    );
  });

  test("FIXED: '^A' treated as literal '^A' → 0 matches (not a regex anchor)", async () => {
    // BEFORE fix: '^A' acted as start-of-string anchor.
    // AFTER fix: '^' is escaped to '\\^' → searches for literal '^A' in name → 0 results.
    const { status, json } = await apiGet("/api/products?keyword=^A");
    assert.equal(status, 200);
    assert.equal(json.products.length, 0,
      `'^A' must match 0 products (literal search, not anchor) — found ${json.products.length}`
    );
  });

  test("FIXED: keyword truncated to 100 chars (length limit enforced)", async () => {
    // BEFORE fix: no length limit.
    // AFTER fix: keyword.slice(0, 100) — anything beyond 100 chars is silently truncated.
    // A 500-char keyword is trimmed to 100 chars before querying → still returns 200.
    const longKeyword = "a".repeat(500);
    const { status } = await apiGet(`/api/products?keyword=${encodeURIComponent(longKeyword)}`);
    assert.equal(status, 200, "Long keyword must be accepted (truncated, not rejected with 4xx)");
  });

  test("FIXED: '(iphone|airpods)' is now literal → 0 matches (parens and pipe escaped)", async () => {
    // BEFORE fix: OR regex alternation matched both iPhone and Airpods.
    // AFTER fix: '(', '|', ')' are all escaped → literal string search → 0 results.
    const { status, json } = await apiGet(
      `/api/products?keyword=${encodeURIComponent("(iphone|airpods)")}`
    );
    assert.equal(status, 200);
    assert.equal(json.products.length, 0,
      `Regex alternation must be treated as literal — found ${json.products.length}`
    );
  });

  // ── ERROR PATHS (preserved across fix) ──────────────────────────────────────

  test("CURRENT: empty keyword string treated as no keyword → returns all", async () => {
    const { status, json } = await apiGet("/api/products?keyword=");
    assert.equal(status, 200);
    // Empty string in JS is falsy → keyword block not activated → returns all
    assert.ok(json.products.length >= 5);
  });

  test("CURRENT: invalid pageNumber defaults to page 1", async () => {
    const { status, json } = await apiGet("/api/products?pageNumber=abc");
    assert.equal(status, 200);
    // Number('abc') = NaN → || 1 → defaults to page 1
    assert.equal(json.page, 1);
  });
});

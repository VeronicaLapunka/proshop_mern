/**
 * Characterization tests — Finding #1: Hardcoded API key fallback
 * File: mcp-feature-flags/src/server-http.ts:25
 *
 * PURPOSE: Pin down behavior before AND after the fix.
 * - Tests marked "PRESERVED:" pass on both old and fixed code.
 * - Tests marked "FIXED:" document the new secure behavior (fail on old code).
 * - Tests marked "VULNERABILITY:" documented the old bug (pass only on old code).
 *
 * Run: node --test homework-m6/stage2-fix-top3/tests/test-hardcoded-api-key.mjs
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const SERVER_ENTRY = path.join(REPO_ROOT, "mcp-feature-flags/src/server-http.ts");
const TSX_BIN = path.join(REPO_ROOT, "mcp-feature-flags/node_modules/.bin/tsx");

const TEST_PORT = 13001;
const TEST_KEY = "test-api-key-characterization-suite";
// The value that was hardcoded in the old code (now removed):
const OLD_HARDCODED_KEY = "rdg564gchdhd_dhdhd12gpoong";
const BASE_URL = `http://localhost:${TEST_PORT}`;

// ── helpers ──────────────────────────────────────────────────────────────────

function startServer(env = {}) {
  const proc = spawn(TSX_BIN, [SERVER_ENTRY], {
    cwd: REPO_ROOT,
    env: { ...process.env, MCP_HTTP_PORT: String(TEST_PORT), ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return proc;
}

async function waitForServer(url, key, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`${url}/health`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      return;
    } catch {
      await sleep(150);
    }
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

async function req(path, { key, headerType = "bearer" } = {}) {
  const headers = {};
  if (key !== undefined) {
    if (headerType === "bearer") headers["Authorization"] = `Bearer ${key}`;
    if (headerType === "x-api-key") headers["x-api-key"] = key;
  }
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const body = await res.text();
  let json;
  try { json = JSON.parse(body); } catch { json = null; }
  return { status: res.status, body, json };
}

// ── test suite (main server: started WITH valid MCP_API_KEY) ─────────────────

describe("Finding #1 — Hardcoded API key fallback (characterization)", () => {
  let serverProc;
  let startupStdout = "";

  // Start server WITH a valid MCP_API_KEY (required after the fix)
  before(async () => {
    serverProc = startServer({ MCP_API_KEY: TEST_KEY });
    serverProc.stdout.on("data", (d) => { startupStdout += d.toString(); });
    serverProc.stderr.on("data", () => {}); // swallow tsx noise
    await waitForServer(BASE_URL, TEST_KEY);
  });

  after(() => {
    serverProc?.kill("SIGTERM");
  });

  // ── HAPPY PATH (preserved across old and fixed code) ────────────────────────

  test("PRESERVED: env-var key grants access to /health → 200", async () => {
    const { status, json } = await req("/health", { key: TEST_KEY });
    assert.equal(status, 200);
    assert.deepEqual(json, { status: "ok", server: "feature-flags-mcp-http" });
  });

  test("PRESERVED: Bearer prefix stripped case-insensitively before comparison", async () => {
    const { status } = await req("/health", { key: TEST_KEY, headerType: "bearer" });
    assert.equal(status, 200);
  });

  test("PRESERVED: x-api-key header also accepted as auth", async () => {
    const { status } = await req("/health", { key: TEST_KEY, headerType: "x-api-key" });
    assert.equal(status, 200);
  });

  // ── ERROR PATHS (preserved) ──────────────────────────────────────────────────

  test("PRESERVED: wrong key → 401 with JSON error body {error: 'Unauthorized'}", async () => {
    const { status, json } = await req("/health", { key: "wrong-key" });
    assert.equal(status, 401);
    assert.deepEqual(json, { error: "Unauthorized" });
  });

  test("PRESERVED: empty Authorization header → 401", async () => {
    const { status, json } = await req("/health", { key: "" });
    assert.equal(status, 401);
    assert.deepEqual(json, { error: "Unauthorized" });
  });

  test("PRESERVED: missing Authorization header entirely → 401", async () => {
    const { status, json } = await req("/health");
    assert.equal(status, 401);
    assert.deepEqual(json, { error: "Unauthorized" });
  });

  // ── EDGE CASES (preserved) ───────────────────────────────────────────────────

  test("PRESERVED: /health is behind auth — auth check runs before URL routing", async () => {
    const { status } = await req("/health");
    assert.equal(status, 401);
  });

  test("PRESERVED: unknown route with valid key → 404 (auth passes, routing fails)", async () => {
    const { status } = await req("/unknown-path", { key: TEST_KEY });
    assert.equal(status, 404);
  });

  test("PRESERVED: whitespace around key silently absorbed (fetch RFC-trim + greedy \\s+)", async () => {
    // trailing space: fetch trims → exact match → 200
    const { status: s1 } = await req("/health", { key: TEST_KEY + " " });
    assert.equal(s1, 200);

    // leading space inside Bearer value: "Bearer  test-api-key..."
    // regex /^Bearer\s+/i greedily strips ALL whitespace → "test-api-key..." → 200
    const { status: s2 } = await req("/health", { key: " " + TEST_KEY });
    assert.equal(s2, 200);

    // completely different key still fails
    const { status: s3 } = await req("/health", { key: "not-the-key" });
    assert.equal(s3, 401);
  });

  // ── FIXED: old hardcoded key no longer works ─────────────────────────────────

  test("FIXED: old hardcoded key is rejected — only the env-var key is accepted", async () => {
    // Before fix: OLD_HARDCODED_KEY would grant access even without MCP_API_KEY set.
    // After fix: it is just a wrong token → 401.
    const { status } = await req("/health", { key: OLD_HARDCODED_KEY });
    assert.equal(status, 401);
  });

  // ── FIXED: startup log masks the key ────────────────────────────────────────

  test("FIXED: startup log shows masked key (first 4 chars + asterisks), not the full key", async () => {
    // Old behavior: console.log(`API key: ${API_KEY}`) → full key in stdout
    // New behavior: `${API_KEY.slice(0,4)}****` → only prefix visible
    const fullKeyInLog = startupStdout.includes(TEST_KEY);
    assert.equal(fullKeyInLog, false, "Full API key must NOT appear in startup log");

    // The first 4 chars of TEST_KEY should appear (as the visible prefix)
    const prefix = TEST_KEY.slice(0, 4);
    assert.ok(
      startupStdout.includes(prefix),
      `Startup log should contain key prefix '${prefix}'. Got: ${startupStdout}`
    );
  });
});

// ── Fail-fast behaviour (separate spawn, no MCP_API_KEY) ────────────────────

describe("FIXED: server refuses to start without MCP_API_KEY", () => {
  test("FIXED: process exits with non-zero code when MCP_API_KEY is unset", async () => {
    let stderr = "";
    const proc = spawn(TSX_BIN, [SERVER_ENTRY], {
      cwd: REPO_ROOT,
      env: { ...process.env, MCP_HTTP_PORT: "13002", MCP_API_KEY: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    let stdout = "";
    proc.stdout.on("data", (d) => { stdout += d.toString(); });

    const exitCode = await new Promise((resolve) => {
      proc.on("close", resolve);
      // Safety timeout — if server doesn't exit in 5s, kill it
      setTimeout(() => { proc.kill(); resolve(-1); }, 5000);
    });

    // After fix: exits non-zero immediately
    assert.notEqual(exitCode, 0, "Server should exit with non-zero code when MCP_API_KEY is missing");
    // FATAL message should appear in stdout (console.error goes to stderr, but tsx may mix streams)
    const combined = stdout + stderr;
    assert.ok(
      combined.includes("FATAL") || combined.includes("MCP_API_KEY"),
      `Expected FATAL message in output. Got stdout: '${stdout}' stderr: '${stderr}'`
    );
  });
});

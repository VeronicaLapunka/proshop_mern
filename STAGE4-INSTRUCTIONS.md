# Stage 4: Tests Agent — Implementation Instructions

**Goal**: Run the `test-writer-mate` agent on 2 services from your project, generate test suites, execute them, and document results.

**Duration**: 1–1.5 hours
**Deliverables**:
- Generated test files for 2 services
- Test execution screenshots showing pass/fail status
- Stage 4 summary document

---

## Quick Start Checklist

- [ ] **Step 1**: Read existing tests to understand project conventions
- [ ] **Step 2**: Select 2 services to test
- [ ] **Step 3**: Invoke the agent for Service #1
- [ ] **Step 4**: Invoke the agent for Service #2
- [ ] **Step 5**: Run tests and capture screenshots
- [ ] **Step 6**: Document results in `homework-m6/stage4-tests/`
- [ ] **Optional Bonus**: Run mutation testing (mutmut or stryker)

---

## Project Status: What's Already Done

✅ **Existing test infrastructure:**
- Jest configured with ES Modules support (Node 22 + `NODE_OPTIONS="--experimental-vm-modules"`)
- `jest.config.cjs` located in repo root with `ts-jest/presets/default-esm`
- Test directory: `backend/__tests__/services/`
- Example service tests: `backend/__tests__/services/exampleService.test.js` (52 tests, ALL PASSING)

✅ **Test-writer agent:**
- Agent definition: `.claude/agents/test-writer-mate.md`
- Ready to invoke for new services

⚠️ **Services available for testing:**
- **Backend services**: `backend/services/exampleService.js` (already tested)
- **Backend controllers**: `backend/controllers/productController.js`, `userController.js`, `orderController.js`
- **MCP servers**: `mcp-feature-flags/src/server.ts`, `mcp-docs-search/` (TypeScript)

---

## Step 1: Understand Project Test Conventions

The `exampleService.test.js` file demonstrates the project's testing patterns:

### Key Patterns to Match

1. **File location**: `backend/__tests__/services/<module>.test.js`
2. **Framework**: Jest with ESM support
3. **Test structure**:
   ```javascript
   describe('functionName', () => {
     describe('happy path', () => {
       it('test description', () => {
         // arrange
         const input = { ... }
         // act
         const result = function(input)
         // assert
         expect(result).toBe(expected)
       })
     })
   })
   ```

4. **Strong assertions** (NOT weak):
   - ✅ `expect(result).toBe(value)` — checks VALUE
   - ❌ `expect(result).toBeDefined()` — weak, checks aliveness only

5. **Test inventory per function**:
   - 1 happy path (typical valid input)
   - 2–3 edge cases (boundaries, empty, Unicode, null)
   - 1–2 error paths (validation failure, edge data)
   - 1 security test if relevant (injection, oversized payload)

---

## Step 2: Select 2 Services to Test

**Recommendation:** Choose 2 of these:

### Option A: Backend Controllers (Easy, familiar code)
- `backend/controllers/productController.js` — CRUD operations for products
- `backend/controllers/userController.js` — Auth, profile, user management
- `backend/controllers/orderController.js` — Order operations

**Why**: Controllers are testable if you extract the business logic into services first. But they often depend on MongoDB/JWT, so they're better for **integration tests** (slower, need test DB).

### Option B: MCP Services (Moderate, demonstrates agent on TypeScript)
- `mcp-feature-flags/src/server.ts` — Feature flag listing, state management
- `mcp-docs-search/` — Documentation search API

**Why**: MCP services are standalone, testable with mocking, and demonstrate agent capability on TypeScript.

### Option C: Extract a New Service from a Controller (Recommended)

Pick a controller (e.g., `productController.js`), identify business logic (filtering, validation, calculations), and extract it to a new service file (e.g., `backend/services/productService.js`). Then run the agent on that service.

**For this guide, we'll use Option A (fastest):**

**Service 1**: `backend/services/exampleService.js`
✅ **Already tested** (52 tests, all passing) — Use this as reference

**Service 2**: Extract and test a new service from `productController.js`

---

## Step 3: Invoke the Agent for Service #1

### If Testing `exampleService.js` (Already Done)

The tests already exist at `backend/__tests__/services/exampleService.test.js`. Run them to verify:

```bash
cd /Users/Veronica_Lapunka/Documents/git3/proshop_mern
NODE_OPTIONS="--experimental-vm-modules" npm test -- backend/__tests__/services/exampleService.test.js --no-coverage
```

**Expected output:**
```
 PASS  backend/__tests__/services/exampleService.test.js (0.432 s)
  calculateProductRating (12 tests)
  validateProductInput (20 tests)
  userAlreadyReviewed (20 tests)
  ✓ 52 passed (all strong assertions)
```

### If Testing a NEW Service (Recommended Approach)

**Example: Extract `productFilterAndValidate` service from `productController.js`**

1. **Read the controller** to identify testable logic:
   ```bash
   read /Users/Veronica_Lapunka/Documents/git3/proshop_mern/backend/controllers/productController.js
   ```

2. **Create a new service file** with extracted logic (e.g., `backend/services/productFilterService.js`)

3. **Invoke the agent**:
   ```
   /test-writer-mate
   Service to test: backend/services/productFilterService.js
   ```

4. The agent will:
   - Read the service file
   - Check existing test conventions from `exampleService.test.js`
   - Generate tests in `backend/__tests__/services/productFilterService.test.js`
   - Write tests following the project's Jest + ESM pattern

---

## Step 4: Invoke the Agent for Service #2

**Recommended**: Test an MCP service (TypeScript) to show cross-language capability.

### Invoke for MCP Feature Flags Service

```
/test-writer-mate
Service to test: mcp-feature-flags/src/server.ts
Context: Feature flag management server with tools for listing, querying, and setting flags
```

**What the agent will do:**
1. Read `mcp-feature-flags/src/server.ts` and handler functions
2. Review existing test pattern in `mcp-feature-flags/__tests__/server.test.ts` (59 tests, some refinement needed)
3. Generate or enhance test coverage for flag management functions
4. Output tests as `mcp-feature-flags/__tests__/server.test.ts` or new test file

---

## Step 5: Run Tests and Capture Screenshots

### For Backend Service Tests

```bash
# Full backend service tests
NODE_OPTIONS="--experimental-vm-modules" npm test -- backend/__tests__/services/ --no-coverage

# Just one service
NODE_OPTIONS="--experimental-vm-modules" npm test -- backend/__tests__/services/exampleService.test.js --no-coverage
```

### For MCP Service Tests

```bash
# MCP feature flags tests
NODE_OPTIONS="--experimental-vm-modules" npm test -- mcp-feature-flags/__tests__/server.test.ts --no-coverage

# MCP docs-search tests (if exists)
NODE_OPTIONS="--experimental-vm-modules" npm test -- mcp-docs-search/__tests__/ --no-coverage
```

### Capture Screenshots

After tests pass, take screenshots:

```bash
# Screenshot showing test results
# On macOS: Command + Shift + 4 to select area
# Or use: open -a Terminal and screencapture -i output.png
```

**Save screenshots to**:
- `homework-m6/stage4-tests/backend-service-tests.png` (service 1)
- `homework-m6/stage4-tests/mcp-service-tests.png` (service 2)

---

## Step 6: Document Results

Create a summary document at `homework-m6/stage4-tests/STAGE4-SUMMARY.md`:

```markdown
# Stage 4 — Tests Agent: Summary & Results

**Date**: [today's date]
**Duration**: ~45 minutes
**Status**: ✅ COMPLETE

## Services Tested

### Service 1: backend/services/exampleService.js
- **Type**: Pure business logic (product rating, validation, review checking)
- **Tests**: 52 total
  - calculateProductRating: 12 tests (happy path + 5 edge cases)
  - validateProductInput: 20 tests (validation rules + edge cases)
  - userAlreadyReviewed: 20 tests (matching, null handling, security)
- **Coverage**: 100% of exported functions
- **Result**: ✅ ALL 52 TESTS PASSED (0.432s)

### Service 2: mcp-feature-flags/src/server.ts
- **Type**: Feature flag management (TypeScript)
- **Tests**: [number generated by agent]
  - listFeatures: [count]
  - getFeatureInfo: [count]
  - setFeatureState: [count]
  - adjustTrafficRollout: [count]
- **Coverage**: [percentage]
- **Result**: ✅ [count] TESTS PASSED, ⚠️ [count] assertions refined (test design, not code bugs)

## Agent Performance

- **test-writer-mate invocations**: 2
- **Test files created**: 2
- **Total assertions**: ~70+
- **Pattern matching**: ✅ Matched existing project test style (Jest + ES Modules)

## Key Insights

1. **Service tests are fast** — pure functions run in <1s
2. **Strong assertions matter** — test coverage doesn't guarantee mutation resistance
3. **Edge cases catch real bugs** — boundary values + null handling found 3 potential issues
4. **TypeScript MCP services** — agents can generate tests for TS with `ts-jest` preset

## Bonus: Mutation Testing (Optional)

If you ran mutation testing:
```bash
npm install --save-dev mutmut  # or stryker for JS
mutmut run backend/__tests__/services/exampleService.test.js
```

**Mutation score**: [if run]

## Deliverables Checklist

- [x] test-writer-mate agent invoked on 2 services
- [x] Generated test files executable (no pseudo-code)
- [x] All tests pass or failures documented
- [x] Screenshots showing test results
- [x] This summary document

## Next Steps

After Stage 4:
- Review mutation score if bonus was attempted
- Integration tests for controllers (Stage 5+)
- CI/CD integration (GitHub Actions, etc.)
```

---

## Running Tests: Full Command Reference

### Setup (one-time)

```bash
cd /Users/Veronica_Lapunka/Documents/git3/proshop_mern

# Ensure dependencies installed
npm install

# Jest already configured — no additional setup needed
```

### Run Tests

```bash
# All backend service tests
NODE_OPTIONS="--experimental-vm-modules" npm test -- backend/__tests__/services/ --no-coverage

# Specific service
NODE_OPTIONS="--experimental-vm-modules" npm test -- backend/__tests__/services/exampleService.test.js --no-coverage

# All MCP tests
NODE_OPTIONS="--experimental-vm-modules" npm test -- mcp-feature-flags/__tests__/ --no-coverage

# Watch mode (re-run on file changes)
NODE_OPTIONS="--experimental-vm-modules" npm test -- --watch

# Coverage report (if needed)
NODE_OPTIONS="--experimental-vm-modules" npm test -- backend/__tests__/services/ --coverage
```

### Expected Output (Success)

```
 PASS  backend/__tests__/services/exampleService.test.js (0.432 s)
  calculateProductRating
    happy path
      ✓ calculates correct average rating from multiple reviews
      ✓ returns exact average for non-integer results
      ...
    ✓ 52 passed
```

### Troubleshooting

**Error: `Cannot use import statement`**
→ Ensure `NODE_OPTIONS="--experimental-vm-modules"` is set before running

**Error: `jest.config.cjs not found`**
→ Check `jest.config.cjs` exists in repo root

**Error: `Cannot find module '../../services/exampleService.js'`**
→ Verify all imports include `.js` extension (ES Module requirement)

---

## Agent Invocation Syntax

The `test-writer-mate` agent is defined in `.claude/agents/test-writer-mate.md`. To invoke it:

```
/test-writer-mate

Please generate comprehensive tests for:
Service: backend/services/exampleService.js
(or the service you want tested)

Context: [optional — describe what the service does]
```

The agent will:
1. Read the service file
2. Find and read existing tests (to match style)
3. Identify all public functions/exports
4. Generate test file in project convention (`backend/__tests__/services/`)
5. Write strong, value-checking assertions
6. Return list of tests with one-line descriptions

---

## Success Criteria

✅ **Stage 4 is complete when:**
1. ✅ 2 services have generated tests
2. ✅ All tests execute without errors
3. ✅ Test files are readable (not pseudo-code)
4. ✅ Assertions check VALUES, not aliveness
5. ✅ Screenshots show test results (PASS/FAIL)
6. ✅ Summary document in `homework-m6/stage4-tests/`

---

## File Structure Reference

```
proshop_mern/
├── .claude/
│   └── agents/
│       └── test-writer-mate.md                    ← Agent definition
├── backend/
│   ├── __tests__/
│   │   └── services/
│   │       ├── exampleService.test.js             ← Reference tests (52, all PASS)
│   │       └── [NEW] productService.test.js       ← Generated by agent
│   ├── services/
│   │   └── exampleService.js                      ← Tested service
│   └── controllers/
│       ├── productController.js
│       ├── userController.js
│       └── orderController.js
├── mcp-feature-flags/
│   ├── __tests__/
│   │   └── server.test.ts                         ← MCP tests (59 passing, 21 assertion refinements)
│   └── src/
│       └── server.ts
├── jest.config.cjs                                ← Jest config (ESM + ts-jest)
├── homework-m6/
│   └── stage4-tests/
│       ├── STAGE4-SUMMARY.md                      ← Write this
│       ├── backend-service-tests.png              ← Screenshot 1
│       └── mcp-service-tests.png                  ← Screenshot 2
└── STAGE4-INSTRUCTIONS.md                         ← This file
```

---

## Tips for Success

1. **Start with exampleService.js** — It's already tested, so you can verify the test runner works
2. **Match the existing test style** — The agent will read `exampleService.test.js` and copy its patterns
3. **Use strong assertions** — The agent is trained to avoid weak checks like `toBeDefined()`
4. **Screenshot PASSING tests** — This proves the test suite is executable, not theoretical
5. **Document edge cases** — Note which test catches which real-world bug

---

## Next Phases (After Stage 4)

- **Stage 5** (optional): Mutation testing with `mutmut` or `stryker`
- **Stage 6+** (beyond M6): Integration tests for controllers with test DB
- **CI/CD**: GitHub Actions to run tests on every commit

---

**Questions?** Refer to:
- `.claude/agents/test-writer-mate.md` — Full agent definition
- `backend/CLAUDE.md` — Backend architecture & code review rules
- `jest.config.cjs` — Test framework configuration
- `backend/__tests__/services/exampleService.test.js` — Pattern reference

Good luck! 🚀

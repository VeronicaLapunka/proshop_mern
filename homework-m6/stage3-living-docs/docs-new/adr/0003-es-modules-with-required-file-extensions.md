# ADR 0003: ES Modules with Required File Extensions in Backend

**Status:** Accepted  
**Confidence:** HIGH (configured in package.json, enforced in all imports)  
**Date:** 2026-04-25

## Context

The Node.js backend uses ES Modules (ESM) instead of CommonJS, configured via `"type": "module"` in `package.json` (line 6). This requires all local import paths to include the `.js` file extension.

**Example from `backend/controllers/userController.js`:**
```javascript
import generateToken from '../utils/generateToken.js'
import User from '../models/userModel.js'
import asyncHandler from 'express-async-handler'
```

**Consistent throughout backend:**
- `backend/server.js` imports `backend/routes/productRoutes.js` (with `.js`)
- `backend/routes/productRoutes.js` imports `backend/controllers/productController.js` (with `.js`)
- `backend/controllers/productController.js` imports `backend/models/productModel.js` (with `.js`)
- `backend/middleware/authMiddleware.js` imports `backend/models/userModel.js` (with `.js`)

The frontend also uses ES Modules, but the Webpack bundler handles extension resolution automatically, so `.js` extensions are optional in `frontend/src/`.

## Decision

Use ES Modules (`import`/`export`) in the backend with mandatory file extensions on local imports, rather than CommonJS (`require`/`module.exports`).

### Why This Configuration Was Chosen

1. **Modern JavaScript syntax** — ES Modules are the standardized module system (vs. CommonJS which is Node.js-specific)
2. **Node.js 14.6+ support** — App requires Node 14.6+ anyway, so ESM is available
3. **Future-proof** — CommonJS is deprecated in Node.js; ESM is the direction
4. **Consistency** — Frontend already uses ESM; backend uses the same syntax
5. **Async imports** — ESM supports top-level await (useful for database initialization)

## Alternatives Considered

### 1. CommonJS (require/module.exports)
```javascript
// backend/controllers/userController.js
const generateToken = require('../utils/generateToken')
const User = require('../models/userModel')
const asyncHandler = require('express-async-handler')

module.exports = { authUser, registerUser, ... }
```

**Pros:**
- File extensions optional (`require('../utils/generateToken')` works)
- Familiar to developers who started with Node.js
- Synchronous; simpler mental model
- Default in older Node.js versions

**Cons:**
- Deprecated in favor of ESM by Node.js maintainers
- Not standardized; proprietary to Node.js
- No tree-shaking support (unused code bundled)
- Mixing CommonJS and ESM is complex (dual-package hazard)
- Doesn't work in modern browsers without transpilation

### 2. TypeScript (with ESM or CommonJS)
```javascript
// tsconfig.json
{
  "module": "esnext",
  "target": "es2020",
  "declaration": true
}

// backend/controllers/userController.ts
import generateToken from '../utils/generateToken.js'
import User from '../models/userModel.js'
export const authUser = (...) => { ... }
```

**Pros:**
- Static type checking (catch bugs at compile time)
- Better IDE support (autocomplete, refactoring)
- Self-documenting code (function signatures are contracts)
- Still uses ESM

**Cons:**
- Build step required (Node won't run .ts directly)
- Additional setup and tooling complexity
- Slower development cycle (compile before test)
- Learning curve for team unfamiliar with TypeScript
- Overkill for simple CRUD app

### 3. ESM without File Extensions (Custom Loaders)
```javascript
// node --loader ./esm-loader.js backend/server.js
// Custom loader resolves imports without extensions
import generateToken from '../utils/generateToken'
```

**Pros:**
- Cleaner import syntax
- Matches frontend style (Webpack auto-resolves)

**Cons:**
- Requires custom Node loader setup (not standard)
- Performance impact (resolver runs on every import)
- Not portable (breaks if code moved to different environment)
- Harder to debug (import resolution is non-obvious)
- Unsupported by Node.js tooling

### 4. Transpilation (Babel)
```javascript
// babel.config.js
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: '14' } }]],
}

// babel-node backend/server.js (or build then node)
```

**Pros:**
- Can use newest JavaScript features
- Can support both CommonJS and ESM
- File extensions optional (Babel resolver)

**Cons:**
- Requires build step (slows development, complicates deployment)
- Additional dependency complexity
- Added startup latency
- Harder to debug (source maps required)
- Overkill for a simple app

## Consequences

### Positive
- **Modern syntax** — `import`/`export` are standardized JavaScript, not Node.js-specific
- **Consistency** — Same module syntax across frontend and backend
- **Future-proof** — Aligns with JavaScript evolution; easier to upgrade later
- **Tree-shaking ready** — Bundlers can eliminate dead code (though backend doesn't benefit yet)
- **Top-level await** — Can use `await` at module level for database initialization
- **No build step** — Node.js executes ES Modules directly (no compilation needed)

### Negative
- **File extensions required** — All local imports must include `.js` extension (e.g., `'./userModel.js'` not `'./userModel'`)
  - Error message if extension omitted is cryptic: `ERR_MODULE_NOT_FOUND`
  - Developers coming from CommonJS or webpack-bundled code may forget
  - Distinguishes local imports from node_modules imports
- **Node.js version requirement** — Requires Node 14.6+ (fine for 2026, but older environments unsupported)
- **Package exports complexity** — Third-party packages may not expose ESM entry points (legacy packages ship CommonJS only)
- **Dual-module issues** — If a backend package has both CommonJS and ESM exports, picking the wrong one can cause issues
- **Slower cold startup** — ESM parsing is slightly slower than CommonJS (though not measurable in practice)
- **Import order matters** — Top-level code runs in import order; can cause circular dependency issues

### Behavioral Issues Caused by ESM Configuration

1. **Import without extension fails silently** — `import User from '../models/userModel'` throws `ERR_MODULE_NOT_FOUND` with no suggestion to add `.js`
2. **__dirname is not defined** — CommonJS provides `__dirname`; ESM requires workaround:
   ```javascript
   import path from 'path'
   import { fileURLToPath } from 'url'
   const __dirname = path.dirname(fileURLToPath(import.meta.url))
   ```
   ProShop works around this in `server.js` using `path.resolve()` instead

3. **Package.json exports** — Consuming ESM from CommonJS (or vice versa) can pick wrong entry point
   - Example: `express-async-handler` exports both formats; ESM mode selects correctly

## Related Decisions

- **No TypeScript** — Type safety is sacrificed for simplicity; developers rely on runtime errors and testing
- **No transpilation** — Builds are simpler, but compatibility with older Node versions is lost

## Implementation Notes

- **Node version** — `package.json` has no `engines` field specifying Node version requirement. Should document that Node 14.6+ is required.
- **Extension resolution** — npm packages are excluded from extension requirement; `import express from 'express'` works (npm's package.json `main` field handles resolution)
- **Conditional imports** — Not used in ProShop, but possible with ESM:
  ```javascript
  import('../models/userModel.js').then(...)
  ```
- **Top-level await** — Possible with ESM, but not used in ProShop

## Potential Issues at Scale

If the codebase grows to >100 files:
1. **Accidental CommonJS imports** — Easy to forget `.js` extension; create linting rule: `eslint-plugin-import` with `import/extensions: ['error', 'always']`
2. **Module interop issues** — If adding packages that are CommonJS-only, may require `createRequire` workaround:
   ```javascript
   import { createRequire } from 'module'
   const require = createRequire(import.meta.url)
   const legacyPackage = require('old-commonjs-only-package')
   ```

## Future Considerations

- **Type safety** — If team adopts TypeScript, ESM support is built-in; migration is straightforward
- **Cloudflare Workers / Edge runtime** — ESM is preferred for serverless; this decision aligns with that future

## See Also

- `package.json` line 6 — `"type": "module"` configuration
- `backend/server.js` lines 1-12 — exemplar ESM imports
- `backend/controllers/userController.js` — all imports with `.js` extensions
- Node.js ESM docs: https://nodejs.org/api/esm.html
- ECMAScript modules spec: https://tc39.es/ecma262/#sec-modules

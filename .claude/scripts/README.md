# .claude/scripts/ — Claude Code Helper Scripts

This directory contains automation scripts for managing the ProShop MERN project.

## update_project_index.py

**Purpose:** Regenerate `project-index.json` and `docs/PROJECT_MAP.md` from source code.

### Usage

```bash
# From repo root
python3 update_project_index.py              # Full regeneration
python3 update_project_index.py --dry-run    # Preview changes (no writes)
python3 update_project_index.py --verbose    # Show all discovered modules
python3 update_project_index.py --validate-only  # Check for broken links only

# From .claude/scripts/ directory
cd .claude/scripts && python3 update_project_index.py
```

### What It Does

1. **Scans backend/** for:
   - Models (`.js` files ending in `Model.js`)
   - Controllers (`.js` files ending in `Controller.js`)
   - Routes (`.js` files ending in `Routes.js`)
   - Middleware (`.js` files ending in `Middleware.js`)

2. **Scans frontend/src/** for:
   - Screens (`.js` files ending in `Screen.js`)
   - Components (`.js` files in `components/`)
   - Redux domains (reducers, actions, constants)

3. **Extracts features.json** for feature flag inventory

4. **Detects MCP servers** in `mcp-docs-search/` and `mcp-feature-flags/`

5. **Generates:**
   - `project-index.json` — Machine-readable module catalog (7 KB)
   - `docs/PROJECT_MAP.md` — Human-readable navigation guide (4 KB)

### Output Example

```
[*] Scanning backend/ for models, controllers, routes, middleware...
    ✓ Found 3 models (Product, User, Order)
    ✓ Found 3 controllers (product, user, order)
    ✓ Found 5 route files (26 endpoints)
    ✓ Found 2 middleware files

[*] Scanning frontend/src/ for screens, components, Redux domains...
    ✓ Found 16 screens (5 public, 5 auth, 6 admin)
    ✓ Found 13 components
    ✓ Found 5 Redux domains

[*] Extracting features.json...
    ✓ Found 25 feature flags

[✓] Index generation complete
    Generated: project-index.json (7.2 KB)
    Generated: docs/PROJECT_MAP.md (4.6 KB)
```

### When to Regenerate

Run this script after:
- Adding a new backend route or controller
- Adding a new frontend screen or component
- Modifying Redux domain structure
- Updating `features.json` with new flags
- Any major code reorganization

### Script Location

- **Primary:** `update_project_index.py` (repo root) — use when running from repo root
- **Secondary:** `.claude/scripts/update_project_index.py` — symlinked copy for organization

Both resolve to the repo root automatically, so either can be used.

---

## Tips

- Use `--dry-run` before committing major changes to verify nothing breaks
- Use `--validate-only` to check for dead links without regenerating
- Use `--verbose` when debugging discovery issues

---

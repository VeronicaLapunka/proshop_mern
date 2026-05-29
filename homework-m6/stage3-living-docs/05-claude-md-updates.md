# Proposed CLAUDE.md Updates — Living Documentation System

**Document:** 05-claude-md-updates.md
**Purpose:** Specify new sections to add to root CLAUDE.md for Stage 3 living documentation system
**Status:** Phase 4 Design → Phase 5 Implementation Ready
**Date:** 2026-05-28

---

## Overview

This document contains **proposed new sections** for `/Users/Veronica_Lapunka/Documents/git3/proshop_mern/CLAUDE.md` that integrate the living documentation system created in Stage 3. These sections should be appended to the existing CLAUDE.md after the "Screenshot Workflow" section and before "After Running Commands."

---

## Section 1: Living Documentation System

### Location in CLAUDE.md
**Insert after:** "Screenshot Workflow (before/after redesign)" section
**Before:** "After Running Commands" section

### Content

```markdown
## Living Documentation System

ProShop maintains a **project-index.json** file as a single source of truth for module metadata.
This index is automatically regenerated and kept in sync with the codebase.

### Understanding project-index.json

The `project-index.json` catalog documents:

- **Backend modules**: 3 models, 3 controllers, 5 route groups (26 endpoints), 2 middleware files
- **Frontend modules**: 16 screens, 13 reusable components, 5 Redux domains with state shapes
- **Feature flags**: All 25 flags organized by status (Enabled/Testing/Disabled) and category
- **MCP servers**: Integration points for RAG docs search and feature flag management
- **Cross-references**: Thunk→endpoint mappings, feature flag integration points, docs navigation

**Location:** `project-index.json` (root of repository)
**Schema:** `homework-m6/stage3-living-docs/03-project-index-schema.md`
**Last generated:** Check `metadata.generated_at` field in `project-index.json`

### Regenerating the Project Index

After making changes to:
- Backend route definitions (`backend/routes/*.js`)
- Backend controller signatures (`backend/controllers/*.js`)
- Frontend screens (`frontend/src/screens/*.js`)
- Frontend Redux domain structure (`frontend/src/reducers/*.js`)
- Feature flags (`features.json`)

**Regenerate the index:**

```bash
python update_project_index.py
```

**Options:**

```bash
# Show what would be changed (no file writes)
python update_project_index.py --dry-run

# Verbose output: show all discovered modules
python update_project_index.py --verbose

# Validate only: check for broken links, report issues
python update_project_index.py --validate-only
```

**Output:**

The script generates:
1. **`project-index.json`** — Machine-readable module catalog (6-8 KB)
2. **`docs/PROJECT_MAP.md`** — Human-readable navigation guide (4-6 KB)

Example output:

```
[*] Scanning backend/ for models, controllers, routes, middleware...
    ✓ Found 3 models (Product, User, Order)
    ✓ Found 3 controllers (product, user, order)
    ✓ Found 5 routes (26 endpoints)
    ✓ Total: 26 backend endpoints

[*] Scanning frontend/src/ for Redux and React components...
    ✓ Found 16 screens (5 public, 5 auth, 6 admin)
    ✓ Found 5 Redux domains
    ✓ Total: 13 components

[*] Extracting features.json...
    ✓ Found 25 feature flags

[✓] Index generation complete:
    Generated: project-index.json (6.2 KB)
    Generated: docs/PROJECT_MAP.md (4.1 KB)
    Timestamp: 2026-05-28T14:35:00Z
```

### Documentation Organization

**Accurate documentation** (✅):
- `docs/adr/` — Architectural decision records (9 files, current)
- `docs/project-data/api/` — API endpoint specifications (5 files, current)
- `docs/project-data/features/` — Feature documentation (6 files, current)
- `docs/project-data/incidents/` — Post-mortems and incident reviews (3 files, current)

**Partially accurate documentation** (🔄 — has TODO markers):
- `docs/project-data/pages/` — Screen documentation (14 files, may have design refs from Stage 4)
- `docs/project-data/runbooks/` — Operational procedures (4 active + 2 deferred)
- `docs/project-data/architecture.md` — Main architecture overview (missing MCP servers section)
- `docs/project-data/glossary.md` — Domain terminology (needs feature flag terms)

**Historical documentation** (📦 — archived but preserved):
- `docs/archived-2026-05-28/` — M2 test files, reports, historical snapshots
- Reference: `docs/project-data/dev-history.md` for institutional context

**Deferred documentation** (⏳ — placeholder templates):
- `docs/deferred-2026-05-28/` — Runbook templates awaiting implementation
- Example: `ab-test-setup.md`, `feature-flag-toggle.md`

### Index Navigation

**Start here:** `docs/INDEX.md` — Hub linking all documentation subdirectories.

**For questions about:**
- Module architecture → Read `docs/adr/`
- API endpoints → Read `docs/project-data/api/` + check `project-index.json` backend section
- Feature flags → Check `project-index.json` features section + `docs/project-data/features/`
- Screens/components → Read `docs/project-data/pages/` + check `project-index.json` frontend section
- Running procedures → Read `docs/project-data/runbooks/` + check incident history in `docs/project-data/incidents/`
```

---

## Section 2: AI Agent Integration Points

### Location in CLAUDE.md
**Insert after:** Section 1 (Living Documentation System)
**Before:** "After Running Commands" section

### Content

```markdown
## AI Agent Integration Points

Claude Code and MCP servers are integrated with the living documentation system. When working on ProShop, use these MCP tools to access current documentation and feature flag state.

### MCP: docs-search (RAG Vector Search)

**Purpose:** Full-text semantic search across all markdown documentation in `docs/`

**When to use:**
- Question about architecture, features, runbooks, or incidents
- Need quick lookup across all documentation (faster than manual grep)
- Want ranked results with relevance scores

**Tool:** `search_project_docs(query, top_k=5)`

**Example queries:**
```
search_project_docs("How does cart persistence work?")
search_project_docs("What is the JWT token refresh strategy?")
search_project_docs("Feature flag deployment procedure")
search_project_docs("PayPal payment failures")
```

**Returns:** Ranked chunks with source_file, relevance score, and snippet

**Fallback:** Use Grep + Read only if vector search scores are all < 0.6 or you need the full file content

### MCP: feature-flags (Feature Flag Management)

**Purpose:** Query and manage the 25 feature flags in `features.json`

**Tools:**
- `list_features()` — Get all 25 flags with status, traffic percentage, dependencies
- `get_feature_info(name)` — Get single flag details
- `set_feature_state(name, status)` — Change flag status (Disabled → Testing → Enabled)
- `adjust_traffic_rollout(name, traffic_percentage)` — Change rollout % (0-100)

**Example usage:**
```
# Query flag state
get_feature_info("search_v2")  # → {status: "Testing", traffic: 85%, dependencies: []}

# Enable a feature globally
set_feature_state("guest_cart_persistence", "Enabled")

# Ramp up traffic gradually
adjust_traffic_rollout("semantic_search", 50)  # Start at 50%, monitor, increase to 100%
```

**Important:** Never edit `features.json` manually — always use MCP tools to maintain consistency.

### Documentation Update Workflow

When adding new functionality:

1. **Add the code** (backend route, frontend screen, etc.)
2. **Update relevant docs** (`docs/project-data/api/`, `docs/project-data/features/`, `docs/project-data/pages/`, etc.)
3. **Regenerate the index:**
   ```bash
   python update_project_index.py
   ```
4. **Verify no broken links:**
   ```bash
   python update_project_index.py --validate-only
   ```

### Project Index Queries

**From Python/JavaScript:**

```python
import json

with open('project-index.json') as f:
    index = json.load(f)

# Get all backend endpoints
endpoints = index['backend']['routes']
print(f"Total endpoints: {index['backend']['total_endpoints']}")

# Get all feature flags
flags = index['features']['sample_flags']
print(f"Enabled flags: {index['features']['by_status']['Enabled']}")

# Get Redux domain structure
domains = index['frontend']['redux_domains']
for domain in domains:
    print(f"{domain['name']} → {domain['state_slices']}")
```

### Automated Regeneration (Optional)

To make `update_project_index.py` run automatically on certain changes, configure a PostToolUse hook in settings.json:

```json
{
  "hooks": {
    "PostToolUse": {
      "triggers": ["Edit when backend/routes/ or features.json changed"],
      "command": "python update_project_index.py"
    }
  }
}
```

This is **optional** — you can also regenerate manually on demand.
```

---

## Section 3: Documentation Audit Verdicts Reference

### Location in CLAUDE.md
**Insert after:** Section 2 (AI Agent Integration Points)
**Before:** "After Running Commands" section

### Content

```markdown
## Documentation Audit Reference

See `homework-m6/stage3-living-docs/01-docs-audit.md` for the complete audit of all 59 documentation files (verdict legend: ✅ ACCURATE, 🔄 PARTIALLY ACCURATE, 📦 HISTORICAL, ❌ STALE).

**Quick reference:**

| Category | Files | Verdict | Action |
|----------|-------|---------|--------|
| ADRs | 9 | ✅ | Keep as-is |
| API specs | 5 | ✅ | Keep as-is |
| Feature docs | 6 | ✅ | Keep as-is |
| Incidents | 3 | ✅ | Keep as-is |
| Page docs | 14 | 🔄 | Has TODO markers for stale design refs |
| Runbooks | 6 | 🔄 | 4 active, 2 deferred (placeholder templates) |
| Architecture | 1 | 🔄 | Has TODO marker (needs MCP section) |
| Glossary | 1 | 🔄 | Has TODO marker (needs feature flag terms) |
| M2 test files | 3 | 📦 | Archived (historical, reference only) |
| Reports/history | 3 | 📦 | Archived (historical snapshots) |
| Russian analysis | 1 | ❌ | Archived (stale, scope unclear) |

**When updating docs:** Replace TODO markers with actual content, then regenerate the index.
```

---

## Section 4: Architecture Reference

### Location in CLAUDE.md
**Insert after:** Section 3 (Documentation Audit Reference)
**Before:** "After Running Commands" section

### Content

```markdown
## Architecture Reference

Full module-level documentation is in `homework-m6/stage3-living-docs/02-architecture-specs.md`.

**Quick reference:**

| Module | File | Purpose | Key Integration |
|--------|------|---------|-----------------|
| **Backend Routes** | `backend/routes/*Routes.js` | Express route definitions | 26 endpoints, 5 groups (product, user, order, upload, featureFlag) |
| **Backend Controllers** | `backend/controllers/*Controller.js` | Route handlers and business logic | 3 files (product, user, order); ~6-8 actions each |
| **Backend Middleware** | `backend/middleware/*Middleware.js` | Auth & error handling | `protect` (JWT), `admin` (role check), error formatter |
| **Frontend Screens** | `frontend/src/screens/*Screen.js` | Page-level React components | 16 screens: 5 public, 5 auth, 6 admin |
| **Frontend Components** | `frontend/src/components/*.js` | Reusable React UI components | 13 shared components (Header, Footer, Rating, etc.) |
| **Redux Domains** | `frontend/src/{actions,reducers,constants}/*` | State management | 5 domains (product, user, order, cart, featureFlag) with thunk actions |
| **Feature Flags** | `features.json` + MCP server | Runtime behavior toggles | 25 flags, 8 enabled, 6 testing, 11 disabled |
| **MCP Docs Search** | `mcp-docs-search/src/server.ts` | RAG vector search over docs | Integration: `search_project_docs(query)` MCP tool |
| **MCP Feature Flags** | `mcp-feature-flags/src/server.ts` | Flag state management | Integration: list/get/set/adjust MCP tools |

**For detailed info:** Read `02-architecture-specs.md` or query with `search_project_docs("module architecture")`.
```

---

## Implementation Notes

### Placement

These sections should be added to the **root CLAUDE.md** in this order:

1. **Section 1: Living Documentation System** (after "Screenshot Workflow", before "After Running Commands")
2. **Section 2: AI Agent Integration Points** (immediately after Section 1)
3. **Section 3: Documentation Audit Verdicts Reference** (immediately after Section 2)
4. **Section 4: Architecture Reference** (immediately after Section 3)
5. Keep existing "After Running Commands" section at the end

### Why This Order

- Sections 1-2 provide **operational guidance** (how to regenerate index, how to use MCP tools)
- Sections 3-4 provide **reference tables** (quick lookups without reading full docs)
- This flows from "how-to" → "what to reference"

### Do NOT Change

- Existing sections: "Project Overview", "Common Development Commands", "Environment Configuration", "Key Patterns", "Local Gotchas", "Screenshot Workflow"
- These are stable and tested; preserve them exactly

### Changes Summary

- **Lines to add:** ~300 lines total across 4 new sections
- **Lines to modify:** 0 (only insertion, no replacement)
- **New requirements on users:** None (all features are optional; backward compatible)

---

## Phase 5 Implementation Checklist

- [ ] Read this file to understand proposed changes
- [ ] Append Section 1 to root CLAUDE.md (Living Documentation System)
- [ ] Append Section 2 to root CLAUDE.md (AI Agent Integration Points)
- [ ] Append Section 3 to root CLAUDE.md (Documentation Audit Reference)
- [ ] Append Section 4 to root CLAUDE.md (Architecture Reference)
- [ ] Verify all markdown formatting is correct in updated CLAUDE.md
- [ ] Test MCP tools (docs-search, feature-flags) are accessible from updated CLAUDE.md context
- [ ] Document complete: Phase 5 ready for execution

---

## Related Deliverables

- **03-project-index-schema.md** — JSON schema design for project-index.json
- **04-update-script-design.md** — Python script specification for regenerating the index
- **update_project_index.py** — Actual implementation of the automation script
- **01-docs-audit.md** — Complete verdict table for all 59 documentation files

---

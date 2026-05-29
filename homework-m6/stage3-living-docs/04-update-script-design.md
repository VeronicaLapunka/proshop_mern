# update_project_index.py Design

**Document:** 04-update-script-design.md
**Purpose:** Specify the design and implementation of the automation script that regenerates `project-index.json` from source
**Status:** Design Phase

---

## Overview

`update_project_index.py` is a Python script that:

1. **Scans the codebase** for all modules, endpoints, components, Redux domains, and feature flags
2. **Extracts metadata** from source files (routes, controllers, models, screens, actions, reducers)
3. **Generates `project-index.json`** with current state
4. **Produces `docs/PROJECT_MAP.md`** as a human-readable navigation guide
5. **Validates links** to ensure all referenced files exist

---

## Implementation Approach

### Phase 1: Discovery

**Backend Discovery:**
- Scan `backend/models/*.js` → Extract Mongoose schema definitions
- Scan `backend/controllers/*.js` → Extract exported action functions
- Scan `backend/routes/*.js` → Count route declarations, extract base paths
- Count `backend/middleware/*.js` → Extract middleware function names
- List `backend/utils/*.js` → Extract utility functions

**Frontend Discovery:**
- Scan `frontend/src/screens/*.js` → Extract component names, routes from React Router
- Scan `frontend/src/components/*.js` → Extract component names and purposes
- Scan `frontend/src/reducers/*.js` → Extract reducer functions
- Scan `frontend/src/actions/*.js` → Extract thunk action creators
- Scan `frontend/src/constants/*.js` → Count action type constants

**Feature Flags:**
- Parse `features.json` → Extract all 25 flags, organize by status/category

**MCP Servers:**
- Scan `mcp-docs-search/src/` → Extract server.ts structure (tools, handlers)
- Scan `mcp-feature-flags/src/` → Extract server.ts structure (tools, handlers)

### Phase 2: Extraction

**Regex Patterns:**
```python
# Backend routes
ROUTE_PATTERN = r"router\.(get|post|put|delete|patch)\(['\"](.*?)['\"]"

# Redux reducers
REDUCER_PATTERN = r"export\s+const\s+(\w+)\s*=\s*\(state|function\s+(\w+)\(state"

# React components
COMPONENT_PATTERN = r"^const\s+(\w+Screen|Header|Footer|Product)\s*="

# Express middleware
MIDDLEWARE_PATTERN = r"export\s+(?:const|function)\s+(\w+)\s*=\s*\(?.*?\)?\s*=>?|function\s+(\w+)"
```

### Phase 3: Aggregation

Combine all extracted metadata into the JSON schema structure with:
- Counts: endpoints, screens, components, reducers, features
- Cross-references: which thunk calls which endpoint
- Timestamps: when the index was generated
- Metadata: repository name, tech stack, ports

### Phase 4: Validation

Check:
- All file paths in the index exist on disk
- All route definitions have corresponding controller actions
- All Redux domains have matching action/reducer/constant files
- Feature flags match the live `features.json` count
- No dead links in cross-references

### Phase 5: Output

Write:
1. **`project-index.json`** (versioned, overwrites previous)
2. **`docs/PROJECT_MAP.md`** (formatted markdown navigation)
3. **Validation report** (stdout): files count, endpoints found, flags synced, etc.

---

## Command-Line Interface

### Usage

```bash
cd /Users/Veronica_Lapunka/Documents/git3/proshop_mern

# Regenerate index (interactive)
python update_project_index.py

# Regenerate with dry-run (show what would be written)
python update_project_index.py --dry-run

# Verbose output (show all extracted modules)
python update_project_index.py --verbose

# Validate only (no file writes, report only)
python update_project_index.py --validate-only
```

### Output Examples

```
$ python update_project_index.py --verbose

[*] Scanning backend/ for models, controllers, routes, middleware...
    ✓ Found 3 models (Product, User, Order)
    ✓ Found 3 controllers (product, user, order)
    ✓ Found 5 routes (product, user, order, upload, featureFlag)
    ✓ Found 2 middleware (auth, error)
    ✓ Total endpoints: 26

[*] Scanning frontend/src/ for Redux and React components...
    ✓ Found 16 screens (3 public, 5 auth, 6 admin + 2 feature admin)
    ✓ Found 13 components (Header, Footer, Rating, etc.)
    ✓ Found 5 Redux domains (product, user, order, cart, featureFlag)
    ✓ Found 22 action creators across 5 action files

[*] Extracting features.json...
    ✓ Found 25 feature flags
    ✓ Organized by status: Enabled (8), Testing (6), Disabled (11)

[*] Scanning MCP servers...
    ✓ Found mcp-docs-search (1 tool: search_project_docs)
    ✓ Found mcp-feature-flags (4 tools: list_features, get_feature_info, ...)

[*] Cross-referencing endpoints to thunks...
    ✓ Linked 14 thunk actions to 14 backend endpoints

[*] Validating all paths...
    ✓ All 59 documentation files exist
    ✓ All 26 backend endpoint paths valid
    ✓ All 16 screen files exist
    ✓ All 25 feature flags have entries

[✓] Index generation complete:
    Generated: project-index.json (6.2 KB)
    Generated: docs/PROJECT_MAP.md (4.1 KB)
    Timestamp: 2026-05-28T14:35:00Z
```

---

## Integration with CLAUDE.md

### Phase 5 Hook (Optional)

In CLAUDE.md, add:

```markdown
## Automated Index Updates (Phase 5 — Optional)

After making changes to backend routes, frontend screens, or adding feature flags, regenerate the project index:

\`\`\`bash
python update_project_index.py
\`\`\`

This keeps `project-index.json` and `docs/PROJECT_MAP.md` in sync with the codebase.

### PostToolUse Hook (Optional)

To make this automatic, configure in settings.json:

\`\`\`json
{
  "hooks": {
    "PostToolUse": {
      "triggers": ["Edit when backend/ or features.json changed"],
      "command": "python update_project_index.py"
    }
  }
}
\`\`\`

(Not required for Stage 3; can be configured later.)
```

---

## Implementation Checklist

- [ ] Create `update_project_index.py` in repository root
- [ ] Implement backend discovery (models, controllers, routes)
- [ ] Implement frontend discovery (screens, components, Redux domains)
- [ ] Implement feature flag extraction from `features.json`
- [ ] Implement MCP server discovery
- [ ] Implement cross-reference linking (thunk → endpoint)
- [ ] Implement validation logic
- [ ] Generate `project-index.json` output
- [ ] Generate `docs/PROJECT_MAP.md` output
- [ ] Test with `--dry-run` and `--verbose` flags
- [ ] Document in CLAUDE.md (Phase 5 optional section)

---

## Example: Core Discovery Functions

```python
import os
import json
import re
from datetime import datetime
from pathlib import Path

def find_models():
    """Extract Mongoose model definitions from backend/models/"""
    models = []
    models_dir = 'backend/models'
    for file in os.listdir(models_dir):
        if file.endswith('Model.js'):
            model_name = file.replace('Model.js', '').capitalize()
            models.append({
                'name': model_name,
                'file': f'{models_dir}/{file}'
            })
    return models

def find_routes():
    """Extract route definitions from backend/routes/"""
    routes = []
    routes_dir = 'backend/routes'
    route_pattern = re.compile(r'router\.get|router\.post|router\.put|router\.delete')

    for file in os.listdir(routes_dir):
        if file.endswith('Routes.js'):
            with open(f'{routes_dir}/{file}', 'r') as f:
                content = f.read()
                count = len(route_pattern.findall(content))
                base_path = f"/api/{file.replace('Routes.js', '')}"
                routes.append({
                    'name': file.replace('Routes.js', ''),
                    'file': f'{routes_dir}/{file}',
                    'base_path': base_path,
                    'endpoints': count
                })
    return routes

def find_screens():
    """Extract React screens from frontend/src/screens/"""
    screens = []
    screens_dir = 'frontend/src/screens'
    for file in os.listdir(screens_dir):
        if file.endswith('Screen.js'):
            screen_name = file.replace('Screen.js', '')
            screens.append({
                'name': screen_name + 'Screen',
                'file': f'{screens_dir}/{file}'
            })
    return screens

def load_features():
    """Load feature flags from features.json"""
    with open('features.json', 'r') as f:
        return json.load(f)

def generate_project_index():
    """Main function: orchestrate discovery and output"""
    index = {
        'metadata': {
            'version': '1.0',
            'generated_at': datetime.utcnow().isoformat() + 'Z',
            'generated_by': 'update_project_index.py'
        },
        'backend': {
            'models': find_models(),
            'routes': find_routes()
        },
        'frontend': {
            'screens': find_screens()
        },
        'features': load_features()
    }

    with open('project-index.json', 'w') as f:
        json.dump(index, f, indent=2)

    print('[✓] Index generated: project-index.json')

if __name__ == '__main__':
    generate_project_index()
```

---

## Files Generated

| File | Purpose | Size (est.) |
|------|---------|-----------|
| `project-index.json` | Machine-readable module catalog | 6-8 KB |
| `docs/PROJECT_MAP.md` | Human-readable navigation guide | 4-6 KB |

---

## Future Enhancements

1. **Dependency visualization** — Generate a module dependency graph (GraphML format)
2. **API documentation** — Extract OpenAPI/Swagger from route definitions
3. **Test coverage tracking** — Detect test files, calculate coverage per module
4. **Breaking change detection** — Compare new index to previous, flag deletions/renames
5. **CI/CD integration** — Run on every commit, fail build if index out of sync


#!/usr/bin/env python3
"""
update_project_index.py — Regenerate project-index.json and docs/PROJECT_MAP.md

Usage:
    python update_project_index.py              # Regenerate index
    python update_project_index.py --dry-run    # Show what would be written
    python update_project_index.py --verbose    # Show all extracted modules
    python update_project_index.py --validate-only  # Validate only, no writes
"""

import os
import json
import re
import sys
import argparse
from datetime import datetime
from pathlib import Path

# Configuration
# Resolve REPO_ROOT as the proshop_mern directory (two levels up from .claude/scripts/)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))  # .claude/scripts -> .claude -> repo root
BACKEND_DIR = os.path.join(REPO_ROOT, 'backend')
FRONTEND_DIR = os.path.join(REPO_ROOT, 'frontend', 'src')
DOCS_DIR = os.path.join(REPO_ROOT, 'docs')
FEATURES_FILE = os.path.join(REPO_ROOT, 'features.json')
PROJECT_INDEX_FILE = os.path.join(REPO_ROOT, 'project-index.json')
PROJECT_MAP_FILE = os.path.join(DOCS_DIR, 'PROJECT_MAP.md')
MCP_DOCS_SEARCH_DIR = os.path.join(REPO_ROOT, 'mcp-docs-search', 'src')
MCP_FEATURE_FLAGS_DIR = os.path.join(REPO_ROOT, 'mcp-feature-flags', 'src')


def find_models(verbose=False):
    """Extract Mongoose model definitions from backend/models/"""
    models = []
    models_dir = os.path.join(BACKEND_DIR, 'models')

    if not os.path.exists(models_dir):
        return models

    for file in sorted(os.listdir(models_dir)):
        if file.endswith('Model.js'):
            model_name = file.replace('Model.js', '')
            models.append({
                'name': model_name,
                'file': f'backend/models/{file}'
            })
            if verbose:
                print(f"    - Model: {model_name}")

    return models


def find_controllers(verbose=False):
    """Extract controllers from backend/controllers/"""
    controllers = []
    controllers_dir = os.path.join(BACKEND_DIR, 'controllers')

    if not os.path.exists(controllers_dir):
        return controllers

    for file in sorted(os.listdir(controllers_dir)):
        if file.endswith('Controller.js'):
            controller_name = file.replace('Controller.js', '')
            controllers.append({
                'name': controller_name + 'Controller',
                'file': f'backend/controllers/{file}'
            })
            if verbose:
                print(f"    - Controller: {controller_name}")

    return controllers


def find_routes(verbose=False):
    """Extract route definitions from backend/routes/"""
    routes = []
    routes_dir = os.path.join(BACKEND_DIR, 'routes')

    if not os.path.exists(routes_dir):
        return routes

    # Regex to find route declarations
    route_patterns = [
        r'router\.get\([\'"]',
        r'router\.post\([\'"]',
        r'router\.put\([\'"]',
        r'router\.delete\([\'"]',
        r'router\.patch\([\'"]'
    ]
    combined_pattern = '|'.join(route_patterns)

    for file in sorted(os.listdir(routes_dir)):
        if file.endswith('Routes.js'):
            route_name = file.replace('Routes.js', '')
            filepath = os.path.join(routes_dir, file)

            try:
                with open(filepath, 'r') as f:
                    content = f.read()
                    # Count route declarations (loose approximation)
                    count = len(re.findall(combined_pattern, content))

                    # Extract base path from file name or router.use patterns
                    base_path = f"/api/{route_name}"

                    routes.append({
                        'name': route_name + 'Routes',
                        'file': f'backend/routes/{file}',
                        'base_path': base_path,
                        'endpoints': count if count > 0 else 'N/A'
                    })

                    if verbose:
                        print(f"    - Routes: {route_name} ({count} endpoints)")
            except Exception as e:
                print(f"    [!] Error reading {file}: {e}")

    return routes


def find_middleware(verbose=False):
    """Extract middleware from backend/middleware/"""
    middleware = []
    middleware_dir = os.path.join(BACKEND_DIR, 'middleware')

    if not os.path.exists(middleware_dir):
        return middleware

    for file in sorted(os.listdir(middleware_dir)):
        if file.endswith('.js'):
            middleware_name = file.replace('.js', '')
            middleware.append({
                'name': middleware_name,
                'file': f'backend/middleware/{file}'
            })
            if verbose:
                print(f"    - Middleware: {middleware_name}")

    return middleware


def find_screens(verbose=False):
    """Extract React screens from frontend/src/screens/"""
    screens = []
    screens_dir = os.path.join(FRONTEND_DIR, 'screens')

    if not os.path.exists(screens_dir):
        return screens

    for file in sorted(os.listdir(screens_dir)):
        if file.endswith('Screen.js'):
            screen_name = file.replace('.js', '')
            screens.append({
                'name': screen_name,
                'file': f'frontend/src/screens/{file}',
                'type': 'admin' if 'admin' in file.lower() else ('auth' if any(x in file.lower() for x in ['login', 'register', 'profile']) else 'public')
            })
            if verbose:
                print(f"    - Screen: {screen_name}")

    return screens


def find_components(verbose=False):
    """Extract React components from frontend/src/components/"""
    components = []
    components_dir = os.path.join(FRONTEND_DIR, 'components')

    if not os.path.exists(components_dir):
        return components

    for file in sorted(os.listdir(components_dir)):
        if file.endswith('.js') and not file.endswith('.css'):
            component_name = file.replace('.js', '')
            components.append({
                'name': component_name,
                'file': f'frontend/src/components/{file}'
            })
            if verbose:
                print(f"    - Component: {component_name}")

    return components


def find_redux_domains(verbose=False):
    """Extract Redux domains from frontend/src/{actions,reducers}"""
    domains = []
    actions_dir = os.path.join(FRONTEND_DIR, 'actions')
    reducers_dir = os.path.join(FRONTEND_DIR, 'reducers')

    if os.path.exists(actions_dir):
        for file in sorted(os.listdir(actions_dir)):
            if file.endswith('Actions.js') and file != '__tests__':
                domain_name = file.replace('Actions.js', '').lower()

                # Check if corresponding reducer exists
                reducer_file = os.path.join(reducers_dir, file.replace('Actions', 'Reducers'))
                has_reducer = os.path.exists(reducer_file)

                domains.append({
                    'name': domain_name,
                    'actions_file': f'frontend/src/actions/{file}',
                    'reducers_file': f'frontend/src/reducers/{file.replace("Actions", "Reducers")}' if has_reducer else 'N/A'
                })

                if verbose:
                    print(f"    - Redux Domain: {domain_name}")

    return domains


def load_features(verbose=False):
    """Load feature flags from features.json"""
    try:
        with open(FEATURES_FILE, 'r') as f:
            features = json.load(f)
            if verbose:
                statuses = {}
                for flag in features.values():
                    status = flag.get('status', 'Unknown')
                    statuses[status] = statuses.get(status, 0) + 1
                for status, count in sorted(statuses.items()):
                    print(f"    - {status}: {count} flags")
            return features
    except Exception as e:
        print(f"[!] Error loading features.json: {e}")
        return {}


def find_mcp_servers(verbose=False):
    """Extract MCP server definitions"""
    mcp_servers = []

    # mcp-docs-search
    if os.path.exists(MCP_DOCS_SEARCH_DIR):
        mcp_servers.append({
            'name': 'mcp-docs-search',
            'path': 'mcp-docs-search/',
            'language': 'TypeScript',
            'tools': ['search_project_docs']
        })
        if verbose:
            print(f"    - MCP: mcp-docs-search")

    # mcp-feature-flags
    if os.path.exists(MCP_FEATURE_FLAGS_DIR):
        mcp_servers.append({
            'name': 'mcp-feature-flags',
            'path': 'mcp-feature-flags/',
            'language': 'TypeScript',
            'tools': ['list_features', 'get_feature_info', 'set_feature_state', 'adjust_traffic_rollout']
        })
        if verbose:
            print(f"    - MCP: mcp-feature-flags")

    return mcp_servers


def validate_paths(index):
    """Validate that all referenced files exist"""
    errors = []

    def check_file(path):
        full_path = os.path.join(REPO_ROOT, path)
        if not os.path.exists(full_path):
            errors.append(f"File not found: {path}")
            return False
        return True

    # Check backend files
    for model in index.get('backend', {}).get('models', []):
        check_file(model['file'])

    for controller in index.get('backend', {}).get('controllers', []):
        check_file(controller['file'])

    for route in index.get('backend', {}).get('routes', []):
        check_file(route['file'])

    for middleware in index.get('backend', {}).get('middleware', []):
        check_file(middleware['file'])

    # Check frontend files
    for screen in index.get('frontend', {}).get('screens', []):
        check_file(screen['file'])

    for component in index.get('frontend', {}).get('components', []):
        check_file(component['file'])

    # Check MCP servers
    for mcp in index.get('mcp_servers', []):
        mcp_path = mcp['path']
        if not os.path.exists(os.path.join(REPO_ROOT, mcp_path)):
            errors.append(f"MCP server directory not found: {mcp_path}")

    return errors


def generate_project_map_md(index):
    """Generate human-readable PROJECT_MAP.md"""
    lines = [
        "# ProShop MERN — Project Map",
        "",
        f"Generated: {datetime.utcnow().isoformat()}Z",
        "Source: `project-index.json` (machine-readable module catalog)",
        "",
        "---",
        ""
    ]

    # Backend section
    lines.extend([
        "## Backend",
        "",
        "**Location:** `backend/`",
        "",
        "### Models",
        ""
    ])

    for model in index.get('backend', {}).get('models', []):
        lines.append(f"- [{model['name']}]({model['file']})")

    lines.extend(["", "### Controllers", ""])
    for controller in index.get('backend', {}).get('controllers', []):
        lines.append(f"- [{controller['name']}]({controller['file']})")

    lines.extend(["", "### Routes", ""])
    total_endpoints = 0
    for route in index.get('backend', {}).get('routes', []):
        endpoints = route['endpoints']
        if isinstance(endpoints, int):
            total_endpoints += endpoints
        lines.append(f"- [{route['name']}]({route['file']}) → `{route['base_path']}` ({endpoints} endpoints)")

    lines.extend([
        "",
        f"**Total Backend Endpoints:** {total_endpoints}",
        ""
    ])

    # Frontend section
    lines.extend([
        "---",
        "",
        "## Frontend",
        "",
        "**Location:** `frontend/src/`",
        "",
        "### Screens",
        ""
    ])

    public_screens = [s for s in index.get('frontend', {}).get('screens', []) if s.get('type') == 'public']
    auth_screens = [s for s in index.get('frontend', {}).get('screens', []) if s.get('type') == 'auth']
    admin_screens = [s for s in index.get('frontend', {}).get('screens', []) if s.get('type') == 'admin']

    if public_screens:
        lines.append("**Public Pages**\n")
        for screen in public_screens:
            lines.append(f"- [{screen['name']}]({screen['file']})")
        lines.append("")

    if auth_screens:
        lines.append("**Authenticated Pages**\n")
        for screen in auth_screens:
            lines.append(f"- [{screen['name']}]({screen['file']})")
        lines.append("")

    if admin_screens:
        lines.append("**Admin Pages**\n")
        for screen in admin_screens:
            lines.append(f"- [{screen['name']}]({screen['file']})")
        lines.append("")

    lines.extend(["", "### Components", ""])
    for component in index.get('frontend', {}).get('components', []):
        lines.append(f"- [{component['name']}]({component['file']})")

    lines.extend(["", "### Redux Domains", ""])
    for domain in index.get('frontend', {}).get('redux_domains', []):
        lines.append(f"- **{domain['name'].title()}**")
        lines.append(f"  - Actions: [`{domain['actions_file']}`]({domain['actions_file']})")
        lines.append(f"  - Reducers: [`{domain['reducers_file']}`]({domain['reducers_file']})")

    # Features section
    features = index.get('features', {})
    lines.extend([
        "",
        "---",
        "",
        "## Features",
        "",
        f"**Total Feature Flags:** {features.get('total_count', 0)}",
        ""
    ])

    by_status = features.get('by_status', {})
    if by_status:
        lines.append("### By Status\n")
        for status, count in sorted(by_status.items()):
            lines.append(f"- **{status}:** {count}")
        lines.append("")

    lines.extend([
        "For detailed feature flag information, see [`features.json`](features.json)",
        ""
    ])

    # MCP Servers section
    lines.extend([
        "---",
        "",
        "## MCP Servers",
        ""
    ])

    for mcp in index.get('mcp_servers', []):
        lines.append(f"### {mcp['name']}")
        lines.append(f"**Location:** `{mcp['path']}`  ")
        lines.append(f"**Language:** {mcp['language']}")
        lines.append(f"\nTools: {', '.join([f'`{t}`' for t in mcp.get('tools', [])])}\n")

    # Documentation section
    lines.extend([
        "---",
        "",
        "## Documentation",
        "",
        "**Location:** `docs/`",
        "",
        "- [ADRs](docs/adr/) — Architecture Decision Records",
        "- [Project Data](docs/project-data/) — API specs, features, runbooks, incidents",
        "- [Archived Docs](docs/archived-2026-05-28/) — Historical references",
        "- [Deferred Docs](docs/deferred-2026-05-28/) — Placeholder templates",
        "",
        "See [`docs/INDEX.md`](docs/INDEX.md) for full documentation navigation.",
        ""
    ])

    lines.extend([
        "---",
        "",
        "For machine-readable module catalog, see [`project-index.json`](project-index.json)",
        ""
    ])

    return "\n".join(lines)


def generate_project_index(verbose=False, dry_run=False):
    """Main function: orchestrate discovery and generate index"""

    if verbose:
        print("[*] Scanning backend/ for models, controllers, routes, middleware...")

    backend = {
        'base_path': 'backend/',
        'language': 'JavaScript (ES Modules)',
        'entry_point': 'backend/server.js',
        'models': find_models(verbose),
        'controllers': find_controllers(verbose),
        'routes': find_routes(verbose),
        'middleware': find_middleware(verbose)
    }

    backend['total_endpoints'] = sum(r['endpoints'] for r in backend['routes'] if isinstance(r['endpoints'], int))

    if verbose:
        print(f"    ✓ Found {len(backend['models'])} models")
        print(f"    ✓ Found {len(backend['controllers'])} controllers")
        print(f"    ✓ Found {len(backend['routes'])} route files")
        print(f"    ✓ Found {len(backend['middleware'])} middleware files")
        print(f"    ✓ Total endpoints: {backend['total_endpoints']}")
        print()

    if verbose:
        print("[*] Scanning frontend/src/ for screens, components, Redux domains...")

    frontend = {
        'base_path': 'frontend/src/',
        'framework': 'React 17 + Redux',
        'screens': find_screens(verbose),
        'components': find_components(verbose),
        'redux_domains': find_redux_domains(verbose)
    }

    if verbose:
        print(f"    ✓ Found {len(frontend['screens'])} screens")
        print(f"    ✓ Found {len(frontend['components'])} components")
        print(f"    ✓ Found {len(frontend['redux_domains'])} Redux domains")
        print()

    if verbose:
        print("[*] Extracting features.json...")

    features_data = load_features(verbose)
    features = {
        'total_count': len(features_data),
        'file': 'features.json',
        'flags': list(features_data.keys())[:10]  # Sample first 10
    }

    if verbose:
        print(f"    ✓ Found {features['total_count']} feature flags")
        print()

    if verbose:
        print("[*] Scanning MCP servers...")

    mcp_servers = find_mcp_servers(verbose)

    if verbose:
        print(f"    ✓ Found {len(mcp_servers)} MCP servers")
        print()

    # Build complete index
    index = {
        'metadata': {
            'version': '1.0',
            'generated_at': datetime.utcnow().isoformat() + 'Z',
            'generated_by': 'update_project_index.py',
            'repository': 'proshop_mern',
            'audit_scope': 'M3-M5 modules'
        },
        'backend': backend,
        'frontend': frontend,
        'features': features,
        'mcp_servers': mcp_servers
    }

    if verbose:
        print("[*] Validating all paths...")

    validation_errors = validate_paths(index)

    if validation_errors:
        print(f"[!] Validation errors found ({len(validation_errors)}):")
        for error in validation_errors[:5]:
            print(f"    {error}")
        if len(validation_errors) > 5:
            print(f"    ... and {len(validation_errors) - 5} more")
    else:
        if verbose:
            print("    ✓ All paths validated")

    if verbose:
        print()

    # Output generation
    if not dry_run:
        # Write project-index.json
        with open(PROJECT_INDEX_FILE, 'w') as f:
            json.dump(index, f, indent=2)

        print(f"[✓] Generated: {PROJECT_INDEX_FILE}")

        # Write PROJECT_MAP.md
        project_map = generate_project_map_md(index)
        with open(PROJECT_MAP_FILE, 'w') as f:
            f.write(project_map)

        print(f"[✓] Generated: {PROJECT_MAP_FILE}")
    else:
        print("[*] DRY-RUN MODE:")
        print(f"    Would generate: {PROJECT_INDEX_FILE}")
        print(f"    Would generate: {PROJECT_MAP_FILE}")

    print()
    print(f"[✓] Index generation complete")
    print(f"    Timestamp: {index['metadata']['generated_at']}")


def main():
    parser = argparse.ArgumentParser(description='Regenerate project-index.json')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be written')
    parser.add_argument('--verbose', action='store_true', help='Show all extracted modules')
    parser.add_argument('--validate-only', action='store_true', help='Validate only, no writes')

    args = parser.parse_args()

    generate_project_index(verbose=args.verbose, dry_run=args.dry_run or args.validate_only)


if __name__ == '__main__':
    main()

# Feature Flags System Specification

**Module:** Feature Flags System (features.json + MCP server)
**File:** `features.json`, `mcp-feature-flags/` (TypeScript)
**Language:** JSON + TypeScript
**Key Dependency:** MCP SDK, Node.js

## Architecture

ProShop uses a 25-flag feature system to control rollout of new features. Flags are defined in `features.json` with:
- **name:** Flag identifier (e.g., `search_v2`, `cart_redesign`)
- **description:** Human-readable purpose
- **status:** `active`, `testing`, `archived`
- **traffic_percentage:** Rollout percentage (0-100)
- **created_date:** When flag was added
- **last_modified:** Last update timestamp

The **mcp-feature-flags** MCP server provides tools for querying and modifying flags programmatically:
- `list_features()` — List all 25 flags with metadata
- `get_feature_info(flag_name)` — Get single flag details
- `set_feature_state(flag_name, state)` — Change active/testing/archived
- `adjust_traffic_rollout(flag_name, percentage)` — Set traffic %

## Features (25 Total)

**Search & Discovery (3 flags):**
- search_v2
- semantic_search
- search_autosuggest

**Cart & Checkout (7 flags):**
- cart_redesign
- save_for_later
- guest_cart_persistence
- express_checkout
- multi_step_checkout_v2
- gift_message
- paypal_express_buttons

**Admin & System (5 flags):**
- admin_dashboard_v2
- bulk_operations
- advanced_analytics
- ab_testing_framework
- api_rate_limiting

**Plus 10 additional flags in various states of rollout**

## Frontend Integration

Flags are fetched via `GET /api/featureFlag` and stored in Redux state (`featureflag` domain). Components check flag status to conditionally render features.

**Pattern:**
```javascript
const { featureFlags } = useSelector(state => state.featureflag)
if (featureFlags?.cart_redesign?.traffic_percentage >= 50) {
  // Show new cart UI
}
```

## MCP Server Tools

All tools available via `feature-flags` MCP server:

| Tool | Purpose | Example |
|------|---------|---------|
| list_features | Get all flags | Returns array of 25 flags |
| get_feature_info | Single flag details | `get_feature_info('cart_redesign')` |
| set_feature_state | Change status | `set_feature_state('cart_redesign', 'testing')` |
| adjust_traffic_rollout | Adjust percentage | `adjust_traffic_rollout('cart_redesign', 75)` |

## File References

- `features.json` — Feature flag definitions (25 flags)
- `mcp-feature-flags/src/server.ts` — MCP server implementation
- `mcp-feature-flags/RUNBOOK.md` — Operational procedures
- `backend/routes/featureFlagRoutes.js` — API endpoint for flag queries
- `frontend/src/actions/featureFlagActions.js` — Redux action creators

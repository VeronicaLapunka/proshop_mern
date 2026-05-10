#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  toText,
  listFeatures,
  getFeatureInfo,
  setFeatureState,
  adjustTrafficRollout,
} from "./helpers.js";

const server = new McpServer({ name: "feature-flags", version: "1.0.0" });

// ---------------------------------------------------------------------------
// Tool 1: list_features
// ---------------------------------------------------------------------------
server.registerTool(
  "list_features",
  {
    description: `
CALL THIS TOOL when the user asks for an overview of all feature flags, wants to
know which features exist, or needs to discover valid feature_id values before
calling another tool. Returns a compact summary for all 25 flags from features.json:
feature_id, name, status, traffic_percentage, last_modified, dependencies[].

DO NOT CALL this tool when the user asks about one specific flag — use
get_feature_info instead (it returns description, targeted_segments,
rollout_strategy, and dependency_states which this tool omits).

CAVEATS: Reads features.json on every call. No caching. If the file is missing
or malformed, returns { error, message } — do not retry silently, report the error.

EXAMPLES:
1. "List all feature flags." → list_features()
2. "Which features are in Testing?" → list_features(), then filter by status='Testing'
3. "What feature IDs can I use?" → list_features()
`.trim(),
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  async () => toText(listFeatures()),
);

// ---------------------------------------------------------------------------
// Tool 2: get_feature_info
// ---------------------------------------------------------------------------
server.registerTool(
  "get_feature_info",
  {
    description: `
CALL THIS TOOL when you need the full detail of a single feature flag: description,
status, traffic_percentage, targeted_segments, rollout_strategy, last_modified, and
a dependency_states map showing the live status of every dependency. You MUST call
this before deciding whether set_feature_state to 'Enabled' is safe — dependency
states are only available here.

DO NOT CALL this tool to discover all available feature IDs or get an overview of
all flags — use list_features instead (one call, all flags, less context used).

CAVEATS: Reads features.json on every call. Returns FEATURE_NOT_FOUND if the
feature_id key does not exist — check spelling and use list_features to confirm
valid IDs. feature_id is snake_case and case-sensitive (e.g. 'dark_mode', not 'Dark_Mode').

EXAMPLES:
1. "What is the status of dark_mode?" → get_feature_info({ feature_id: "dark_mode" })
2. "Does semantic_search have its dependencies met?" → get_feature_info({ feature_id: "semantic_search" })
3. "Show full details on cart_redesign." → get_feature_info({ feature_id: "cart_redesign" })
`.trim(),
    inputSchema: {
      feature_id: z
        .string()
        .describe(
          "snake_case key exactly as it appears in features.json, e.g. 'dark_mode'. Case-sensitive.",
        ),
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  async ({ feature_id }) => toText(getFeatureInfo(feature_id)),
);

// ---------------------------------------------------------------------------
// Tool 3: set_feature_state
// ---------------------------------------------------------------------------
server.registerTool(
  "set_feature_state",
  {
    description: `
CALL THIS TOOL to change a feature's status to 'Disabled', 'Testing', or 'Enabled'.
This is the correct tool for kill-switch activation, canary promotion, and A/B test
setup. The tool automatically adjusts traffic_percentage and updates last_modified.

STATE TRANSITION RULES (enforced in code, not just documentation):
  → 'Disabled' : traffic_percentage is set to 0.
  → 'Enabled'  : traffic_percentage is set to 100.
                  BLOCKED (DEPENDENCY_NOT_ENABLED) if any dependency is Disabled.
                  WARNS (non-blocking) if any dependency is Testing, not Enabled.
  → 'Testing'  : traffic_percentage is preserved if already 1–99, otherwise reset to 10.
                  WARNS if any dependency is not Enabled.

DO NOT CALL this tool if you only want to change traffic percentage without changing
status — use adjust_traffic_rollout instead (it is designed for canary ladder steps).
DO NOT CALL this tool just to read current state — use get_feature_info.

CAVEATS: state is case-sensitive: 'Disabled' | 'Testing' | 'Enabled'. Passing
'enabled' or 'ENABLED' returns INVALID_STATE. Writes to features.json atomically
(temp file + rename). Changes are immediately visible via GET /api/feature-flags.

EXAMPLES:
1. "Disable Stripe — webhook bug detected."
   → set_feature_state({ feature_id: "stripe_alternative", state: "Disabled" })
2. "Promote search_v2 to Enabled."
   → set_feature_state({ feature_id: "search_v2", state: "Enabled" })
3. "Start A/B testing dark_mode."
   → set_feature_state({ feature_id: "dark_mode", state: "Testing" })
`.trim(),
    inputSchema: {
      feature_id: z.string().describe("snake_case feature key, e.g. 'dark_mode'. Case-sensitive."),
      state: z
        .enum(["Disabled", "Testing", "Enabled"])
        .describe(
          "Target status — MUST be exactly one of: 'Disabled', 'Testing', 'Enabled' (case-sensitive).",
        ),
    },
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  async ({ feature_id, state }) => toText(setFeatureState(feature_id, state)),
);

// ---------------------------------------------------------------------------
// Tool 4: adjust_traffic_rollout
// ---------------------------------------------------------------------------
server.registerTool(
  "adjust_traffic_rollout",
  {
    description: `
CALL THIS TOOL to change traffic_percentage for a feature that is already in
'Testing' status. Use this for canary ladder steps (5→25→50→100%) and A/B test
adjustments. Does not change status. Always updates last_modified. Returns a hint
when percentage reaches 0 or 100 suggesting the next action via set_feature_state.

YOU MUST ensure the feature is in 'Testing' status before calling this tool.
If it is 'Disabled' or 'Enabled', this call will fail with WRONG_STATUS_FOR_ROLLOUT.
Call set_feature_state({ state: 'Testing' }) first, then adjust_traffic_rollout.

DO NOT CALL this tool to fully enable or fully disable a feature — use
set_feature_state instead (it handles status + traffic in one atomic operation).
DO NOT CALL this tool on features not in 'Testing' status.

CAVEATS: percentage must be a whole integer 0–100. Decimals (e.g. 33.3) are
rejected with INVALID_PERCENTAGE. Writes atomically; changes visible immediately
via GET /api/feature-flags.

EXAMPLES:
1. "Expand dark_mode test from 20% to 50%."
   → adjust_traffic_rollout({ feature_id: "dark_mode", percentage: 50 })
2. "Roll back search_v2 to 5% — latency regression."
   → adjust_traffic_rollout({ feature_id: "search_v2", percentage: 5 })
3. "Set product_recommendations to 100% before promoting to Enabled."
   → adjust_traffic_rollout({ feature_id: "product_recommendations", percentage: 100 })
`.trim(),
    inputSchema: {
      feature_id: z
        .string()
        .describe("snake_case feature key, e.g. 'dark_mode'. Feature MUST be in 'Testing' status."),
      percentage: z
        .number()
        .int()
        .min(0)
        .max(100)
        .describe("Whole integer 0–100 inclusive. Decimals are rejected."),
    },
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  async ({ feature_id, percentage }) => toText(adjustTrafficRollout(feature_id, percentage)),
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const transport = new StdioServerTransport();
await server.connect(transport);

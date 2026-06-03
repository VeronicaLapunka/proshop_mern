/**
 * Unit tests for the mcp-feature-flags MCP server.
 *
 * Each of the four MCP tools (list_features, get_feature_info,
 * set_feature_state, adjust_traffic_rollout) is registered in server.ts
 * as a thin async wrapper around the corresponding helper:
 *
 *     async () => toText(listFeatures())
 *     async ({ feature_id }) => toText(getFeatureInfo(feature_id))
 *     async ({ feature_id, state }) => toText(setFeatureState(feature_id, state))
 *     async ({ feature_id, percentage }) => toText(adjustTrafficRollout(feature_id, percentage))
 *
 * Therefore, exercising the helpers fully covers the tool behaviour.
 * We mock node:fs so no real features.json is ever touched.
 */

import { jest } from "@jest/globals";

// ---------------------------------------------------------------------------
// Mock node:fs BEFORE importing helpers (helpers reads FEATURES_PATH at import)
// ---------------------------------------------------------------------------
const mockReadFileSync = jest.fn<(p: string, enc: string) => string>();
const mockWriteFileSync = jest.fn<(p: string, data: string, enc: string) => void>();
const mockRenameSync = jest.fn<(from: string, to: string) => void>();
const mockUnlinkSync = jest.fn<(p: string) => void>();

jest.unstable_mockModule("node:fs", () => ({
  default: {
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    renameSync: mockRenameSync,
    unlinkSync: mockUnlinkSync,
  },
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  renameSync: mockRenameSync,
  unlinkSync: mockUnlinkSync,
}));

// Dynamic import after the mock is registered
const helpers = await import("../helpers.js");
const {
  listFeatures,
  getFeatureInfo,
  setFeatureState,
  adjustTrafficRollout,
  toText,
  errObj,
} = helpers;

// ---------------------------------------------------------------------------
// Test fixtures — realistic feature flag data mirroring features.json
// ---------------------------------------------------------------------------
type FeaturesFile = Record<string, {
  name: string;
  description?: string;
  status: "Disabled" | "Testing" | "Enabled";
  traffic_percentage: number;
  last_modified: string;
  targeted_segments?: string[];
  rollout_strategy?: string;
  dependencies?: string[];
}>;

const buildFixture = (): FeaturesFile => ({
  search_v2: {
    name: "New Search Algorithm",
    description: "BM25 + TF-IDF ranking",
    status: "Disabled",
    traffic_percentage: 0,
    last_modified: "2026-05-29",
    targeted_segments: ["beta_users"],
    rollout_strategy: "canary",
  },
  semantic_search: {
    name: "Semantic Vector Search",
    description: "Embeddings + cosine similarity",
    status: "Testing",
    traffic_percentage: 10,
    last_modified: "2026-05-29",
    targeted_segments: ["internal"],
    rollout_strategy: "canary",
    dependencies: ["search_v2"],
  },
  dark_mode: {
    name: "Dark Mode Theme",
    status: "Enabled",
    traffic_percentage: 100,
    last_modified: "2026-05-29",
    targeted_segments: ["all"],
    rollout_strategy: "ab_test",
  },
  cart_redesign: {
    name: "Redesigned Cart UI",
    status: "Testing",
    traffic_percentage: 50,
    last_modified: "2026-05-29",
    targeted_segments: ["beta_users"],
    rollout_strategy: "ab_test",
  },
  save_for_later: {
    name: "Save Items for Later",
    status: "Disabled",
    traffic_percentage: 0,
    last_modified: "2026-02-28",
    targeted_segments: ["authenticated"],
    rollout_strategy: "canary",
    dependencies: ["cart_redesign"],
  },
  gift_message: {
    name: "Gift Message at Checkout",
    status: "Enabled",
    traffic_percentage: 100,
    last_modified: "2026-05-29",
    targeted_segments: ["all"],
    rollout_strategy: "full_release",
  },
});

/** Captures the JSON written to the tmp file via writeFileSync. */
const lastWritten = (): FeaturesFile => {
  const calls = mockWriteFileSync.mock.calls;
  if (calls.length === 0) throw new Error("writeFileSync was never called");
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[1] as string) as FeaturesFile;
};

/** Helper: arrange mockReadFileSync to return a fresh fixture each call. */
const armReadWith = (data: FeaturesFile) => {
  mockReadFileSync.mockImplementation(() => JSON.stringify(data));
};

beforeEach(() => {
  mockReadFileSync.mockReset();
  mockWriteFileSync.mockReset();
  mockRenameSync.mockReset();
  mockUnlinkSync.mockReset();
});

// ===========================================================================
// toText / errObj — response shape primitives
// ===========================================================================
describe("toText", () => {
  test("wraps object into MCP content array with stringified JSON", () => {
    const result = toText({ hello: "world", n: 42 });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ hello: "world", n: 42 });
  });
});

describe("errObj", () => {
  test("returns error+message only when feature_id is omitted", () => {
    expect(errObj("CODE_X", "msg")).toEqual({ error: "CODE_X", message: "msg" });
  });

  test("includes feature_id field when provided", () => {
    expect(errObj("CODE_X", "msg", "dark_mode")).toEqual({
      error: "CODE_X",
      message: "msg",
      feature_id: "dark_mode",
    });
  });
});

// ===========================================================================
// list_features
// ===========================================================================
describe("list_features tool", () => {
  test("returns_total_count_and_compact_feature_summaries_on_happy_path", () => {
    armReadWith(buildFixture());
    const result = listFeatures() as { total: number; features: any[] };

    expect(result.total).toBe(6);
    expect(result.features).toHaveLength(6);

    const darkMode = result.features.find((f: any) => f.feature_id === "dark_mode");
    expect(darkMode).toEqual({
      feature_id: "dark_mode",
      name: "Dark Mode Theme",
      status: "Enabled",
      traffic_percentage: 100,
      last_modified: "2026-05-29",
      dependencies: [],
    });
  });

  test("includes_dependencies_array_for_flags_that_declare_them", () => {
    armReadWith(buildFixture());
    const result = listFeatures() as { features: any[] };
    const semantic = result.features.find((f: any) => f.feature_id === "semantic_search");
    expect(semantic.dependencies).toEqual(["search_v2"]);
  });

  test("does_not_include_description_or_targeted_segments_in_summary", () => {
    armReadWith(buildFixture());
    const result = listFeatures() as { features: any[] };
    const item = result.features[0];
    expect(item).not.toHaveProperty("description");
    expect(item).not.toHaveProperty("targeted_segments");
    expect(item).not.toHaveProperty("rollout_strategy");
  });

  test("returns_empty_list_with_total_zero_when_features_file_is_empty_object", () => {
    armReadWith({});
    const result = listFeatures() as { total: number; features: any[] };
    expect(result.total).toBe(0);
    expect(result.features).toEqual([]);
  });

  test("returns_FILE_READ_ERROR_when_features_json_missing", () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error("ENOENT: no such file or directory, open 'features.json'");
    });
    const result = listFeatures() as { error: string; message: string };
    expect(result.error).toBe("FILE_READ_ERROR");
    expect(result.message).toContain("ENOENT");
  });

  test("returns_JSON_PARSE_ERROR_when_features_json_is_corrupted", () => {
    mockReadFileSync.mockImplementation(() => "{this is not: valid json,,,}");
    const result = listFeatures() as { error: string; message: string };
    expect(result.error).toBe("JSON_PARSE_ERROR");
    expect(typeof result.message).toBe("string");
    expect(result.message.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// get_feature_info
// ===========================================================================
describe("get_feature_info tool", () => {
  test("returns_full_record_with_dependency_states_on_happy_path", () => {
    armReadWith(buildFixture());
    const result = getFeatureInfo("semantic_search") as any;

    expect(result.feature_id).toBe("semantic_search");
    expect(result.name).toBe("Semantic Vector Search");
    expect(result.status).toBe("Testing");
    expect(result.traffic_percentage).toBe(10);
    expect(result.dependencies).toEqual(["search_v2"]);
    expect(result.dependency_states).toEqual({ search_v2: "Disabled" });
  });

  test("returns_empty_dependency_states_for_flag_without_dependencies", () => {
    armReadWith(buildFixture());
    const result = getFeatureInfo("dark_mode") as any;
    expect(result.dependency_states).toEqual({});
  });

  test("returns_FEATURE_NOT_FOUND_when_flag_name_is_unknown", () => {
    armReadWith(buildFixture());
    const result = getFeatureInfo("nonexistent_flag") as any;

    expect(result.error).toBe("FEATURE_NOT_FOUND");
    expect(result.feature_id).toBe("nonexistent_flag");
    expect(result.message).toBe(
      "No feature with ID 'nonexistent_flag' exists in features.json.",
    );
  });

  test("is_case_sensitive_and_rejects_DARK_MODE_when_only_dark_mode_exists", () => {
    armReadWith(buildFixture());
    const result = getFeatureInfo("DARK_MODE") as any;
    expect(result.error).toBe("FEATURE_NOT_FOUND");
  });

  test("returns_FILE_READ_ERROR_and_preserves_feature_id_on_io_failure", () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error("EACCES: permission denied");
    });
    const result = getFeatureInfo("dark_mode") as any;
    expect(result.error).toBe("FILE_READ_ERROR");
    expect(result.feature_id).toBe("dark_mode");
    expect(result.message).toContain("EACCES");
  });

  // ---- SECURITY TESTS ----
  test("security_rejects_path_traversal_string_as_unknown_feature_not_as_file_path", () => {
    armReadWith(buildFixture());
    const result = getFeatureInfo("../../../etc/passwd") as any;
    // The string is treated as a plain object key, never as a path.
    expect(result.error).toBe("FEATURE_NOT_FOUND");
    expect(result.feature_id).toBe("../../../etc/passwd");
    // No additional file reads were triggered.
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
  });

  test("security_rejects_prototype_pollution_key_as_FEATURE_NOT_FOUND", () => {
    armReadWith(buildFixture());
    const result = getFeatureInfo("__proto__") as any;
    // Object.entries / direct lookup should not surface inherited Object.prototype.
    // Either FEATURE_NOT_FOUND or a record without a real status — but it must
    // never look like a valid feature with a status of 'Enabled'.
    if (result.error) {
      expect(result.error).toBe("FEATURE_NOT_FOUND");
    } else {
      expect(result.status).toBeUndefined();
    }
  });

  test("security_handles_oversized_flag_name_payload_without_crashing", () => {
    armReadWith(buildFixture());
    const huge = "a".repeat(10_000);
    const result = getFeatureInfo(huge) as any;
    expect(result.error).toBe("FEATURE_NOT_FOUND");
    // Error message echoes input — verify it didn't blow up serialization.
    expect(result.feature_id).toBe(huge);
  });
});

// ===========================================================================
// set_feature_state
// ===========================================================================
describe("set_feature_state tool", () => {
  test("transitions_disabled_flag_to_enabled_and_sets_traffic_to_100", () => {
    const fix = buildFixture();
    armReadWith(fix);
    // search_v2 has no dependencies, so Enabling it is allowed.
    const result = setFeatureState("search_v2", "Enabled") as any;

    expect(result.feature_id).toBe("search_v2");
    expect(result.status).toBe("Enabled");
    expect(result.traffic_percentage).toBe(100);
    expect(result.warnings).toEqual([]);

    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    expect(mockRenameSync).toHaveBeenCalledTimes(1);
    const written = lastWritten();
    expect(written.search_v2.status).toBe("Enabled");
    expect(written.search_v2.traffic_percentage).toBe(100);
  });

  test("transitions_enabled_flag_to_disabled_and_zeroes_traffic", () => {
    armReadWith(buildFixture());
    const result = setFeatureState("dark_mode", "Disabled") as any;

    expect(result.status).toBe("Disabled");
    expect(result.traffic_percentage).toBe(0);
    expect(lastWritten().dark_mode.traffic_percentage).toBe(0);
  });

  test("preserves_traffic_percentage_when_transitioning_to_Testing_with_value_between_1_and_99", () => {
    const fix = buildFixture();
    fix.search_v2.traffic_percentage = 37;
    armReadWith(fix);
    const result = setFeatureState("search_v2", "Testing") as any;

    expect(result.status).toBe("Testing");
    expect(result.traffic_percentage).toBe(37);
  });

  test("resets_traffic_to_10_when_transitioning_to_Testing_from_zero", () => {
    armReadWith(buildFixture()); // search_v2 starts at 0
    const result = setFeatureState("search_v2", "Testing") as any;
    expect(result.traffic_percentage).toBe(10);
  });

  test("resets_traffic_to_10_when_transitioning_to_Testing_from_100", () => {
    armReadWith(buildFixture()); // dark_mode = 100
    const result = setFeatureState("dark_mode", "Testing") as any;
    expect(result.traffic_percentage).toBe(10);
  });

  test("BLOCKS_enabling_when_a_dependency_is_Disabled_and_returns_DEPENDENCY_NOT_ENABLED", () => {
    armReadWith(buildFixture());
    // save_for_later depends on cart_redesign (Testing) — NOT disabled here,
    // so we need a flag whose dep IS disabled. semantic_search depends on
    // search_v2 (Disabled in fixture).
    const result = setFeatureState("semantic_search", "Enabled") as any;

    expect(result.error).toBe("DEPENDENCY_NOT_ENABLED");
    expect(result.feature_id).toBe("semantic_search");
    expect(result.message).toContain("'search_v2'");
    expect(result.message).toContain("Disabled");
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  test("WARNS_but_does_not_block_when_enabling_with_dependency_in_Testing", () => {
    const fix = buildFixture();
    fix.search_v2.status = "Testing"; // semantic_search dep now Testing, not Disabled
    armReadWith(fix);
    const result = setFeatureState("semantic_search", "Enabled") as any;

    expect(result.status).toBe("Enabled");
    expect(result.traffic_percentage).toBe(100);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("'search_v2' is 'Testing', not 'Enabled'");
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
  });

  test("WARNS_when_moving_to_Testing_with_dependency_not_Enabled", () => {
    armReadWith(buildFixture()); // semantic_search dep search_v2 is Disabled
    const result = setFeatureState("semantic_search", "Testing") as any;

    expect(result.status).toBe("Testing");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Dependency 'search_v2' is 'Disabled'");
  });

  test("returns_INVALID_STATE_for_lowercase_enabled", () => {
    armReadWith(buildFixture());
    const result = setFeatureState("dark_mode", "enabled") as any;
    expect(result.error).toBe("INVALID_STATE");
    expect(result.message).toContain("State 'enabled' is not valid");
    expect(result.feature_id).toBe("dark_mode");
    // Should reject WITHOUT touching the file at all.
    expect(mockReadFileSync).not.toHaveBeenCalled();
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  test("returns_INVALID_STATE_for_arbitrary_string", () => {
    armReadWith(buildFixture());
    const result = setFeatureState("dark_mode", "FullyOperational") as any;
    expect(result.error).toBe("INVALID_STATE");
  });

  test("returns_INVALID_STATE_for_empty_string", () => {
    const result = setFeatureState("dark_mode", "") as any;
    expect(result.error).toBe("INVALID_STATE");
  });

  test("returns_FEATURE_NOT_FOUND_when_flag_name_is_unknown", () => {
    armReadWith(buildFixture());
    const result = setFeatureState("ghost_flag", "Enabled") as any;
    expect(result.error).toBe("FEATURE_NOT_FOUND");
    expect(result.feature_id).toBe("ghost_flag");
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  test("updates_last_modified_to_today_in_ISO_date_format", () => {
    armReadWith(buildFixture());
    const result = setFeatureState("search_v2", "Enabled") as any;
    const todayISO = new Date().toISOString().slice(0, 10);
    expect(result.last_modified).toBe(todayISO);
    expect(result.last_modified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("uses_atomic_temp_file_then_rename_pattern_on_write", () => {
    armReadWith(buildFixture());
    setFeatureState("search_v2", "Enabled");

    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    expect(mockRenameSync).toHaveBeenCalledTimes(1);

    const tmpPath = mockWriteFileSync.mock.calls[0][0] as string;
    const renameFrom = mockRenameSync.mock.calls[0][0] as string;
    const renameTo = mockRenameSync.mock.calls[0][1] as string;

    // Temp file path must include the .tmp suffix
    expect(tmpPath).toContain(".features-");
    expect(tmpPath).toMatch(/\.tmp$/);
    // The rename moves the temp file to the final destination
    expect(renameFrom).toBe(tmpPath);
    expect(renameTo).not.toMatch(/\.tmp$/);
  });

  test("returns_FILE_WRITE_ERROR_and_unlinks_tmp_when_rename_fails", () => {
    armReadWith(buildFixture());
    mockRenameSync.mockImplementation(() => {
      throw new Error("EXDEV: cross-device link not permitted");
    });

    const result = setFeatureState("search_v2", "Enabled") as any;
    expect(result.error).toBe("FILE_WRITE_ERROR");
    expect(result.message).toContain("EXDEV");
    expect(result.feature_id).toBe("search_v2");
    expect(mockUnlinkSync).toHaveBeenCalledTimes(1);
  });

  // ---- SECURITY TESTS ----
  test("security_rejects_path_traversal_flag_name_as_FEATURE_NOT_FOUND_and_does_not_write", () => {
    armReadWith(buildFixture());
    const result = setFeatureState("../../etc/passwd", "Enabled") as any;
    expect(result.error).toBe("FEATURE_NOT_FOUND");
    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(mockRenameSync).not.toHaveBeenCalled();
  });

  test("security_rejects_injection_style_flag_name_with_newlines_and_quotes", () => {
    armReadWith(buildFixture());
    const malicious = "dark_mode\",\"injected\":\"yes";
    const result = setFeatureState(malicious, "Enabled") as any;
    expect(result.error).toBe("FEATURE_NOT_FOUND");
    expect(result.feature_id).toBe(malicious);
    // dark_mode itself should be untouched.
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// adjust_traffic_rollout
// ===========================================================================
describe("adjust_traffic_rollout tool", () => {
  test("sets_traffic_to_50_for_flag_in_Testing_status_on_happy_path", () => {
    armReadWith(buildFixture());
    const result = adjustTrafficRollout("cart_redesign", 50) as any;

    expect(result.feature_id).toBe("cart_redesign");
    expect(result.status).toBe("Testing");
    expect(result.traffic_percentage).toBe(50);
    expect(result.hint).toBeNull();
    expect(lastWritten().cart_redesign.traffic_percentage).toBe(50);
  });

  test("accepts_boundary_value_0_and_returns_hint_to_call_set_feature_state_Disabled", () => {
    armReadWith(buildFixture());
    const result = adjustTrafficRollout("cart_redesign", 0) as any;
    expect(result.traffic_percentage).toBe(0);
    expect(result.hint).toContain("set_feature_state");
    expect(result.hint).toContain("Disabled");
    expect(result.hint).toContain("cart_redesign");
  });

  test("accepts_boundary_value_100_and_returns_hint_to_promote_to_Enabled", () => {
    armReadWith(buildFixture());
    const result = adjustTrafficRollout("cart_redesign", 100) as any;
    expect(result.traffic_percentage).toBe(100);
    expect(result.hint).toContain("set_feature_state");
    expect(result.hint).toContain("Enabled");
  });

  test("rejects_negative_percentage_with_INVALID_PERCENTAGE", () => {
    const result = adjustTrafficRollout("cart_redesign", -1) as any;
    expect(result.error).toBe("INVALID_PERCENTAGE");
    expect(result.message).toContain("between 0 and 100");
    expect(result.message).toContain("-1");
    // No file access at all on validation failure.
    expect(mockReadFileSync).not.toHaveBeenCalled();
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  test("rejects_percentage_above_100_with_INVALID_PERCENTAGE", () => {
    const result = adjustTrafficRollout("cart_redesign", 101) as any;
    expect(result.error).toBe("INVALID_PERCENTAGE");
    expect(result.message).toContain("101");
  });

  test("rejects_decimal_percentage_with_INVALID_PERCENTAGE", () => {
    const result = adjustTrafficRollout("cart_redesign", 33.3) as any;
    expect(result.error).toBe("INVALID_PERCENTAGE");
    expect(result.message).toContain("33.3");
  });

  test("rejects_NaN_percentage_with_INVALID_PERCENTAGE", () => {
    const result = adjustTrafficRollout("cart_redesign", Number.NaN) as any;
    expect(result.error).toBe("INVALID_PERCENTAGE");
  });

  test("rejects_Infinity_percentage_with_INVALID_PERCENTAGE", () => {
    const result = adjustTrafficRollout("cart_redesign", Number.POSITIVE_INFINITY) as any;
    expect(result.error).toBe("INVALID_PERCENTAGE");
  });

  test("returns_FEATURE_NOT_FOUND_for_unknown_flag", () => {
    armReadWith(buildFixture());
    const result = adjustTrafficRollout("ghost_flag", 25) as any;
    expect(result.error).toBe("FEATURE_NOT_FOUND");
    expect(result.feature_id).toBe("ghost_flag");
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  test("returns_WRONG_STATUS_FOR_ROLLOUT_when_flag_is_Enabled", () => {
    armReadWith(buildFixture()); // dark_mode = Enabled
    const result = adjustTrafficRollout("dark_mode", 25) as any;
    expect(result.error).toBe("WRONG_STATUS_FOR_ROLLOUT");
    expect(result.feature_id).toBe("dark_mode");
    expect(result.message).toContain("'Enabled'");
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  test("returns_WRONG_STATUS_FOR_ROLLOUT_when_flag_is_Disabled", () => {
    armReadWith(buildFixture()); // search_v2 = Disabled
    const result = adjustTrafficRollout("search_v2", 25) as any;
    expect(result.error).toBe("WRONG_STATUS_FOR_ROLLOUT");
    expect(result.message).toContain("'Disabled'");
  });

  test("updates_last_modified_to_today_on_successful_adjust", () => {
    armReadWith(buildFixture());
    const result = adjustTrafficRollout("cart_redesign", 25) as any;
    const todayISO = new Date().toISOString().slice(0, 10);
    expect(result.last_modified).toBe(todayISO);
  });

  test("returns_FILE_WRITE_ERROR_with_feature_id_when_write_fails", () => {
    armReadWith(buildFixture());
    mockWriteFileSync.mockImplementation(() => {
      throw new Error("ENOSPC: no space left on device");
    });
    const result = adjustTrafficRollout("cart_redesign", 25) as any;
    expect(result.error).toBe("FILE_WRITE_ERROR");
    expect(result.message).toContain("ENOSPC");
    expect(result.feature_id).toBe("cart_redesign");
  });

  // ---- SECURITY TESTS ----
  test("security_rejects_path_traversal_flag_name", () => {
    armReadWith(buildFixture());
    const result = adjustTrafficRollout("../../../etc/passwd", 50) as any;
    expect(result.error).toBe("FEATURE_NOT_FOUND");
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Cross-cutting: independence between successive calls
// ===========================================================================
describe("cross-cutting behaviour", () => {
  test("two_successive_set_feature_state_calls_each_read_fresh_state", () => {
    armReadWith(buildFixture());
    setFeatureState("search_v2", "Testing");
    setFeatureState("cart_redesign", "Disabled");
    // Both writes should have happened, each preceded by a read.
    expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    expect(mockWriteFileSync).toHaveBeenCalledTimes(2);
    expect(mockRenameSync).toHaveBeenCalledTimes(2);
  });

  test("a_read_only_list_features_call_never_invokes_writeFileSync", () => {
    armReadWith(buildFixture());
    listFeatures();
    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(mockRenameSync).not.toHaveBeenCalled();
  });

  test("a_read_only_get_feature_info_call_never_invokes_writeFileSync", () => {
    armReadWith(buildFixture());
    getFeatureInfo("dark_mode");
    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(mockRenameSync).not.toHaveBeenCalled();
  });
});

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// features.json lives at the project root — two levels up from src/
export const FEATURES_PATH = process.env.FEATURES_JSON_PATH ??
    path.resolve(__dirname, "../../features.json");
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export const VALID_STATES = ["Disabled", "Testing", "Enabled"];
// ---------------------------------------------------------------------------
// I/O helpers
// ---------------------------------------------------------------------------
export function readFeatures() {
    let raw;
    try {
        raw = fs.readFileSync(FEATURES_PATH, "utf-8");
    }
    catch (e) {
        throw { code: "FILE_READ_ERROR", message: e instanceof Error ? e.message : String(e) };
    }
    try {
        return JSON.parse(raw);
    }
    catch (e) {
        throw { code: "JSON_PARSE_ERROR", message: e instanceof Error ? e.message : String(e) };
    }
}
/** Atomic write: write to a temp file, then rename to prevent corruption. */
export function writeFeatures(features) {
    const dir = path.dirname(FEATURES_PATH);
    const tmp = path.join(dir, `.features-${Date.now()}.tmp`);
    try {
        fs.writeFileSync(tmp, JSON.stringify(features, null, 2) + "\n", "utf-8");
        fs.renameSync(tmp, FEATURES_PATH);
    }
    catch (e) {
        try {
            fs.unlinkSync(tmp);
        }
        catch { /* ignore */ }
        throw { code: "FILE_WRITE_ERROR", message: e instanceof Error ? e.message : String(e) };
    }
}
export function today() {
    return new Date().toISOString().slice(0, 10);
}
export function toText(obj) {
    return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}
export function errObj(code, message, feature_id) {
    return feature_id !== undefined
        ? { error: code, message, feature_id }
        : { error: code, message };
}
// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------
/**
 * Returns a summary list of all feature flags.
 * Fields: feature_id, name, status, traffic_percentage, last_modified, dependencies.
 */
export function listFeatures() {
    let features;
    try {
        features = readFeatures();
    }
    catch (e) {
        const { code, message } = e;
        return errObj(code, message);
    }
    const items = Object.entries(features).map(([feature_id, f]) => ({
        feature_id,
        name: f.name,
        status: f.status,
        traffic_percentage: f.traffic_percentage,
        last_modified: f.last_modified,
        dependencies: f.dependencies ?? [],
    }));
    return { total: items.length, features: items };
}
/**
 * Returns the full state of a single feature flag, including the
 * current status of each of its dependencies.
 */
export function getFeatureInfo(feature_id) {
    let features;
    try {
        features = readFeatures();
    }
    catch (e) {
        const { code, message } = e;
        return errObj(code, message, feature_id);
    }
    const feat = features[feature_id];
    if (!feat) {
        return errObj("FEATURE_NOT_FOUND", `No feature with ID '${feature_id}' exists in features.json.`, feature_id);
    }
    const dependency_states = {};
    for (const dep of feat.dependencies ?? []) {
        if (features[dep])
            dependency_states[dep] = features[dep].status;
    }
    return { feature_id, ...feat, dependency_states };
}
/**
 * Changes the status of a feature flag.
 *
 * Side effects per spec:
 *   Disabled → traffic_percentage = 0
 *   Enabled  → traffic_percentage = 100; BLOCKED if any dependency is Disabled
 *   Testing  → traffic_percentage unchanged if already 1–99, else reset to 10
 *              WARN (non-blocking) if any dependency is not Enabled
 *
 * Always updates last_modified.
 */
export function setFeatureState(feature_id, state) {
    if (!VALID_STATES.includes(state)) {
        return errObj("INVALID_STATE", `State '${state}' is not valid. Must be one of: Disabled, Testing, Enabled (case-sensitive).`, feature_id);
    }
    let features;
    try {
        features = readFeatures();
    }
    catch (e) {
        const { code, message } = e;
        return errObj(code, message, feature_id);
    }
    const feat = features[feature_id];
    if (!feat) {
        return errObj("FEATURE_NOT_FOUND", `No feature with ID '${feature_id}' exists in features.json.`, feature_id);
    }
    const deps = feat.dependencies ?? [];
    const warnings = [];
    if (state === "Enabled") {
        // BLOCK: cannot enable if any dependency is Disabled
        const disabledDeps = deps.filter((d) => features[d]?.status === "Disabled");
        if (disabledDeps.length > 0) {
            return errObj("DEPENDENCY_NOT_ENABLED", `Cannot enable '${feature_id}': ${disabledDeps.map((d) => `'${d}'`).join(", ")} ` +
                `is Disabled. Enable the dependency first.`, feature_id);
        }
        // WARN: dependencies exist but are only in Testing
        for (const dep of deps) {
            if (features[dep]?.status !== "Enabled") {
                warnings.push(`Dependency '${dep}' is '${features[dep]?.status}', not 'Enabled'. ` +
                    `'${feature_id}' may not function correctly.`);
            }
        }
    }
    else if (state === "Testing") {
        // WARN: any dependency not yet Enabled
        for (const dep of deps) {
            if (features[dep]?.status !== "Enabled") {
                warnings.push(`Dependency '${dep}' is '${features[dep]?.status}', not 'Enabled'. ` +
                    `'${feature_id}' may not function correctly.`);
            }
        }
    }
    // Apply state transition
    feat.status = state;
    feat.traffic_percentage =
        state === "Disabled" ? 0
            : state === "Enabled" ? 100
                : feat.traffic_percentage >= 1 && feat.traffic_percentage <= 99
                    ? feat.traffic_percentage
                    : 10;
    feat.last_modified = today();
    try {
        writeFeatures(features);
    }
    catch (e) {
        const { code, message } = e;
        return errObj(code, message, feature_id);
    }
    return {
        feature_id,
        name: feat.name,
        status: feat.status,
        traffic_percentage: feat.traffic_percentage,
        last_modified: feat.last_modified,
        warnings,
    };
}
/**
 * Adjusts traffic_percentage for a feature that is in 'Testing' status.
 * Does not change the status itself.
 * Includes hints at 0% and 100% to guide the caller toward set_feature_state.
 */
export function adjustTrafficRollout(feature_id, percentage) {
    if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) {
        return errObj("INVALID_PERCENTAGE", `percentage must be a whole number between 0 and 100. Got: ${percentage}.`, feature_id);
    }
    let features;
    try {
        features = readFeatures();
    }
    catch (e) {
        const { code, message } = e;
        return errObj(code, message, feature_id);
    }
    const feat = features[feature_id];
    if (!feat) {
        return errObj("FEATURE_NOT_FOUND", `No feature with ID '${feature_id}' exists in features.json.`, feature_id);
    }
    if (feat.status !== "Testing") {
        return errObj("WRONG_STATUS_FOR_ROLLOUT", `adjust_traffic_rollout can only be called on features with status 'Testing'. ` +
            `'${feature_id}' is currently '${feat.status}'. Use set_feature_state to change its status first.`, feature_id);
    }
    feat.traffic_percentage = percentage;
    feat.last_modified = today();
    const hint = percentage === 0
        ? `Traffic is now 0%. Consider calling set_feature_state('${feature_id}', 'Disabled') to formally disable it.`
        : percentage === 100
            ? `Traffic is at 100%. Consider promoting '${feature_id}' to 'Enabled' via set_feature_state.`
            : null;
    try {
        writeFeatures(features);
    }
    catch (e) {
        const { code, message } = e;
        return errObj(code, message, feature_id);
    }
    return {
        feature_id,
        name: feat.name,
        status: feat.status,
        traffic_percentage: feat.traffic_percentage,
        last_modified: feat.last_modified,
        hint,
    };
}

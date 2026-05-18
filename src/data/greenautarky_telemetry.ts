import type { HomeAssistant } from "../types";

/**
 * Privacy Tier model — see ga-ihost-docs/PRIVACY_TIERS.md.
 *
 * Tier 1 (Fehlerberichte) — default ON, opt-out.
 *   Legal basis: Art. 6 (f) DSGVO — berechtigtes Interesse.
 *   Storage canonical key: `tier1`. Legacy alias: `error_logs`.
 *
 * Tier 2 (Metriken)       — default OFF, opt-in.
 *   Legal basis: Art. 6 (a) DSGVO — Einwilligung.
 *   Storage canonical key: `tier2`. Legacy alias: `metrics`.
 *
 * Tier 0 (Betriebsnotwendig) is NOT controlled here — always-on at
 * the OS layer under Vertragserfüllung + berechtigtes Interesse.
 *
 * Tier 3 (Debug-Snapshot) is per-incident — not part of onboarding flow.
 */
export interface GATelemetryPreferences {
  // Legacy flat keys — still accepted by the backend (HA Core
  // greenautarky_telemetry component v0.4+). New code SHOULD prefer
  // tier1 / tier2 below but these aliases remain stable.
  error_logs: boolean;
  metrics: boolean;
  // Canonical tier keys (returned by v2 backend, accepted by set endpoint)
  tier1?: boolean;
  tier2?: boolean;
}

/** Per-tier metadata in the v2 response. */
export interface GATierConsentRecord {
  value: boolean;
  accepted_at: string | null; // ISO-8601 UTC, or null for fresh devices
  policy_version: number | null;
}

/**
 * Full v2 response shape from greenautarky_telemetry/get.
 *
 * `consent_is_stale` is the backend's derived signal for "the user
 * accepted an older policy version than the OS currently ships." Fresh
 * devices (never onboarded) report `consent_is_stale: false` plus
 * `policy_version_accepted: null` — the frontend distinguishes those
 * two cases when deciding whether to render the re-accept banner.
 */
export interface GATelemetryFullResponse extends GATelemetryPreferences {
  policy_version_accepted?: number | null;
  current_policy_version?: number;
  consent_is_stale?: boolean;
  tiers?: {
    tier1: GATierConsentRecord;
    tier2: GATierConsentRecord;
  };
}

export const getGATelemetryPreferences = (
  hass: HomeAssistant
): Promise<GATelemetryFullResponse> =>
  hass.callWS<GATelemetryFullResponse>({
    type: "greenautarky_telemetry/get",
  });

export const setGATelemetryPreferences = (
  hass: HomeAssistant,
  prefs: Partial<GATelemetryPreferences>
): Promise<GATelemetryFullResponse> =>
  hass.callWS<GATelemetryFullResponse>({
    type: "greenautarky_telemetry/set",
    ...prefs,
  });

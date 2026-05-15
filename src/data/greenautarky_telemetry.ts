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
  accepted_at: string; // ISO-8601 UTC
  policy_version: number;
}

/** Full v2 response shape from greenautarky_telemetry/get. */
export interface GATelemetryFullResponse extends GATelemetryPreferences {
  policy_version_accepted?: number;
  current_policy_version?: number;
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

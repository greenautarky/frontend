import type { HomeAssistant } from "../types";

export interface GATelemetryPreferences {
  error_logs: boolean;
  metrics: boolean;
}

export const getGATelemetryPreferences = (
  hass: HomeAssistant
): Promise<GATelemetryPreferences> =>
  hass.callWS<GATelemetryPreferences>({
    type: "greenautarky_telemetry/get",
  });

export const setGATelemetryPreferences = (
  hass: HomeAssistant,
  prefs: Partial<GATelemetryPreferences>
): Promise<GATelemetryPreferences> =>
  hass.callWS<GATelemetryPreferences>({
    type: "greenautarky_telemetry/set",
    ...prefs,
  });

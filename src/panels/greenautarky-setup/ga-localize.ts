// Builds the wizard's localize() from the BUNDLED German/English tables.
//
// The GreenAutarky wizard is German-first and self-contained (#512): it must
// not depend on a runtime translation fragment fetched from Core (which 404s on
// a stock Core) nor on Lokalise (which has no entries for these brand-new keys,
// so German — the primary language — would fall back to English). So the panel
// builds its localize from committed de.ts/en.ts here, using the same
// computeLocalize machinery (IntlMessageFormat) the rest of the frontend uses.

import { computeLocalize } from "../../common/translations/localize";
import type { LocalizeFunc } from "../../common/translations/localize";
import { messages as de } from "./translations/de";
import { messages as en } from "./translations/en";

export const GA_SUPPORTED_LANGUAGES = ["de", "en"] as const;
export type GaLanguage = (typeof GA_SUPPORTED_LANGUAGES)[number];
export const GA_DEFAULT_LANGUAGE: GaLanguage = "de";

export const gaSetupResources: Record<GaLanguage, Record<string, string>> = {
  de,
  en,
};

export function normalizeGaLanguage(language: string | undefined): GaLanguage {
  return language && language in gaSetupResources
    ? (language as GaLanguage)
    : GA_DEFAULT_LANGUAGE;
}

/**
 * Build a localize() for the wizard in the given language. `cache` is any
 * element (computeLocalize stores its IntlMessageFormat cache on it).
 */
export async function buildGaLocalize(
  cache: HTMLElement,
  language: string | undefined
): Promise<LocalizeFunc> {
  const lang = normalizeGaLanguage(language);
  return computeLocalize(cache, lang, gaSetupResources);
}

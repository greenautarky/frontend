/**
 * greenautarky / KI-Butler branding constants.
 *
 * Centralizes logo, colors, and texts so every onboarding component
 * can import from a single source.
 *
 * Color palette extracted from corporate identity:
 *   GA Green (dark)  #2B5A2A  — headings, primary
 *   GA Green (mid)   #3D7B3B  — links, accents
 *   GA Orange         #E89B30  — highlights, warnings
 */
import { css } from "lit";
import { html } from "lit";

// -- Colors (from CI/corporate-identity.md) -----------------------------------
export const GA_PRIMARY_COLOR = "#2B5A2A"; // GA Green dark — headings
export const GA_PRIMARY_LIGHT = "#3D7B3B"; // GA Green mid — links, accents
export const GA_PRIMARY_DARK = "#1E3A2A"; // GA Green darkest — table headers
export const GA_ACCENT_COLOR = "#E89B30"; // GA Orange — highlights

// -- Texts -------------------------------------------------------------------
export const GA_PRODUCT_NAME = "greenautarky KI-Butler";
export const GA_WELCOME_HEADER = "Willkommen bei Ihrem KI-Butler";
export const GA_WELCOME_INTRO =
  "Lassen Sie uns Ihr Smart Home einrichten. Das dauert nur wenige Minuten.";

// -- GA Logo (inline SVG — green circle with white "GA" text) ----------------
export const gaLogoSvg = html`
  <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    class="ga-logo"
  >
    <circle cx="100" cy="100" r="90" fill="${GA_PRIMARY_COLOR}" />
    <text
      x="100"
      y="115"
      text-anchor="middle"
      fill="white"
      font-size="48"
      font-weight="bold"
      font-family="Arial, sans-serif"
    >
      GA
    </text>
  </svg>
`;

// -- HA Logo (official Home Assistant house icon) ----------------------------
export const haLogoSvg = html`
  <svg
    viewBox="0 0 240 240"
    xmlns="http://www.w3.org/2000/svg"
    class="ha-logo"
  >
    <path
      fill="#18BCF2"
      d="M240 224.762a15 15 0 0 1-15 15H15a15 15 0 0 1-15-15v-90c0-8.25 4.77-19.769 10.61-25.609l98.78-98.7805c5.83-5.83 15.38-5.83 21.21 0l98.79 98.7895c5.83 5.83 10.61 17.36 10.61 25.61v90-.01Z"
    />
    <path
      fill="#F2F4F9"
      d="m107.27 239.762-40.63-40.63c-2.09.72-4.32 1.13-6.64 1.13-11.3 0-20.5-9.2-20.5-20.5s9.2-20.5 20.5-20.5 20.5 9.2 20.5 20.5c0 2.33-.41 4.56-1.13 6.65l31.63 31.63v-115.88c-6.8-3.3395-11.5-10.3195-11.5-18.3895 0-11.3 9.2-20.5 20.5-20.5s20.5 9.2 20.5 20.5c0 8.07-4.7 15.05-11.5 18.3895v81.27l31.46-31.46c-.62-1.96-.96-4.04-.96-6.2 0-11.3 9.2-20.5 20.5-20.5s20.5 9.2 20.5 20.5-9.2 20.5-20.5 20.5c-2.5 0-4.88-.47-7.09-1.29L129 208.892v30.88z"
    />
  </svg>
`;

// -- Shared styles -----------------------------------------------------------
export const gaBrandingStyles = css`
  .ga-logo {
    width: 80px;
    height: 80px;
  }
  .ha-logo {
    width: 48px;
    height: 48px;
  }
  .ga-header {
    color: var(--primary-color, #2b5a2a);
  }
  .brand-block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 16px;
  }
  .brand-logos {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .brand-tagline {
    font-size: 13px;
    color: var(--secondary-text-color, #5a5a5a);
    margin: 0;
  }
  .brand-tagline strong {
    color: var(--primary-color, #2b5a2a);
  }
`;

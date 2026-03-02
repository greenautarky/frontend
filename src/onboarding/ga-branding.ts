/**
 * greenautarky / iHost branding constants.
 *
 * Centralizes logo, colors, and texts so every onboarding component
 * can import from a single source.
 */
import { css } from "lit";
import { html } from "lit";

// -- Colors ------------------------------------------------------------------
export const GA_PRIMARY_COLOR = "#2e7d32"; // green 800
export const GA_PRIMARY_LIGHT = "#60ad5e";
export const GA_PRIMARY_DARK = "#005005";
export const GA_ACCENT_COLOR = "#00acc1"; // cyan 600

// -- Texts -------------------------------------------------------------------
export const GA_PRODUCT_NAME = "greenautarky iHost";
export const GA_WELCOME_HEADER = "Willkommen auf deinem iHost";
export const GA_WELCOME_INTRO =
  "Lass uns dein Smart Home einrichten. Das dauert nur wenige Minuten.";

// -- Logo (inline SVG so no external request is needed) ----------------------
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
      font-family="sans-serif"
    >
      GA
    </text>
  </svg>
`;

// -- Shared styles -----------------------------------------------------------
export const gaBrandingStyles = css`
  .ga-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 16px;
  }
  .ga-header {
    color: var(--primary-color, #2e7d32);
  }
`;

import { getHex, mixColor } from '@go-tech/color';

/**
 * Background gradient stops for the "Account grid" section.
 *
 * The light stops are the original warm design colors, normalized through
 * `@go-tech/color`. The dark stops are derived from them by mixing toward a
 * warm near-black base, so the peach hue is preserved in dark mode instead of
 * being hardcoded a second time.
 */
const LIGHT_STOPS = ['#FFF8F5', '#FFF5F0', '#FFEEE5'].map(getHex);

const DARK_BASE = '#0c0906';
const DARK_MIX_RATIO = 0.83;

const DARK_STOPS = LIGHT_STOPS.map(color => mixColor(color, DARK_BASE, DARK_MIX_RATIO));

const toGradient = (stops: string[]) => `linear-gradient(to bottom, ${stops.join(', ')})`;

export const accountGridGradient = {
  light: toGradient(LIGHT_STOPS),
  dark: toGradient(DARK_STOPS)
};

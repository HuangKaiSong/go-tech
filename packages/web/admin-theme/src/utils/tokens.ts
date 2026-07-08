/** Style element id for theme token CSS variables */
const THEME_TOKEN_STYLE_ID = 'theme-token-vars';

/** Partial theme setting token (dark mode overrides are partial) */
type PartialThemeToken = {
  [K in keyof Theme.ThemeSettingToken]?: Partial<Theme.ThemeSettingToken[K]>;
};

/** Token key -> CSS variable name mapping */
const TOKEN_CSS_VAR_MAP = {
  boxShadow: {
    header: '--header-box-shadow',
    sider: '--sider-box-shadow',
    tab: '--tab-box-shadow'
  },
  colors: {
    'base-text': '--color-base-text',
    container: '--color-container',
    inverted: '--color-inverted',
    layout: '--color-layout',
    nprogress: '--color-nprogress'
  }
} as const;

/** CSS variable suffix for unknown token keys, by token group */
const TOKEN_CSS_VAR_SUFFIX: Record<keyof Theme.ThemeSettingToken, string> = {
  boxShadow: 'box-shadow',
  colors: 'color'
};

/**
 * Get the CSS variable name of a token key
 *
 * @example
 *   getTokenCSSVarName('colors', 'container'); // '--container-color'
 *   getTokenCSSVarName('boxShadow', 'header'); // '--header-box-shadow'
 */
function getTokenCSSVarName(group: keyof Theme.ThemeSettingToken, key: string): string {
  const preset = (TOKEN_CSS_VAR_MAP[group] as Record<string, string>)[key];

  return preset ?? `--${key}-${TOKEN_CSS_VAR_SUFFIX[group]}`;
}

/** Transform a (partial) theme setting token into a CSS variable map */
function tokenToCSSVars(token: PartialThemeToken): Record<string, string> {
  const vars: Record<string, string> = {};

  const groups = Object.keys(TOKEN_CSS_VAR_SUFFIX) as (keyof Theme.ThemeSettingToken)[];

  groups.forEach(group => {
    const groupTokens = token[group];

    if (!groupTokens) return;

    Object.entries(groupTokens).forEach(([key, value]) => {
      if (!value) return;

      vars[getTokenCSSVarName(group, key)] = value;
    });
  });

  return vars;
}

/**
 * Get the CSS variable maps of `theme.tokens`
 *
 * @returns Light vars (full token) and dark vars (only the overridden keys)
 */
export function getTokenCSSVars(tokens: Theme.ThemeSetting['tokens']) {
  return {
    dark: tokenToCSSVars(tokens.dark ?? {}),
    light: tokenToCSSVars(tokens.light)
  };
}

function toCSSText(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ');
}

/**
 * Write `theme.tokens` to global CSS variables
 *
 * Light tokens go to `:root`, dark overrides go to `html.dark` (matches `toggleCssDarkMode`). Called on theme
 * initialization (`setupTheme`) and whenever `settings.tokens` changes (`ThemeEffect`). Idempotent: reuses a single
 * `<style>` element.
 */
export function writeThemeTokensToGlobal(tokens: Theme.ThemeSetting['tokens']): void {
  if (typeof document === 'undefined') return;

  const { dark, light } = getTokenCSSVars(tokens);

  let css = `:root { ${toCSSText(light)} }`;

  const darkCSSText = toCSSText(dark);

  if (darkCSSText) {
    css += `\nhtml.dark { ${darkCSSText} }`;
  }

  let styleEl = document.getElementById(THEME_TOKEN_STYLE_ID) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = THEME_TOKEN_STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = css;
}

function mapTokenVars(group: keyof Theme.ThemeSettingToken): Record<string, string> {
  return Object.fromEntries(
    Object.entries(TOKEN_CSS_VAR_MAP[group]).map(([key, varName]) => [key, `var(${varName})`])
  );
}

/**
 * Create UnoCSS theme config for `theme.tokens`
 *
 * @example
 *   ```ts
 *   // uno.config.ts
 *   import { createUnoThemeTokens } from '@go-tech/web-admin-theme/tokens';
 *
 *   export default defineConfig({
 *     theme: {
 *       ...createUnoThemeTokens()
 *     }
 *   });
 *   // usage: bg-container text-base-text shadow-header
 *   ```
 */
export function createUnoThemeTokens() {
  return {
    boxShadow: mapTokenVars('boxShadow'),
    colors: mapTokenVars('colors')
  };
}

/**
 * Create Tailwind CSS theme config for `theme.tokens`
 *
 * @example
 *   ```ts
 *   // tailwind.config.ts
 *   import { createTailwindThemeTokens } from '@go-tech/web-admin-theme/tokens';
 *
 *   export default {
 *     theme: {
 *       extend: {
 *         ...createTailwindThemeTokens()
 *       }
 *     }
 *   };
 *   // usage: bg-container text-base-text shadow-header
 *   ```
 */
export function createTailwindThemeTokens() {
  return {
    boxShadow: mapTokenVars('boxShadow'),
    colors: mapTokenVars('colors')
  };
}

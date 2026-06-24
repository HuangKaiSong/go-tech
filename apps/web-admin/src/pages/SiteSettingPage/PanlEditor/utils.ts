function parsePercent(value: string) {
  if (value.endsWith('%')) return Number.parseFloat(value) / 100;
  const num = Number.parseFloat(value);
  if (Number.isNaN(num)) return 0;
  return num > 1 ? num / 100 : num;
}

function parseOklabL(value: string) {
  if (value.endsWith('%')) return Number.parseFloat(value) / 100;
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return 0;
  return num > 1 ? num / 100 : num;
}

function parseOklabAB(value: string) {
  if (value.endsWith('%')) return Number.parseFloat(value) / 100;
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

function oklabToSRgb(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function clampHexByte(value: number) {
  const v = Math.round(value * 255);
  const clamped = Math.min(255, Math.max(0, v));
  return clamped.toString(16).padStart(2, '0');
}

function byteToHex(value: number) {
  return value.toString(16).padStart(2, '0');
}

export function rgbToHex(rgb: string) {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '#000000';
  const [r, g, b] = result.map(value => Number.parseInt(value, 10));
  return `#${byteToHex(r)}${byteToHex(g)}${byteToHex(b)}`;
}

export function hslToHex(hsl: string) {
  const parts = hsl.match(/-?\d*\.?\d+%?/g);
  if (!parts || parts.length < 3) return '#000000';

  let hue = Number.parseFloat(parts[0]);
  if (!Number.isFinite(hue)) hue = 0;
  hue = ((hue % 360) + 360) % 360;

  const s = parsePercent(parts[1]);
  const l = parsePercent(parts[2]);

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (value: number) => {
    const v = Math.round((value + m) * 255);
    const clamped = Math.min(255, Math.max(0, v));
    return clamped.toString(16).padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function oklabToHex(oklab: string) {
  const parts = oklab.match(/-?\d*\.?\d+%?/g);
  if (!parts || parts.length < 3) return '#000000';

  const L = parseOklabL(parts[0]);
  const a = parseOklabAB(parts[1]);
  const b = parseOklabAB(parts[2]);

  const lPrime = L + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = L - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = L - 0.0894841775 * a - 1.291485548 * b;

  const l = lPrime * lPrime * lPrime;
  const m = mPrime * mPrime * mPrime;
  const s = sPrime * sPrime * sPrime;

  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let b2 = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  r = oklabToSRgb(r);
  g = oklabToSRgb(g);
  b2 = oklabToSRgb(b2);

  return `#${clampHexByte(r)}${clampHexByte(g)}${clampHexByte(b2)}`;
}

export function colorToHex(color: string) {
  if (color.startsWith('#')) return color;
  if (color.startsWith('rgb')) return rgbToHex(color);
  if (color.startsWith('hsl')) return hslToHex(color);
  if (color.startsWith('oklab')) return oklabToHex(color);
  return color;
}

export const normalizeAlign = (value?: string) => {
  if (!value) return 'left' as const;
  if (value.includes('center')) return 'center' as const;
  if (value.includes('right') || value.includes('end')) return 'right' as const;
  return 'left' as const;
};

export const extractUrl = (value?: string) => {
  if (!value || value === 'none') return '';
  const match = value.match(/url\((['"]?)(.*?)\1\)/);
  return match?.[2] || '';
};

export const isButtonElement = (tagName?: string) => {
  if (!tagName) return false;
  const tag = tagName.toLowerCase();
  return tag === 'button' || tag === 'a';
};

export const isBackgroundEligible = (tagName?: string) => {
  if (!tagName) return false;
  const tag = tagName.toLowerCase();
  return tag === 'body' || tag === 'section' || tag === 'div';
};

/**
 * @param {string} rawUrl 图片地址 包含网络和绝对地址, 绝对地址需要组合 h5SiteUrl
 * @param {string} fileName 文件名称
 * @returns {File}
 */
export async function fetchAndConvertToFile(rawUrl: string, fileName: string = 'image.jpg'): Promise<File> {
  const h5SiteUrl = import.meta.env.VITE_H5_SITE_URL;
  let url = rawUrl;

  // Use admin dev proxy to avoid cross-origin preflight for H5 assets.
  if (rawUrl.startsWith('http')) {
    url = rawUrl;
  }
  if (rawUrl.startsWith('/')) {
    url = `${h5SiteUrl}${rawUrl}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();
  const mimeType = response.headers.get('content-type') || 'image/jpeg';

  return new File([blob], fileName, { type: mimeType });
}

export function createElementFromOuterHTML(outerHTML: string) {
  const fragment = document.createRange().createContextualFragment(outerHTML);
  return fragment.firstChild as HTMLElement;
}

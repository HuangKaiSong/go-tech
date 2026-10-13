import type { ReplayEvent } from '@go-tech/monitor-contract';

import { redactMonitorText as redactText } from '@go-tech/monitor-contract';

export { redactMonitorText as redactText } from '@go-tech/monitor-contract';

export function safePath(value: string, base = 'http://localhost') {
  try {
    return new URL(value, base).pathname.slice(0, 1000);
  } catch {
    return '/';
  }
}

type Json = ReplayEvent['data'];
const allowedAttributes = new Set([
  'class',
  'id',
  'style',
  '_cssText',
  'type',
  'placeholder',
  'title',
  'alt',
  'aria-label',
  'width',
  'height',
  'checked',
  'selected',
  'disabled',
  'open',
  'hidden',
  'role',
  'aria-hidden',
  'aria-expanded',
  'aria-disabled',
  'aria-pressed',
  'aria-selected',
  'tabindex',
  'rr_width',
  'rr_height',
  'rr_scrollLeft',
  'rr_scrollTop',
  'rr_open_mode'
]);

// Presentation state participates in CSS selectors and container breakpoints.
// Keep only known values; arbitrary data-* attributes may contain business data.
const presentationAttributes = new Map<string, ReadonlySet<string>>([
  ['data-view-mode', new Set(['auto', 'pc', 'mobile'])],
  ['data-view-frame', new Set(['', 'true'])],
  ['data-view-scroll-root', new Set(['', 'true'])],
  ['data-view-portal-root', new Set(['', 'true'])],
  [
    'data-state',
    new Set([
      'open',
      'closed',
      'checked',
      'unchecked',
      'indeterminate',
      'active',
      'inactive',
      'on',
      'off',
      'visible',
      'hidden',
      'delayed-open',
      'instant-open'
    ])
  ],
  ['data-side', new Set(['top', 'right', 'bottom', 'left'])],
  ['data-align', new Set(['start', 'center', 'end'])],
  ['data-orientation', new Set(['horizontal', 'vertical'])],
  ['data-disabled', new Set(['', 'true', 'false'])],
  ['data-highlighted', new Set(['', 'true', 'false'])],
  ['dir', new Set(['ltr', 'rtl', 'auto'])]
]);

function allowedAttribute(name: string, value: unknown) {
  if (allowedAttributes.has(name)) return true;
  if (name === 'lang')
    return value === null || (typeof value === 'string' && /^[a-z]{2,8}(-[a-z0-9]{1,8})*$/i.test(value));
  const values = presentationAttributes.get(name);
  return values !== undefined && (value === null || (typeof value === 'string' && values.has(value)));
}

function css(value: string) {
  return value
    .replace(/url\(([^)]*)\)/gi, (_match, url: string) => {
      const path = url.trim().replace(/^['"]|['"]$/g, '');
      if (/^(data:|blob:|javascript:)/i.test(path)) return 'url("")';
      try {
        const parsed = new URL(path, window.location.href);
        return `url("${parsed.origin}${parsed.pathname}")`;
      } catch {
        return 'url("")';
      }
    })
    .replace(/\bcontent\s*:\s*(['"])[\s\S]*?\1/gi, 'content:"***"');
}

function sanitize(value: unknown, key = ''): Json {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return sanitizeString(value, key);
  if (Array.isArray(value)) return value.map(item => sanitize(item, key === 'texts' ? 'dom-text' : ''));
  if (typeof value !== 'object') return null;
  const result: Record<string, Json> = {};
  for (const [name, child] of Object.entries(value)) {
    const safeKey = !['__proto__', 'constructor', 'prototype'].includes(name);
    if (safeKey && (key !== 'attributes' || allowedAttribute(name, child))) {
      result[name] = sanitizeProperty(child, name, { parent: value, parentKey: key });
    }
  }
  if ('property' in value && value.property === 'content' && 'value' in result) result.value = '"***"';
  return result;
}

function sanitizeProperty(value: unknown, key: string, context: { parent: object; parentKey: string }): Json {
  if (typeof value === 'string') {
    if (key === 'textContent') {
      return 'isStyle' in context.parent && context.parent.isStyle === true ? css(value) : redactText(value, 10000);
    }
    if (context.parentKey === 'dom-text' && key === 'value') return css(redactText(value, value.length));
  }
  return sanitize(value, key);
}

function sanitizeString(value: string, key: string) {
  if (key === 'href') {
    try {
      const parsed = new URL(value, window.location.href);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return '';
    }
  }
  if (key === 'text') return '*'.repeat(Math.min(value.length, 1000));
  if (['placeholder', 'title', 'alt', 'aria-label'].includes(key)) return redactText(value, 1000);
  if (['_cssText', 'style', 'rule', 'replace', 'replaceSync', 'value'].includes(key)) return css(value);
  return value;
}

/** No console/network payload plugins; attributes and document URLs are filtered before buffering. */
export function sanitizeRecording(event: { data: unknown; timestamp: number; type: number }): ReplayEvent {
  return { type: event.type, timestamp: event.timestamp, data: sanitize(event.data) };
}

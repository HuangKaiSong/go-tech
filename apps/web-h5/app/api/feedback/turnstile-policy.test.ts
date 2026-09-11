import { describe, expect, it } from 'vitest';

import { classifyTurnstileFailure } from './turnstile-policy';

describe('classifyTurnstileFailure', () => {
  it('treats Cloudflare secret and request errors as unavailable', () => {
    for (const errorCode of ['missing-input-secret', 'invalid-input-secret', 'bad-request', 'internal-error']) {
      expect(classifyTurnstileFailure([errorCode])).toBe('unavailable');
    }
  });

  it('keeps expired, duplicate, malformed and missing tokens as invalid', () => {
    for (const errorCode of ['timeout-or-duplicate', 'missing-input-response', 'invalid-input-response']) {
      expect(classifyTurnstileFailure([errorCode])).toBe('invalid');
    }
  });

  it('defaults unknown verification rejections to invalid', () => {
    expect(classifyTurnstileFailure(['future-error-code'])).toBe('invalid');
    expect(classifyTurnstileFailure([])).toBe('invalid');
  });
});

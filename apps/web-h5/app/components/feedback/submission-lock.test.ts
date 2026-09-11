import { describe, expect, it } from 'vitest';

import { releaseSubmissionLock, tryAcquireSubmissionLock } from './submission-lock';

describe('submission lock', () => {
  it('allows only one request when submit is clicked repeatedly in the same render', () => {
    const lock = { current: false };

    expect(tryAcquireSubmissionLock(lock)).toBe(true);
    expect(tryAcquireSubmissionLock(lock)).toBe(false);
    expect(lock.current).toBe(true);
  });

  it('can be released after a failed request so the user can retry', () => {
    const lock = { current: false };

    expect(tryAcquireSubmissionLock(lock)).toBe(true);
    releaseSubmissionLock(lock);

    expect(lock.current).toBe(false);
    expect(tryAcquireSubmissionLock(lock)).toBe(true);
  });
});

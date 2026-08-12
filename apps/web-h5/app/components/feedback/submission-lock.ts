interface SubmissionLock {
  current: boolean;
}

export const tryAcquireSubmissionLock = (lock: SubmissionLock) => {
  if (lock.current) return false;
  lock.current = true;
  return true;
};

export const releaseSubmissionLock = (lock: SubmissionLock) => {
  lock.current = false;
};

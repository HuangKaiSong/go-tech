const reportedErrors = new WeakSet<object>();

export function markServerErrorReported(error: unknown) {
  if (typeof error === 'object' && error !== null) reportedErrors.add(error);
}

export function isServerErrorReported(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 10; depth += 1) {
    if (typeof current !== 'object' || current === null) return false;
    if (reportedErrors.has(current)) return true;
    current = current instanceof Error ? current.cause : undefined;
  }
  return false;
}

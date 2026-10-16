const OFFSET = 8 * 60 * 60 * 1000;

/** Inputs and displayed monitor times consistently use UTC+8, regardless of the operator's timezone. */
export function monitorTimeInput(timestamp: string) {
  if (!timestamp) return '';
  const value = Number(timestamp);
  if (!Number.isSafeInteger(value) || value < 0 || value > 8640000000000000 - OFFSET) return '';
  return new Date(value + OFFSET).toISOString().slice(0, 16);
}

export function monitorTimeBound(value: string, end = false) {
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('請輸入有效的時間');
  const timestamp = Date.parse(`${value}:00+08:00`);
  if (!Number.isFinite(timestamp) || timestamp < 0 || monitorTimeInput(String(timestamp)) !== value)
    throw new Error('請輸入有效的時間');
  // The inclusive end includes the entire selected minute.
  return String(timestamp + (end ? 59999 : 0));
}

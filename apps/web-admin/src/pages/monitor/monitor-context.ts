/** Explicit timezone and milliseconds avoid ambiguous administrator-local timestamps. */
export function formatMonitorTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
    timeZoneName: 'short'
  }).format(timestamp);
}

export const authenticationLabels = {
  anonymous: '未登入',
  verified: '憑證簽名及有效期已驗證',
  unverified: '憑證已提供，身份未驗證',
  invalid: '憑證無效或已過期'
};

export function timeSourceLabel(value?: string) {
  if (value === 'server') return '伺服器時鐘';
  if (value === 'client') return '瀏覽器時鐘';
  return '舊記錄未標記';
}

export function deviceTypeLabel(mobile?: boolean) {
  if (mobile === undefined) return '未提供';
  return mobile ? '行動設備' : '桌面設備';
}

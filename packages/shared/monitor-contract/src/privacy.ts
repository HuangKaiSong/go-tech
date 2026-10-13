export function redactMonitorText(value: string, limit = 1000) {
  return value
    .replace(/https?:\/\/[^\s)"'<>]+/g, url => url.replace(/[?#][\s\S]*$/, '').replace(/^(https?:\/\/)[^/]*@/, '$1'))
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[jwt]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\b(token|password|secret|authorization|cookie)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
    .slice(0, limit);
}

import type { ZodError } from 'zod';

/** 每个字段保留首条校验提示，避免展示 Zod 的 JSON 或重复的约束错误。 */
export function formatValidationError(error: ZodError): string {
  const paths = new Set<string>();
  const messages = new Set<string>();

  for (const issue of error.issues) {
    const path = JSON.stringify(issue.path);
    const message = issue.message.trim();
    if (message && !paths.has(path)) {
      paths.add(path);
      messages.add(message);
    }
  }

  return [...messages].join(' · ');
}

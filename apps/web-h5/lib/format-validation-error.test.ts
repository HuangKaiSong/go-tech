import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { formatValidationError } from './format-validation-error';

test('safeParse 失败时按字段展示首条文案，不输出 Zod JSON', () => {
  const schema = z.object({
    name: z.string().min(2, '用户名长度应为 2–50 个字符'),
    verificationCode: z.string().min(1, '请输入验证码').length(6, '验证码应为 6 位字符')
  });
  const result = schema.safeParse({ name: '2', verificationCode: '' });
  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(formatValidationError(result.error), '用户名长度应为 2–50 个字符 · 请输入验证码');

  const shortCode = schema.safeParse({ name: '用户', verificationCode: '777' });
  if (shortCode.success) throw new Error('Expected validation failure');
  assert.equal(formatValidationError(shortCode.error), '验证码应为 6 位字符');
});

test('保留嵌套字段及表单级错误，并去重相同提示', () => {
  const error = new z.ZodError([
    { code: 'custom', path: ['users', 0, 'email'], message: '邮箱无效' },
    { code: 'custom', path: ['users', 1, 'email'], message: '邮箱无效' },
    { code: 'custom', path: [], message: '密码不一致' }
  ]);
  assert.equal(formatValidationError(error), '邮箱无效 · 密码不一致');
});

import crypto from 'node:crypto';

export function hash(text: string) {
  return crypto
    .createHash('sha1')
    .update(text)
    .digest('hex');
}

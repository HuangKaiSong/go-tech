import { sql } from 'drizzle-orm';
import { datetime, index, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

/** 備用驗證碼的一次性挑戰；不保存驗證碼答案。 */
export const fbCaptchaChallenge = mysqlTable(
  'fb_captcha_challenge',
  {
    nonce: varchar('nonce', { length: 64 }).primaryKey(),
    expiresAt: datetime('expires_at', { fsp: 3, mode: 'date' }).notNull(),
    createdAt: datetime('created_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
  },
  table => [index('idx_captcha_challenge_expires').on(table.expiresAt)]
);

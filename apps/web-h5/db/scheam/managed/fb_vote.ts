import { sql } from 'drizzle-orm';
import { bigint, datetime, index, mysqlTable, uniqueIndex } from 'drizzle-orm/mysql-core';
import { platformCustomer } from '../external/platform_customer';
import { fbFeature } from './fb_feature';

/** 點讚（對應前端 likedBy），唯一約束避免重複投票 */
export const fbVote = mysqlTable(
  'fb_vote',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    featureId: bigint('feature_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => fbFeature.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => platformCustomer.id, { onDelete: 'cascade' }),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
  },
  t => [uniqueIndex('uk_vote').on(t.featureId, t.userId), index('idx_vote_user').on(t.userId)]
);

export type FbVote = typeof fbVote.$inferSelect;
export type NewFbVote = typeof fbVote.$inferInsert;

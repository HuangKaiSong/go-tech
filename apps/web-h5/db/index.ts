import path from 'node:path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './scheam';

// 按 Next.js 优先级顺序加载 .env 文件
const env = process.env.NODE_ENV || 'development';
[`.env.${env}.local`, '.env.local', `.env.${env}`, '.env'].forEach(file => {
  dotenv.config({ path: path.resolve(process.cwd(), file) });
});

const globalForDb = globalThis as unknown as {
  conn: mysql.Pool | undefined;
};

// 复用连接池防止超出 MySQL 最大连接数限制
const connection = globalForDb.conn ?? mysql.createPool(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== 'production') globalForDb.conn = connection;

export const db = drizzle(connection, { schema, mode: 'default' });

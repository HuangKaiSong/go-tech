import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// 按 Next.js 优先级顺序加载 .env 文件
const env = process.env.NODE_ENV || 'development';
[`.env.${env}.local`, `.env.local`, `.env.${env}`, '.env'].forEach(file => {
  dotenv.config({ path: path.resolve(process.cwd(), file) });
});

export default defineConfig({
  out: './drizzle',
  schema: './db/scheam/managed',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
  casing: 'snake_case'
});

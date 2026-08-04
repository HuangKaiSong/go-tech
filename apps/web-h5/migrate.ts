import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

// 按 Next.js 优先级加载 .env 文件
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const run = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const connection = mysql.createPool(databaseUrl);
  const db = drizzle(connection, { mode: 'default' });

  try {
    console.log('Starting migration...');
    console.log('Migrations folder: ./drizzle');

    await migrate(db, {
      migrationsFolder: './drizzle'
    });

    console.log('Migration completed successfully!');
  } catch (error) {
    const err = error as Error;
    console.error('Migration failed:');
    console.error('  Message:', err.message);
    if (err.stack) {
      console.error('  Stack:');
      err.stack.split('\n').forEach(line => console.error('    ', line));
    }
    if ('cause' in err) {
      console.error('  Cause:', (err as any).cause);
    }
    process.exit(1);
  } finally {
    await connection.end();
  }
};

run();

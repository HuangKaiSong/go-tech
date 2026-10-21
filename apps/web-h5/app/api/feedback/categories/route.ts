import { asc } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { getDb, withRuntimeScope } from '@/db';
import { fbCategory, fbSubCategory } from '@/db/scheam';

async function handleGET(_req: NextRequest) {
  const allCats = await (
    await getDb()
  ).query.fbCategory.findMany({
    with: {
      subCategories: {
        columns: {
          id: true,
          name: true,
          sortOrder: true
        },
        orderBy: [asc(fbSubCategory.sortOrder)]
      }
    },
    orderBy: [asc(fbCategory.sortOrder)],
    columns: {
      id: true,
      name: true,
      icon: true,
      description: true,
      system: true
    }
  });

  return NextResponse.json({ success: true, data: allCats });
}

export const GET = withRuntimeScope(handleGET);

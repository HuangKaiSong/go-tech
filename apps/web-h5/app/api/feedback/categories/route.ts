import { asc } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fbCategory, fbSubCategory } from '@/db/scheam';

export async function GET(_req: NextRequest) {
  const allCats = await db.query.fbCategory.findMany({
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
      description: true
    }
  });

  return NextResponse.json({ success: true, data: allCats });
}

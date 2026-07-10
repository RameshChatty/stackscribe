import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import {
  category as categoryTable,
  story as storyTable,
  storyCategory as storyCategoryTable,
} from "@/lib/db/schema";
import { demoCategories } from "@/lib/data/demo";
import type { CategorySummary } from "@/lib/data/types";

export async function getCategories(): Promise<CategorySummary[]> {
  if (!isDatabaseConfigured) return demoCategories;
  const rows = await db
    .select({
      id: categoryTable.id,
      name: categoryTable.name,
      slug: categoryTable.slug,
      description: categoryTable.description,
      storyCount: sql<number>`count(${storyTable.id})::int`,
    })
    .from(categoryTable)
    .leftJoin(
      storyCategoryTable,
      eq(storyCategoryTable.categoryId, categoryTable.id),
    )
    .leftJoin(
      storyTable,
      sql`${storyTable.id} = ${storyCategoryTable.storyId} and ${storyTable.status} = 'published'`,
    )
    .groupBy(categoryTable.id)
    .orderBy(asc(categoryTable.name));
  return rows.map((row) => ({ ...row, storyCount: Number(row.storyCount) }));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategorySummary | null> {
  if (!isDatabaseConfigured) {
    return demoCategories.find((category) => category.slug === slug) ?? null;
  }
  const [row] = await db
    .select()
    .from(categoryTable)
    .where(eq(categoryTable.slug, slug))
    .limit(1);
  return row ?? null;
}

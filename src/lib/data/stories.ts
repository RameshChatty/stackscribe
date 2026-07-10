import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import {
  category as categoryTable,
  like as likeTable,
  story as storyTable,
  storyCategory as storyCategoryTable,
  user as userTable,
} from "@/lib/db/schema";
import {
  demoStories,
  getDemoAuthor,
  getDemoStories,
  getDemoStory,
} from "@/lib/data/demo";
import type { StoryDetail, StorySummary } from "@/lib/data/types";

type StoryRow = typeof storyTable.$inferSelect;
type UserRow = typeof userTable.$inferSelect;
type CategoryRow = typeof categoryTable.$inferSelect;

function toSummary(
  story: StoryRow,
  author: UserRow,
  categories: CategoryRow[],
): StorySummary {
  return {
    id: story.id,
    title: story.title,
    slug: story.slug,
    summary: story.summary,
    coverImage: story.coverImage,
    status: story.status,
    readingMinutes: story.readingMinutes || 1,
    likeCount: story.likeCount || 0,
    publishedAt: story.publishedAt,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
    author: {
      id: author.id,
      name: author.name,
      username: author.username,
      image: author.image,
      bio: author.bio,
    },
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
    })),
  };
}

async function attachCategories(
  stories: { story: StoryRow; author: UserRow }[],
): Promise<StorySummary[]> {
  if (stories.length === 0) return [];
  const storyIds = stories.map((s) => s.story.id);
  const rows = await db
    .select({ storyId: storyCategoryTable.storyId, category: categoryTable })
    .from(storyCategoryTable)
    .innerJoin(
      categoryTable,
      eq(storyCategoryTable.categoryId, categoryTable.id),
    )
    .where(inArray(storyCategoryTable.storyId, storyIds));

  const grouped = new Map<string, CategoryRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.storyId) ?? [];
    list.push(row.category);
    grouped.set(row.storyId, list);
  }

  return stories.map(({ story, author }) =>
    toSummary(story, author, grouped.get(story.id) ?? []),
  );
}

export async function getPublishedStories(
  options: { limit?: number; categorySlug?: string; authorId?: string } = {},
): Promise<StorySummary[]> {
  if (!isDatabaseConfigured) return getDemoStories(options);
  const { limit = 30, categorySlug, authorId } = options;

  const conditions = [eq(storyTable.status, "published")];
  if (authorId) conditions.push(eq(storyTable.authorId, authorId));

  if (categorySlug) {
    const rows = await db
      .select({ story: storyTable, author: userTable })
      .from(storyCategoryTable)
      .innerJoin(storyTable, eq(storyCategoryTable.storyId, storyTable.id))
      .innerJoin(userTable, eq(storyTable.authorId, userTable.id))
      .innerJoin(
        categoryTable,
        eq(storyCategoryTable.categoryId, categoryTable.id),
      )
      .where(and(eq(categoryTable.slug, categorySlug), ...conditions))
      .orderBy(desc(storyTable.publishedAt))
      .limit(limit);
    return attachCategories(rows);
  }

  const rows = await db
    .select({ story: storyTable, author: userTable })
    .from(storyTable)
    .innerJoin(userTable, eq(storyTable.authorId, userTable.id))
    .where(and(...conditions))
    .orderBy(desc(storyTable.publishedAt))
    .limit(limit);
  return attachCategories(rows);
}

export async function getPopularStories(limit = 5): Promise<StorySummary[]> {
  if (!isDatabaseConfigured) {
    return [...demoStories].sort((a, b) => b.likeCount - a.likeCount).slice(0, limit);
  }
  const rows = await db
    .select({ story: storyTable, author: userTable })
    .from(storyTable)
    .innerJoin(userTable, eq(storyTable.authorId, userTable.id))
    .where(eq(storyTable.status, "published"))
    .orderBy(desc(storyTable.likeCount))
    .limit(limit);
  return attachCategories(rows);
}

export async function getStoryBySlug(
  slug: string,
  viewerId?: string,
): Promise<StoryDetail | null> {
  if (!isDatabaseConfigured) return getDemoStory(slug);
  const [row] = await db
    .select({ story: storyTable, author: userTable })
    .from(storyTable)
    .innerJoin(userTable, eq(storyTable.authorId, userTable.id))
    .where(eq(storyTable.slug, slug))
    .limit(1);

  if (!row) return null;

  const [summary] = await attachCategories([row]);

  let likedByViewer = false;
  if (viewerId) {
    const [existing] = await db
      .select({ userId: likeTable.userId })
      .from(likeTable)
      .where(
        and(eq(likeTable.storyId, row.story.id), eq(likeTable.userId, viewerId)),
      )
      .limit(1);
    likedByViewer = Boolean(existing);
  }

  return { ...summary, content: row.story.content, likedByViewer };
}

export async function getStoryById(
  id: string,
): Promise<(StoryDetail & { categoryIds: string[] }) | null> {
  if (!isDatabaseConfigured) {
    const demo = demoStories.find((item) => item.id === id);
    return demo ? { ...demo, categoryIds: demo.categories.map((c) => c.id) } : null;
  }
  const [row] = await db
    .select({ story: storyTable, author: userTable })
    .from(storyTable)
    .innerJoin(userTable, eq(storyTable.authorId, userTable.id))
    .where(eq(storyTable.id, id))
    .limit(1);
  if (!row) return null;
  const [summary] = await attachCategories([row]);
  return {
    ...summary,
    content: row.story.content,
    likedByViewer: false,
    categoryIds: summary.categories.map((c) => c.id),
  };
}

export async function getStoriesByAuthor(
  authorId: string,
  includeDrafts = false,
): Promise<StorySummary[]> {
  if (!isDatabaseConfigured) return getDemoStories({ authorId });
  const conditions = [eq(storyTable.authorId, authorId)];
  if (!includeDrafts) conditions.push(eq(storyTable.status, "published"));
  const rows = await db
    .select({ story: storyTable, author: userTable })
    .from(storyTable)
    .innerJoin(userTable, eq(storyTable.authorId, userTable.id))
    .where(and(...conditions))
    .orderBy(desc(storyTable.updatedAt));
  return attachCategories(rows);
}

export async function getAuthorByUsername(username: string) {
  if (!isDatabaseConfigured) return getDemoAuthor(username);
  const [row] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.username, username))
    .limit(1);
  return row ?? null;
}

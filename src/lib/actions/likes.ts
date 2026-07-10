"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { like as likeTable, story as storyTable } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";

export interface LikeResult {
  ok: boolean;
  liked?: boolean;
  likeCount?: number;
  error?: string;
}

export async function toggleLike(storyId: string): Promise<LikeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const [existing] = await db
    .select({ userId: likeTable.userId })
    .from(likeTable)
    .where(and(eq(likeTable.storyId, storyId), eq(likeTable.userId, user.id)))
    .limit(1);

  let liked: boolean;
  if (existing) {
    await db
      .delete(likeTable)
      .where(
        and(eq(likeTable.storyId, storyId), eq(likeTable.userId, user.id)),
      );
    liked = false;
  } else {
    await db
      .insert(likeTable)
      .values({ userId: user.id, storyId })
      .onConflictDoNothing();
    liked = true;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(likeTable)
    .where(eq(likeTable.storyId, storyId));

  await db
    .update(storyTable)
    .set({ likeCount: Number(count) })
    .where(eq(storyTable.id, storyId));

  const [row] = await db
    .select({ slug: storyTable.slug })
    .from(storyTable)
    .where(eq(storyTable.id, storyId))
    .limit(1);
  if (row) revalidatePath(`/story/${row.slug}`);

  return { ok: true, liked, likeCount: Number(count) };
}

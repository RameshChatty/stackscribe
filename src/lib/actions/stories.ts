"use server";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  category as categoryTable,
  story as storyTable,
  storyCategory as storyCategoryTable,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";
import { sanitizeContent } from "@/lib/sanitize";
import { estimateReadingMinutes, excerpt, slugify } from "@/lib/utils";
import { storyInputSchema, type StoryInput } from "@/lib/validation";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "story";
  let candidate = root;
  let suffix = 1;
  while (true) {
    const [existing] = await db
      .select({ id: storyTable.id })
      .from(storyTable)
      .where(eq(storyTable.slug, candidate))
      .limit(1);
    if (!existing || existing.id === ignoreId) return candidate;
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
}

function parseFormData(formData: FormData) {
  return storyInputSchema.safeParse({
    title: formData.get("title") ?? "",
    summary: formData.get("summary") ?? "",
    content: formData.get("content") ?? "",
    coverImage: formData.get("coverImage") ?? "",
    categoryIds: formData.getAll("categoryIds").map(String),
    status: formData.get("status") ?? "draft",
  });
}

async function syncCategories(storyId: string, categoryIds: string[]) {
  await db
    .delete(storyCategoryTable)
    .where(eq(storyCategoryTable.storyId, storyId));
  if (categoryIds.length === 0) return;
  // Insert only category ids that exist to avoid FK violations.
  const existingIds = new Set(
    (await db.select({ id: categoryTable.id }).from(categoryTable)).map(
      (c) => c.id,
    ),
  );
  const unique = Array.from(new Set(categoryIds));
  const rows = unique
    .filter((id) => existingIds.has(id))
    .map((categoryId) => ({ storyId, categoryId }));
  if (rows.length > 0) {
    await db.insert(storyCategoryTable).values(rows);
  }
}

export async function saveStory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in to write a story." };

  const storyId = (formData.get("storyId") as string | null) || null;

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Please fix the highlighted fields.",
    };
  }
  const input: StoryInput = parsed.data;

  const cleanContent = sanitizeContent(input.content);
  const now = new Date();
  const publishedAt = input.status === "published" ? now : null;
  const readingMinutes = estimateReadingMinutes(cleanContent);
  const summary = input.summary?.trim() || excerpt(cleanContent);

  let targetId = storyId;

  if (storyId) {
    const [existing] = await db
      .select()
      .from(storyTable)
      .where(eq(storyTable.id, storyId))
      .limit(1);
    if (!existing) return { error: "Story not found." };
    if (existing.authorId !== user.id) {
      return { error: "You can only edit your own stories." };
    }
    const slug =
      existing.title === input.title
        ? existing.slug
        : await uniqueSlug(input.title, storyId);
    await db
      .update(storyTable)
      .set({
        title: input.title,
        slug,
        summary,
        content: cleanContent,
        coverImage: input.coverImage || null,
        status: input.status,
        readingMinutes,
        publishedAt: existing.publishedAt ?? publishedAt,
        updatedAt: now,
      })
      .where(eq(storyTable.id, storyId));
  } else {
    targetId = randomUUID();
    const slug = await uniqueSlug(input.title);
    await db.insert(storyTable).values({
      id: targetId,
      title: input.title,
      slug,
      summary,
      content: cleanContent,
      coverImage: input.coverImage || null,
      status: input.status,
      authorId: user.id,
      readingMinutes,
      publishedAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (targetId) await syncCategories(targetId, input.categoryIds);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/categories");

  const [saved] = await db
    .select({ slug: storyTable.slug, status: storyTable.status })
    .from(storyTable)
    .where(eq(storyTable.id, targetId!))
    .limit(1);

  if (saved?.status === "published") {
    redirect(`/story/${saved.slug}`);
  }
  redirect("/dashboard");
}

export async function deleteStory(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const storyId = formData.get("storyId") as string | null;
  if (!storyId) return;
  await db
    .delete(storyTable)
    .where(and(eq(storyTable.id, storyId), eq(storyTable.authorId, user.id)));
  revalidatePath("/dashboard");
  revalidatePath("/");
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { StoryEditorForm } from "@/components/story-editor-form";
import { getCategories } from "@/lib/data/categories";
import { getStoryById } from "@/lib/data/stories";
import { getCurrentUser } from "@/lib/session";

interface EditStoryPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit story" };

export default async function EditStoryPage({ params }: EditStoryPageProps) {
  const { id } = await params;
  const [user, story, categories] = await Promise.all([
    getCurrentUser(),
    getStoryById(id),
    getCategories(),
  ]);
  if (!user) redirect(`/login?next=/write/${id}`);
  if (!story) notFound();
  if (story.author.id !== user.id) redirect("/forbidden");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <StoryEditorForm categories={categories} story={story} />
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SetupNotice } from "@/components/setup-notice";
import { StoryEditorForm } from "@/components/story-editor-form";
import { getCategories } from "@/lib/data/categories";
import { isDatabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Write a story" };

export default async function WritePage() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    getCategories(),
  ]);
  if (isDatabaseConfigured && !user) redirect("/login?next=/write");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      {!isDatabaseConfigured && <SetupNotice />}
      <StoryEditorForm categories={categories} />
    </div>
  );
}

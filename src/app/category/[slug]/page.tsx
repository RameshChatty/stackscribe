import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/ad-slot";
import { StoryCard } from "@/components/story-card";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getPublishedStories } from "@/lib/data/stories";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description:
      category.description ?? `Read the latest ${category.name} stories.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [category, stories] = await Promise.all([
    getCategoryBySlug(slug),
    getPublishedStories({ categorySlug: slug }),
  ]);
  if (!category) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <header className="border-b border-foreground pb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">
          Category
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 max-w-2xl text-lg text-muted">
            {category.description}
          </p>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section>
          {stories.length > 0 ? (
            stories.map((story) => <StoryCard key={story.id} story={story} />)
          ) : (
            <div className="py-16 text-center text-muted">
              No published stories in this category yet.
            </div>
          )}
        </section>
        <aside className="pt-8 lg:sticky lg:top-24 lg:self-start">
          <AdSlot />
        </aside>
      </div>
    </div>
  );
}

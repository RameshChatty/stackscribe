import type { Metadata } from "next";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { getCategories } from "@/lib/data/categories";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse technical stories and interview guides by topic.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">
          Explore
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">
          Find your next topic
        </h1>
        <p className="mt-4 text-lg text-muted">
          Browse practical articles, interview questions, and engineering
          lessons organized by category.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group rounded-xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold group-hover:text-accent">
                  {category.name}
                </h2>
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-muted">
                  {category.storyCount ?? 0} stories
                </span>
              </div>
              {category.description && (
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {category.description}
                </p>
              )}
              <span className="mt-5 inline-block text-sm font-semibold group-hover:underline">
                View stories →
              </span>
            </Link>
          ))}
        </section>
        <AdSlot height={300} className="lg:sticky lg:top-24 lg:self-start" />
      </div>
    </div>
  );
}

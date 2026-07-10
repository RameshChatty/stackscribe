import { ArrowRight, PenLine, Sparkles } from "lucide-react";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { StoryCard } from "@/components/story-card";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/data/categories";
import { getPopularStories, getPublishedStories } from "@/lib/data/stories";

export default async function HomePage() {
  const [stories, popularStories, categories] = await Promise.all([
    getPublishedStories({ limit: 10 }),
    getPopularStories(5),
    getCategories(),
  ]);

  return (
    <>
      <section className="border-b border-border bg-[#f7f4ed]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_360px] md:items-center md:py-20">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles size={14} /> Learn. Share. Grow.
            </div>
            <h1 className="max-w-3xl font-serif text-5xl leading-[1.04] tracking-tight sm:text-6xl">
              Technical stories that make you a better engineer.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              Read practical engineering guides, prepare for interviews, and
              publish what you learn for developers everywhere.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Start reading</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/write">
                  <PenLine size={18} /> Write a story
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden rounded-3xl border border-black/10 bg-[#1f1f1f] p-7 text-white shadow-xl md:block">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Editor&apos;s note
            </p>
            <blockquote className="mt-4 font-serif text-2xl leading-snug">
              “The best way to understand a technical idea is to explain it
              clearly enough that someone else can use it.”
            </blockquote>
            <div className="mt-6 h-px bg-white/20" />
            <p className="mt-4 text-sm text-white/70">
              Join engineers documenting real lessons from code, interviews,
              architecture, and production.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 overflow-x-auto px-4 py-4 sm:px-6">
          <Link
            href="/categories"
            className="shrink-0 text-sm font-semibold hover:text-accent"
          >
            Explore topics
          </Link>
          <span className="text-muted">›</span>
          {categories.slice(0, 7).map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="shrink-0 rounded-full bg-surface-muted px-4 py-2 text-sm text-muted transition-colors hover:bg-foreground hover:text-white"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="flex items-center justify-between border-b border-foreground pb-3">
            <h2 className="text-lg font-bold">Latest stories</h2>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              All topics <ArrowRight size={15} />
            </Link>
          </div>
          <div>
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <section>
            <h2 className="border-b border-foreground pb-3 text-lg font-bold">
              Popular this week
            </h2>
            <ol className="mt-2">
              {popularStories.map((story, index) => (
                <li key={story.id} className="flex gap-4 py-4">
                  <span className="font-serif text-3xl leading-none text-border">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <Link
                      href={`/story/${story.slug}`}
                      className="font-semibold leading-snug hover:underline"
                    >
                      {story.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {story.author.name} · {story.readingMinutes} min read
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <AdSlot />
        </aside>
      </div>
    </>
  );
}

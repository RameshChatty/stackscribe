import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/ad-slot";
import { LikeButton } from "@/components/like-button";
import { ShareButton } from "@/components/share-button";
import { Avatar } from "@/components/ui/avatar";
import { CategoryBadge } from "@/components/ui/badge";
import { getStoryBySlug } from "@/lib/data/stories";
import { isDatabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return {};
  return {
    title: story.title,
    description: story.summary ?? undefined,
    authors: [{ name: story.author.name }],
    openGraph: {
      type: "article",
      title: story.title,
      description: story.summary ?? undefined,
      publishedTime: story.publishedAt?.toISOString(),
      authors: [story.author.name],
      images: story.coverImage ? [story.coverImage] : undefined,
    },
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const story = await getStoryBySlug(slug, user?.id);
  if (!story || (story.status !== "published" && story.author.id !== user?.id)) {
    notFound();
  }

  const authorHref = story.author.username
    ? `/author/${story.author.username}`
    : "#";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.summary,
    datePublished: story.publishedAt?.toISOString(),
    dateModified: story.updatedAt.toISOString(),
    author: { "@type": "Person", name: story.author.name },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replaceAll("<", "\\u003c"),
        }}
      />
      <article className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,760px)_260px] lg:justify-center">
          <div>
            <header>
              <div className="flex flex-wrap gap-2">
                {story.categories.map((category) => (
                  <CategoryBadge
                    key={category.id}
                    name={category.name}
                    slug={category.slug}
                  />
                ))}
              </div>
              <h1 className="mt-5 font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                {story.title}
              </h1>
              {story.summary && (
                <p className="mt-4 text-xl leading-relaxed text-muted">
                  {story.summary}
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
                <Link href={authorHref} className="flex items-center gap-3 group">
                  <Avatar
                    name={story.author.name}
                    image={story.author.image}
                    size={44}
                  />
                  <span>
                    <span className="block text-sm font-semibold group-hover:underline">
                      {story.author.name}
                    </span>
                    <span className="block text-xs text-muted">
                      {story.readingMinutes} min read ·{" "}
                      {formatDate(story.publishedAt ?? story.createdAt)}
                    </span>
                  </span>
                </Link>
                <div className="flex items-start gap-2">
                  <LikeButton
                    storyId={story.id}
                    initialLiked={story.likedByViewer}
                    initialCount={story.likeCount}
                    isDemo={!isDatabaseConfigured}
                  />
                  <ShareButton />
                </div>
              </div>
            </header>

            {story.coverImage && (
              <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-surface-muted">
                <Image
                  src={story.coverImage}
                  alt={story.title}
                  fill
                  priority
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 760px"
                />
              </div>
            )}

            <div
              className="prose mt-10 max-w-none"
              dangerouslySetInnerHTML={{ __html: story.content }}
            />

            <footer className="mt-12 border-t border-border pt-8">
              <div className="flex flex-wrap gap-2">
                {story.categories.map((category) => (
                  <CategoryBadge
                    key={category.id}
                    name={category.name}
                    slug={category.slug}
                  />
                ))}
              </div>
              <div className="mt-8 flex items-center gap-4 rounded-xl bg-surface-muted p-5">
                <Avatar
                  name={story.author.name}
                  image={story.author.image}
                  size={56}
                />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">
                    Written by
                  </p>
                  <Link href={authorHref} className="font-bold hover:underline">
                    {story.author.name}
                  </Link>
                  {story.author.bio && (
                    <p className="mt-1 text-sm text-muted">{story.author.bio}</p>
                  )}
                </div>
              </div>
            </footer>
          </div>

          <aside className="hidden space-y-6 lg:block">
            <AdSlot height={300} className="sticky top-24" />
          </aside>
        </div>
      </article>
    </>
  );
}

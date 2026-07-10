import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { CategoryBadge } from "@/components/ui/badge";
import type { StorySummary } from "@/lib/data/types";
import { formatDate } from "@/lib/utils";

export function StoryCard({ story }: { story: StorySummary }) {
  const authorHref = story.author.username
    ? `/author/${story.author.username}`
    : "#";
  return (
    <article className="flex flex-col gap-4 border-b border-border py-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted">
          <Avatar
            name={story.author.name}
            image={story.author.image}
            size={24}
          />
          <Link href={authorHref} className="font-medium text-foreground hover:underline">
            {story.author.name}
          </Link>
          <span aria-hidden>·</span>
          <time dateTime={(story.publishedAt ?? story.createdAt).toISOString()}>
            {formatDate(story.publishedAt ?? story.createdAt)}
          </time>
        </div>

        <Link href={`/story/${story.slug}`} className="group block">
          <h3 className="text-xl font-bold leading-snug group-hover:underline">
            {story.title}
          </h3>
          {story.summary && (
            <p className="mt-1 line-clamp-2 text-muted">{story.summary}</p>
          )}
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          {story.categories.slice(0, 2).map((category) => (
            <CategoryBadge
              key={category.id}
              name={category.name}
              slug={category.slug}
            />
          ))}
          <span>{story.readingMinutes} min read</span>
          <span className="inline-flex items-center gap-1">
            <Heart size={13} /> {story.likeCount}
          </span>
        </div>
      </div>

      {story.coverImage && (
        <Link
          href={`/story/${story.slug}`}
          className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-md bg-surface-muted sm:h-24 sm:w-40"
        >
          <Image
            src={story.coverImage}
            alt={story.title}
            fill
            unoptimized
            className="object-cover"
            sizes="160px"
          />
        </Link>
      )}
    </article>
  );
}

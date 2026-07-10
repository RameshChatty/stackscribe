import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoryCard } from "@/components/story-card";
import { Avatar } from "@/components/ui/avatar";
import { getAuthorByUsername, getStoriesByAuthor } from "@/lib/data/stories";

interface AuthorPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { username } = await params;
  const author = await getAuthorByUsername(username);
  if (!author) return {};
  return {
    title: author.name,
    description: author.bio ?? `Read stories written by ${author.name}.`,
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { username } = await params;
  const author = await getAuthorByUsername(username);
  if (!author) notFound();
  const stories = await getStoriesByAuthor(author.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-5 border-b border-foreground pb-8 sm:flex-row sm:items-center">
        <Avatar name={author.name} image={author.image} size={88} />
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-tight">
            {author.name}
          </h1>
          {author.username && (
            <p className="mt-1 text-sm text-muted">@{author.username}</p>
          )}
          {author.bio && (
            <p className="mt-3 max-w-2xl text-muted">{author.bio}</p>
          )}
        </div>
      </header>

      <section>
        <h2 className="py-5 text-sm font-semibold uppercase tracking-wider text-muted">
          Published stories ({stories.length})
        </h2>
        {stories.length > 0 ? (
          stories.map((story) => <StoryCard key={story.id} story={story} />)
        ) : (
          <p className="py-12 text-center text-muted">No published stories yet.</p>
        )}
      </section>
    </div>
  );
}

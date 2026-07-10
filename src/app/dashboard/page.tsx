import { Eye, FileText, Heart, PenLine, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { deleteStory } from "@/lib/actions/stories";
import { getStoriesByAuthor } from "@/lib/data/stories";
import { isDatabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (isDatabaseConfigured && !user) redirect("/login?next=/dashboard");
  const stories = user ? await getStoriesByAuthor(user.id, true) : [];
  const published = stories.filter((story) => story.status === "published");
  const totalLikes = stories.reduce((total, story) => total + story.likeCount, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Creator studio
          </p>
          <h1 className="mt-1 font-serif text-4xl font-bold">
            {user ? `Welcome, ${user.name.split(" ")[0]}` : "Your dashboard"}
          </h1>
          <p className="mt-2 text-muted">
            Create, publish, and manage all of your technical stories.
          </p>
        </div>
        <Button asChild>
          <Link href="/write">
            <PenLine size={17} /> New story
          </Link>
        </Button>
      </div>

      {!isDatabaseConfigured && <SetupNotice />}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Total stories</span>
            <FileText size={18} className="text-muted" />
          </div>
          <p className="mt-3 text-3xl font-bold">{stories.length}</p>
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Published</span>
            <Eye size={18} className="text-muted" />
          </div>
          <p className="mt-3 text-3xl font-bold">{published.length}</p>
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Total likes</span>
            <Heart size={18} className="text-muted" />
          </div>
          <p className="mt-3 text-3xl font-bold">{totalLikes}</p>
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border bg-surface-muted px-5 py-4">
          <h2 className="font-semibold">Your stories</h2>
          <span className="text-xs text-muted">{stories.length} total</span>
        </div>
        {stories.length > 0 ? (
          <div className="divide-y divide-border">
            {stories.map((story) => (
              <article
                key={story.id}
                className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                        story.status === "published"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {story.status}
                    </span>
                    <span className="text-xs text-muted">
                      Updated {formatDate(story.updatedAt)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold">{story.title}</h3>
                  <p className="mt-1 text-xs text-muted">
                    {story.likeCount} likes · {story.readingMinutes} min read
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {story.status === "published" && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/story/${story.slug}`}>View</Link>
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/write/${story.id}`}>Edit</Link>
                  </Button>
                  <form action={deleteStory}>
                    <input type="hidden" name="storyId" value={story.id} />
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${story.title}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <FileText size={30} className="mx-auto text-muted" />
            <h3 className="mt-3 font-semibold">No stories yet</h3>
            <p className="mt-1 text-sm text-muted">
              Start with a lesson, interview note, or production story.
            </p>
            <Button asChild className="mt-5" size="sm">
              <Link href="/write">Write your first story</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

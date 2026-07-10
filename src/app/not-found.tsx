import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <SearchX size={44} className="text-muted" />
      <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-accent">
        404
      </p>
      <h1 className="mt-2 font-serif text-4xl font-bold">Story not found</h1>
      <p className="mt-3 text-muted">
        This page may have moved, been unpublished, or never existed.
      </p>
      <div className="mt-7 flex gap-3">
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/categories">Browse categories</Link>
        </Button>
      </div>
    </div>
  );
}

"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <AlertTriangle size={44} className="text-muted" />
      <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-accent">
        500
      </p>
      <h1 className="mt-2 font-serif text-4xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted">
        We could not load this page. Please try again in a moment.
      </p>
      <Button type="button" onClick={reset} className="mt-7">
        Try again
      </Button>
    </div>
  );
}

"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { toggleLike } from "@/lib/actions/likes";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  storyId: string;
  initialLiked: boolean;
  initialCount: number;
  isDemo?: boolean;
}

export function LikeButton({
  storyId,
  initialLiked,
  initialCount,
  isDemo = false,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (isDemo) {
      setLiked((value) => !value);
      setCount((value) => value + (liked ? -1 : 1));
      setMessage("Preview mode — connect the database to save likes.");
      return;
    }

    const previousLiked = liked;
    const previousCount = count;
    setLiked(!liked);
    setCount(count + (liked ? -1 : 1));
    setMessage("");

    startTransition(async () => {
      const result = await toggleLike(storyId);
      if (!result.ok) {
        setLiked(previousLiked);
        setCount(previousCount);
        if (result.error === "unauthenticated") {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        } else {
          setMessage("Could not update your like. Please try again.");
        }
        return;
      }
      setLiked(Boolean(result.liked));
      setCount(result.likeCount ?? previousCount);
    });
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={liked}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/30",
          liked && "border-red-200 bg-red-50 text-red-600",
        )}
      >
        <Heart size={18} fill={liked ? "currentColor" : "none"} />
        {count}
      </button>
      {message && <span className="max-w-52 text-center text-xs text-muted">{message}</span>}
    </div>
  );
}

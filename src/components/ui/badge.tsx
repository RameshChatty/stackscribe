import Link from "next/link";

import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  slug: string;
  className?: string;
}

export function CategoryBadge({ name, slug, className }: CategoryBadgeProps) {
  return (
    <Link
      href={`/category/${slug}`}
      className={cn(
        "inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10",
        className,
      )}
    >
      {name}
    </Link>
  );
}

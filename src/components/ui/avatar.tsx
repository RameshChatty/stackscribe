import Image from "next/image";

import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  image?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, image, size = 40, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-sm font-semibold text-muted",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{initials(name) || "?"}</span>
      )}
    </span>
  );
}

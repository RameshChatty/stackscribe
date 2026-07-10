import { cn } from "@/lib/utils";

interface AdSlotProps {
  label?: string;
  className?: string;
  height?: number;
}

/**
 * Placeholder ad container. Swap the inner markup for a real ad network
 * (e.g. AdSense) script when monetization is enabled. Kept isolated so ad
 * loading can be lazified without touching page layout.
 */
export function AdSlot({ label = "Advertisement", className, height = 250 }: AdSlotProps) {
  return (
    <aside
      aria-label="Advertisement"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted text-center",
        className,
      )}
      style={{ minHeight: height }}
    >
      <span className="text-[10px] uppercase tracking-widest text-muted">
        {label}
      </span>
      <span className="mt-1 text-xs text-muted/70">Your ad could be here</span>
    </aside>
  );
}

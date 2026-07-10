import { ShieldX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <ShieldX size={44} className="text-muted" />
      <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-accent">
        403
      </p>
      <h1 className="mt-2 font-serif text-4xl font-bold">Access denied</h1>
      <p className="mt-3 text-muted">
        You do not have permission to view or modify this resource.
      </p>
      <Button asChild className="mt-7">
        <Link href="/dashboard">Return to dashboard</Link>
      </Button>
    </div>
  );
}

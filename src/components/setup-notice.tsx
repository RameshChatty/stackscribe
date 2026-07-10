import { Database } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="mx-auto my-10 max-w-2xl rounded-xl border border-border bg-surface-muted p-6">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 shrink-0 text-accent" size={20} />
        <div className="text-sm">
          <p className="font-semibold">Database not configured yet</p>
          <p className="mt-1 text-muted">
            Set <code className="rounded bg-background px-1">DATABASE_URL</code>{" "}
            and{" "}
            <code className="rounded bg-background px-1">
              BETTER_AUTH_SECRET
            </code>{" "}
            in <code className="rounded bg-background px-1">.env.local</code>
            for local development or in Vercel Project Settings for deployment.
            Use <code className="rounded bg-background px-1">.env.example</code>{" "}
            only as a key template, then run{" "}
            <code className="rounded bg-background px-1">npm run db:migrate</code>{" "}
            and{" "}
            <code className="rounded bg-background px-1">
              npm run db:seed
            </code>{" "}
            to populate categories. Restart or redeploy after changing environment
            variables.
          </p>
        </div>
      </div>
    </div>
  );
}

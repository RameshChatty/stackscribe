import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";
import { env, isDatabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f7f4ed] px-4 py-12">
      <Suspense>
        <AuthForm
          mode="login"
          enabled={isDatabaseConfigured}
          githubEnabled={Boolean(env.github.clientId && env.github.clientSecret)}
          googleEnabled={Boolean(env.google.clientId && env.google.clientSecret)}
        />
      </Suspense>
    </div>
  );
}

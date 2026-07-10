"use client";

import { Github, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/auth-client";

interface AuthFormProps {
  mode: "login" | "signup";
  enabled: boolean;
  githubEnabled: boolean;
  googleEnabled: boolean;
}

export function AuthForm({
  mode,
  enabled,
  githubEnabled,
  googleEnabled,
}: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled) {
      setError("Connect PostgreSQL and configure the auth environment first.");
      return;
    }
    setPending(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    try {
      if (mode === "signup") {
        const name = String(formData.get("name"));
        const username = String(formData.get("username")) || undefined;
        const result = await signUp.email({
          name,
          email,
          password,
          username,
          callbackURL: next,
        });
        if (result.error) throw new Error(result.error.message);
      } else {
        const result = await signIn.email({ email, password, callbackURL: next });
        if (result.error) throw new Error(result.error.message);
      }
      router.push(next);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setPending(false);
    }
  }

  async function handleSocial(provider: "github" | "google") {
    if (!enabled) {
      setError("Connect PostgreSQL and configure the auth environment first.");
      return;
    }
    await signIn.social({ provider, callbackURL: next });
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-3xl font-bold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "signup"
            ? "Join developers sharing practical technical knowledge."
            : "Sign in to publish, manage, and like stories."}
        </p>

        {(githubEnabled || googleEnabled) && (
          <div className="mt-6 grid gap-3">
            {githubEnabled && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocial("github")}
              >
                <Github size={18} /> Continue with GitHub
              </Button>
            )}
            {googleEnabled && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocial("google")}
              >
                <span className="font-bold">G</span> Continue with Google
              </Button>
            )}
            <div className="flex items-center gap-3 py-1 text-xs text-muted">
              <span className="h-px flex-1 bg-border" /> or continue with email
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <>
              <label className="block">
                <span className="text-sm font-medium">Display name</span>
                <input
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  autoComplete="name"
                  className="mt-1.5 h-11 w-full rounded-lg border border-border px-3 outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                  placeholder="Ramesh"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Username</span>
                <input
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  pattern="[a-zA-Z0-9_-]+"
                  autoComplete="username"
                  className="mt-1.5 h-11 w-full rounded-lg border border-border px-3 outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                  placeholder="rameshwrites"
                />
              </label>
            </>
          )}
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1.5 h-11 w-full rounded-lg border border-border px-3 outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="mt-1.5 h-11 w-full rounded-lg border border-border px-3 outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder="At least 8 characters"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending && <LoaderCircle size={18} className="animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === "signup" ? "Already have an account?" : "New to StackScribe?"}{" "}
          <Link
            href={mode === "signup" ? "/login" : "/signup"}
            className="font-semibold text-foreground hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
      {!enabled && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-center text-xs text-amber-800">
          Preview mode: configure values from .env.example to enable accounts.
        </p>
      )}
    </div>
  );
}

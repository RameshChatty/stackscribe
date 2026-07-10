import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <span className="text-lg font-bold tracking-tight">
            Stack<span className="text-accent">Scribe</span>
          </span>
          <p className="mt-1 max-w-sm text-sm text-muted">
            A place for developers to publish technical stories and interview
            preparation notes.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/categories" className="hover:text-foreground">
            Categories
          </Link>
          <Link href="/write" className="hover:text-foreground">
            Write
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} StackScribe. Built with Next.js.
      </div>
    </footer>
  );
}

# StackScribe

StackScribe is a full-stack technical publishing platform built with Next.js. Developers can create accounts, publish unlimited technical stories, organize them by category, and like content. Public stories are readable without signing in.

The repository also contains the original 25-chapter Senior Java Developer Interview Guide. The seed script imports those Markdown chapters into PostgreSQL as the initial published story collection.

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4
- PostgreSQL with Drizzle ORM
- Better Auth (email/password, optional GitHub and Google OAuth)
- Tiptap rich-text editor
- Vercel-compatible deployment

## Local setup

Requirements: Node.js 22.13+ and PostgreSQL.

```bash
npm install
cp .env.example .env
```

Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, and application URLs in `.env`. OAuth variables are optional.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Without a database configuration, the public website runs in preview mode using built-in sample stories. Authentication and persistence are disabled until PostgreSQL is configured.

## Commands

```bash
npm run dev          # development server
npm run lint         # ESLint
npm run typecheck    # TypeScript validation
npm run build        # production build
npm run db:generate  # generate SQL migrations
npm run db:migrate   # apply migrations
npm run db:seed      # import categories and the interview chapters
npm run db:studio    # open Drizzle Studio
```

## Deployment

Deploy the application to Vercel and configure the environment variables from `.env.example`. Supabase PostgreSQL works with the standard `DATABASE_URL`; the data layer is portable to any PostgreSQL provider.

For GitHub and Google OAuth, configure each provider callback URL as:

```text
https://your-domain.example/api/auth/callback/github
https://your-domain.example/api/auth/callback/google
```

Run database migrations and the seed script against the production database before opening the site to users.

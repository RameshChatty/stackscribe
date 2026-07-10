const optional = (value: string | undefined): string | undefined =>
  value && value.length > 0 ? value : undefined;

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
  BETTER_AUTH_URL:
    optional(process.env.BETTER_AUTH_URL) ??
    optional(process.env.NEXT_PUBLIC_APP_URL) ??
    "http://localhost:3000",
  APP_URL: optional(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",
  github: {
    clientId: optional(process.env.GITHUB_CLIENT_ID),
    clientSecret: optional(process.env.GITHUB_CLIENT_SECRET),
  },
  google: {
    clientId: optional(process.env.GOOGLE_CLIENT_ID),
    clientSecret: optional(process.env.GOOGLE_CLIENT_SECRET),
  },
};

export const isDatabaseConfigured = env.DATABASE_URL.length > 0;

const optional = (value: string | undefined): string | undefined =>
  value && value.length > 0 ? value : undefined;

const parseOrigins = (value: string | undefined): string[] | undefined => {
  if (!value) return undefined;
  return value.split(",").map((origin) => origin.trim()).filter(Boolean);
};

const betterAuthUrl =
  optional(process.env.BETTER_AUTH_URL) ??
  optional(process.env.NEXT_PUBLIC_APP_URL) ??
  "http://localhost:3000";

const appUrl =
  optional(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000";

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
  BETTER_AUTH_URL: betterAuthUrl,
  BETTER_AUTH_TRUSTED_ORIGINS:
    parseOrigins(process.env.BETTER_AUTH_TRUSTED_ORIGINS) ??
    [...new Set([betterAuthUrl, appUrl].filter((origin): origin is string => Boolean(origin)))],
  APP_URL: appUrl,
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

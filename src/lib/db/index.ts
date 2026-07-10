import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env, isDatabaseConfigured } from "@/lib/env";
import * as schema from "./schema";

/**
 * A single postgres-js client is reused across hot reloads in development so
 * we don't exhaust the connection pool. The data layer is isolated here so the
 * underlying Postgres provider (Supabase, Neon, RDS, ...) can be swapped
 * without touching application code.
 */
const globalForDb = globalThis as unknown as {
  __stackscribeSql?: ReturnType<typeof postgres>;
};

function createClient() {
  if (!isDatabaseConfigured) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure a Postgres connection string.",
    );
  }
  return postgres(env.DATABASE_URL, { max: 10, prepare: false });
}

const client =
  globalForDb.__stackscribeSql ?? (isDatabaseConfigured ? createClient() : undefined);

if (process.env.NODE_ENV !== "production" && client) {
  globalForDb.__stackscribeSql = client;
}

export const db = client
  ? drizzle(client, { schema })
  : (undefined as unknown as ReturnType<typeof drizzle<typeof schema>>);

export { schema };

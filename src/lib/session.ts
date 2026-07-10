import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/env";

export async function getCurrentSession() {
  if (!isDatabaseConfigured) return null;
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

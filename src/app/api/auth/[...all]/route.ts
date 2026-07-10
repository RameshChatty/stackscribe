import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/env";

const handlers = toNextJsHandler(auth);

function unavailable() {
  return Response.json(
    { error: "Authentication is unavailable until PostgreSQL is configured." },
    { status: 503 },
  );
}

export function GET(request: Request) {
  return isDatabaseConfigured ? handlers.GET(request) : unavailable();
}

export function POST(request: Request) {
  return isDatabaseConfigured ? handlers.POST(request) : unavailable();
}

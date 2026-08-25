import { NextRequest } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";

export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return;

  const allowed = new URL(getAppBaseUrl()).origin;
  if (origin !== allowed) {
    throw new Error("INVALID_ORIGIN");
  }
}

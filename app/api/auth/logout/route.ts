import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  await destroySession();
  return NextResponse.redirect(appUrl("/login"), 303);
}

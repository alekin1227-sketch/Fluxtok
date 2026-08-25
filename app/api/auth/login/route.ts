import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${ip}:${email}`.slice(0, 190);

  try {
    await assertLoginAllowed(key);
  } catch {
    return NextResponse.redirect(appUrl("/login?error=rate"), 303);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user?.active ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    await recordLoginFailure(key);
    return NextResponse.redirect(appUrl("/login?error=invalid"), 303);
  }

  await clearLoginFailures(key);
  await createSession(user.id);
  return NextResponse.redirect(appUrl(user.role === "SUPERADMIN" ? "/superadmin" : "/dashboard"), 303);
}

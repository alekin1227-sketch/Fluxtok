import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");

  if (password.length < 12) {
    return NextResponse.redirect(appUrl(`/reset-password?error=1&token=${encodeURIComponent(token)}`), 303);
  }

  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return NextResponse.redirect(appUrl(`/reset-password?error=1&token=${encodeURIComponent(token)}`), 303);
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: hash } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: row.userId } }),
  ]);

  return NextResponse.redirect(appUrl("/login?reset=ok"), 303);
}

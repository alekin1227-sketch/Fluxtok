import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { sendPasswordChanged } from "@/lib/mail";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(12).max(200),
  confirmPassword: z.string().min(12).max(200),
}).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "As senhas não conferem." });

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const form = await req.formData();
  const parsed = schema.safeParse({ token: form.get("token"), password: form.get("password"), confirmPassword: form.get("confirmPassword") });

  if (!parsed.success) {
    const token = String(form.get("token") ?? "").slice(0, 200);
    return NextResponse.redirect(appUrl(`/reset-password?error=1&token=${encodeURIComponent(token)}`), 303);
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: { select: { id: true, email: true, active: true } } },
      });

      if (!row || !row.user.active || row.usedAt || row.expiresAt <= now) throw new Error("INVALID_RESET_TOKEN");

      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) throw new Error("RESET_TOKEN_ALREADY_USED");

      const passwordHash = await bcrypt.hash(password, 12);
      await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
      await tx.session.deleteMany({ where: { userId: row.userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId: row.userId, id: { not: row.id } } });

      return { email: row.user.email };
    });

    await sendPasswordChanged(result.email).catch((error) => {
      console.error("password changed email delivery failed", error instanceof Error ? error.message : "unknown");
    });

    return NextResponse.redirect(appUrl("/login?reset=ok"), 303);
  } catch {
    return NextResponse.redirect(appUrl(`/reset-password?error=1&token=${encodeURIComponent(token)}`), 303);
  }
}

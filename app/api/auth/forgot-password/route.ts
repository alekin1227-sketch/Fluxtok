import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken, randomToken } from "@/lib/security";
import { sendPasswordReset } from "@/lib/mail";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl, getAppBaseUrl } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    await sendPasswordReset(email, `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`);
  }

  return NextResponse.redirect(appUrl("/forgot-password?sent=1"), 303);
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken, randomToken } from "@/lib/security";
import { sendPasswordReset } from "@/lib/mail";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl, getAppBaseUrl } from "@/lib/app-url";
import { consumeActionRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const form = await req.formData();
  const parsed = schema.safeParse({ email: form.get("email") });
  const email = parsed.success ? parsed.data.email : "invalid@example.invalid";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  try {
    await consumeActionRateLimit(`forgot:${ip}:${email}`, { maxAttempts: 4, windowMs: 15 * 60 * 1000, blockMs: 30 * 60 * 1000 });
  } catch {
    // Resposta deliberadamente genérica para não confirmar se o e-mail existe.
    return NextResponse.redirect(appUrl("/forgot-password?sent=1"), 303);
  }

  if (parsed.success) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, active: true } });

    if (user?.active) {
      const token = randomToken();
      const now = new Date();
      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(token),
            expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
          },
        }),
      ]);

      await sendPasswordReset(email, `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`).catch((error) => {
        console.error("password reset email delivery failed", error instanceof Error ? error.message : "unknown");
      });
    }
  }

  return NextResponse.redirect(appUrl("/forgot-password?sent=1"), 303);
}

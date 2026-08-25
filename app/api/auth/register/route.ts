import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { LegalDocument } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { createSession } from "@/lib/auth";
import { uniqueCompanySlug } from "@/lib/slug";
import { audit } from "@/lib/audit";
import { saveAcceptances } from "@/lib/legal";
import { getPlatformSettings } from "@/lib/platform-settings";
import { sendPlatformNotification } from "@/lib/mail";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(150),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(12).max(200),
  terms: z.literal("yes"),
  trialConsent: z.literal("yes"),
  dataConsent: z.literal("yes"),
});

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const f = await req.formData();
  const parsed = schema.safeParse(Object.fromEntries(f));
  if (!parsed.success) return NextResponse.redirect(appUrl("/register?error=invalid"), 303);
  const { name, companyName, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return NextResponse.redirect(appUrl("/register?error=duplicate"), 303);

  try {
    const slug = await uniqueCompanySlug(companyName);
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 86400000);
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          settings: { create: {} },
          subscription: { create: { status: "TRIALING", plan: "STARTER", trialStartsAt: now, trialEndsAt } },
          trial: { create: { trialEndsAt, note: "Criado automaticamente pela V4" } },
        },
      });
      const user = await tx.user.create({ data: { companyId: company.id, name, email, passwordHash, role: "COMPANY_ADMIN" } });
      await saveAcceptances({
        tx,
        companyId: company.id,
        userId: user.id,
        documents: [LegalDocument.TERMS, LegalDocument.PRIVACY, LegalDocument.TRIAL, LegalDocument.DATA_PROCESSING],
        headers: req.headers,
      });
      return { company, user };
    });
    await createSession(result.user.id);
    await audit({ companyId: result.company.id, userId: result.user.id, action: "ACCOUNT_REGISTERED", entity: "company", entityId: result.company.id, metadata: { legalVersion: "2026-08-25-v1" } });
    const platform = await getPlatformSettings();
    if (platform.notificationEmail) await sendPlatformNotification({ to: platform.notificationEmail, subject: "[Fluxtok] Nova conta criada", text: `Nova empresa: ${result.company.name}\nResponsável: ${result.user.name}\nE-mail: ${result.user.email}\nTeste: 7 dias` }).catch((e) => console.error("signup notification", e));
    return NextResponse.redirect(appUrl("/onboarding"), 303);
  } catch (error) {
    console.error("register", error);
    return NextResponse.redirect(appUrl("/register?error=server"), 303);
  }
}

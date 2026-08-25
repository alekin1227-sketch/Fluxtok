import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { createSession } from "@/lib/auth";
import { uniqueCompanySlug } from "@/lib/slug";
import { audit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(150),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(12).max(200),
  terms: z.literal("yes"),
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
          trial: { create: { trialEndsAt, note: "Criado automaticamente pela V3" } },
        },
      });
      const user = await tx.user.create({ data: { companyId: company.id, name, email, passwordHash, role: "COMPANY_ADMIN" } });
      return { company, user };
    });
    await createSession(result.user.id);
    await audit({ companyId: result.company.id, userId: result.user.id, action: "ACCOUNT_REGISTERED", entity: "company", entityId: result.company.id });
    return NextResponse.redirect(appUrl("/onboarding"), 303);
  } catch (error) {
    console.error("register", error);
    return NextResponse.redirect(appUrl("/register?error=server"), 303);
  }
}

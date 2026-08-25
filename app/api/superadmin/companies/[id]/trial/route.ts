import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SubscriptionStatus } from "@prisma/client";
import { requireSuperadmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

const daysSchema = z.coerce.number().int().min(1).max(365);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req);
  const admin = await requireSuperadmin();
  const { id } = await params;
  const form = await req.formData();
  const parsed = daysSchema.safeParse(form.get("days"));
  if (!parsed.success) return NextResponse.redirect(appUrl("/superadmin/empresas?error=invalid-trial"), 303);

  const company = await prisma.company.findUnique({ where: { id }, include: { subscription: true, trial: true } });
  if (!company) return NextResponse.redirect(appUrl("/superadmin/empresas?error=not-found"), 303);

  // Uma assinatura paga ativa não deve voltar a exibir ou receber período gratuito.
  if (company.subscription?.status === SubscriptionStatus.ACTIVE) {
    return NextResponse.redirect(appUrl("/superadmin/empresas?error=active-trial"), 303);
  }

  const now = new Date();
  const base = company.subscription?.status === SubscriptionStatus.TRIALING && company.subscription.trialEndsAt > now
    ? company.subscription.trialEndsAt
    : now;
  const trialEndsAt = new Date(base.getTime() + parsed.data * 86400000);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { companyId: id },
      create: { companyId: id, status: SubscriptionStatus.TRIALING, plan: "STARTER", trialStartsAt: now, trialEndsAt },
      update: { status: SubscriptionStatus.TRIALING, trialStartsAt: now, trialEndsAt },
    }),
    prisma.subscriptionTrial.upsert({
      where: { companyId: id },
      create: { companyId: id, trialEndsAt, note: `+${parsed.data} dia(s) via Superadmin` },
      update: { trialEndsAt, note: `+${parsed.data} dia(s) via Superadmin` },
    }),
  ]);

  await audit({ companyId: id, userId: admin.id, action: "TRIAL_EXTENDED", entity: "subscription", metadata: { days: parsed.data, trialEndsAt: trialEndsAt.toISOString() } });
  return NextResponse.redirect(appUrl("/superadmin/empresas?saved=1"), 303);
}

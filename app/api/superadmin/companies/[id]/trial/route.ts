import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req); const admin = await requireSuperadmin(); const { id } = await params; const form = await req.formData();
  const parsed = z.coerce.number().int().min(1).max(365).safeParse(form.get("days"));
  if (!parsed.success) return NextResponse.redirect(appUrl("/superadmin/empresas?error=days"), 303);
  const company = await prisma.company.findUnique({ where: { id }, include: { subscription: true, trial: true } });
  if (!company) return NextResponse.redirect(appUrl("/superadmin/empresas?error=notfound"), 303);
  const base = company.subscription?.trialEndsAt && company.subscription.trialEndsAt > new Date() ? company.subscription.trialEndsAt : new Date();
  const trialEndsAt = new Date(base.getTime() + parsed.data * 86400000);
  await prisma.$transaction([
    prisma.subscription.upsert({ where: { companyId: id }, create: { companyId: id, status: "TRIALING", plan: "STARTER", trialStartsAt: new Date(), trialEndsAt }, update: company.subscription?.status === "ACTIVE" ? { trialEndsAt } : { trialEndsAt, status: "TRIALING" } }),
    prisma.subscriptionTrial.upsert({ where: { companyId: id }, create: { companyId: id, trialEndsAt, note: `+${parsed.data} dia(s) via Superadmin` }, update: { trialEndsAt, note: `+${parsed.data} dia(s) via Superadmin` } }),
  ]);
  await audit({ companyId: id, userId: admin.id, action: "TRIAL_EXTENDED", entity: "subscription", metadata: { days: parsed.data, trialEndsAt: trialEndsAt.toISOString() } });
  return NextResponse.redirect(appUrl("/superadmin/empresas?saved=1"), 303);
}

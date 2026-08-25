import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDate } from "@/lib/tenant";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req);
  await requireSuperadmin();
  const { id } = await params;
  const form = await req.formData();
  const trialEndsAt = parseDate(form.get("trialEndsAt"));
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return NextResponse.redirect(appUrl("/superadmin?error=notfound"), 303);

  await prisma.subscriptionTrial.upsert({
    where: { companyId: id },
    update: { trialEndsAt },
    create: { companyId: id, trialEndsAt },
  });
  return NextResponse.redirect(appUrl("/superadmin?saved=1"), 303);
}

import { NextRequest, NextResponse } from "next/server";
import { requireCompanyIdentity } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyIdentity();
  await prisma.company.update({ where: { id: user.companyId }, data: { onboardingCompleted: true } });
  return NextResponse.redirect(appUrl("/dashboard"), 303);
}

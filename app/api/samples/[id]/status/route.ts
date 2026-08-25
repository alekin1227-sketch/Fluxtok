import { NextRequest, NextResponse } from "next/server";
import { SampleStatus } from "@prisma/client";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/tenant";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req);
  const user = await requireCompanyUser();
  const { id } = await params;
  const parsed = z.object({ status: z.nativeEnum(SampleStatus) }).safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) return NextResponse.redirect(appUrl("/samples?error=status"), 303);

  const sample = await prisma.sample.findFirst({ where: { id, companyId: user.companyId } });
  if (!sample) return NextResponse.redirect(appUrl("/samples?error=notfound"), 303);

  const now = new Date();
  const data: { status: SampleStatus; statusChangedAt: Date; receivedAt?: Date; contentDueAt?: Date } = {
    status: parsed.data.status,
    statusChangedAt: now,
  };

  if (
    (parsed.data.status === SampleStatus.RECEIVED || parsed.data.status === SampleStatus.WAITING_CONTENT) &&
    !sample.receivedAt
  ) {
    const settings = await getCompanySettings(user.companyId);
    data.receivedAt = now;
    if (!sample.contentDueAt) {
      data.contentDueAt = new Date(now.getTime() + settings.defaultContentDays * 86400000);
    }
  }

  await prisma.sample.update({ where: { id }, data });
  return NextResponse.redirect(appUrl("/samples?saved=1"), 303);
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

const schema = z.object({
  defaultContentDays: z.coerce.number().int().min(1).max(365),
  warningDaysBeforeDue: z.coerce.number().int().min(0).max(60),
  inactiveCreatorDays: z.coerce.number().int().min(1).max(365),
});

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyUser();
  const p = schema.safeParse(Object.fromEntries(await req.formData()));
  if (!p.success) return NextResponse.redirect(appUrl("/settings?error=invalid"), 303);

  await prisma.setting.upsert({
    where: { companyId: user.companyId },
    update: p.data,
    create: { companyId: user.companyId, ...p.data },
  });
  return NextResponse.redirect(appUrl("/settings?saved=1"), 303);
}

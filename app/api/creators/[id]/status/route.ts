import { NextRequest, NextResponse } from "next/server";
import { CreatorStatus } from "@prisma/client";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req);
  const user = await requireCompanyUser();
  const { id } = await params;
  const parsed = z.object({ status: z.nativeEnum(CreatorStatus) }).safeParse(Object.fromEntries(await req.formData()));
  if (!parsed.success) return NextResponse.redirect(appUrl("/creators?error=status"), 303);

  const creator = await prisma.creator.findFirst({ where: { id, companyId: user.companyId } });
  if (!creator) return NextResponse.redirect(appUrl("/creators?error=notfound"), 303);

  await prisma.creator.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.redirect(appUrl("/creators?saved=1"), 303);
}

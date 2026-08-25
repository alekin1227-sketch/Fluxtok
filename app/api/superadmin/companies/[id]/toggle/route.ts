import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  assertSameOrigin(req);
  await requireSuperadmin();
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (company) await prisma.company.update({ where: { id }, data: { active: !company.active } });
  return NextResponse.redirect(appUrl("/superadmin/empresas?saved=1"), 303);
}

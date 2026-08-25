import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyAdmin();
  await prisma.tikTokConnection.deleteMany({ where: { companyId: user.companyId } });
  return NextResponse.redirect(appUrl("/integrations/tiktok?disconnected=1"), 303);
}

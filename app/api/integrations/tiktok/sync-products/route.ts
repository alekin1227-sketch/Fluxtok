import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { syncTikTokProducts } from "@/lib/integrations/tiktok/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyAdmin();
  try {
    const count = await syncTikTokProducts(user.companyId);
    return NextResponse.redirect(appUrl(`/integrations/tiktok?synced=${count}`), 303);
  } catch (error) {
    console.error("tiktok sync", error);
    await prisma.tikTokConnection.updateMany({ where: { companyId: user.companyId }, data: { status: "ERROR", lastError: error instanceof Error ? error.message.slice(0, 1500) : "Erro de sincronização" } });
    return NextResponse.redirect(appUrl("/integrations/tiktok?error=sync"), 303);
  }
}

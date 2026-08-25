import { NextRequest, NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { syncTikTokContentViews, tiktokDisplayConfigured } from "@/lib/integrations/tiktok/display";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyUser();
  if (!tiktokDisplayConfigured()) return NextResponse.redirect(appUrl("/contents?tiktokError=not-configured"), 303);
  try {
    const result = await syncTikTokContentViews(user.companyId);
    await audit({ companyId: user.companyId, userId: user.id, action: "TIKTOK_VIEWS_SYNCED", entity: "content", metadata: result });
    return NextResponse.redirect(appUrl(`/contents?tiktokSynced=${result.updated}&tiktokSkipped=${result.skipped}`), 303);
  } catch (error) {
    console.error("tiktok display sync", error);
    return NextResponse.redirect(appUrl("/contents?tiktokError=sync"), 303);
  }
}

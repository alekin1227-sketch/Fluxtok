import { NextRequest, NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { consumeOAuthState, exchangeCode, saveConnection } from "@/lib/integrations/tiktok/client";
import { audit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error || !code || !state) return NextResponse.redirect(appUrl("/integrations/tiktok?error=denied"), 303);
  const stateRow = await consumeOAuthState(state);
  if (!stateRow) return NextResponse.redirect(appUrl("/integrations/tiktok?error=state"), 303);
  try {
    const token = await exchangeCode(code);
    await saveConnection(stateRow.companyId, token);
    await audit({ companyId: stateRow.companyId, userId: stateRow.userId, action: "TIKTOK_CONNECTED", entity: "integration" });
    return NextResponse.redirect(appUrl("/integrations/tiktok?connected=1"), 303);
  } catch (e) {
    console.error("tiktok callback", e);
    return NextResponse.redirect(appUrl("/integrations/tiktok?error=oauth"), 303);
  }
}

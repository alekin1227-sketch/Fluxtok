import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { createSellerAuthorization } from "@/lib/integrations/tiktok/client";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyAdmin();
  try { return NextResponse.redirect(await createSellerAuthorization(user.companyId, user.id), 303); }
  catch (error) { console.error(error); return NextResponse.redirect(appUrl("/integrations/tiktok?error=config"), 303); }
}

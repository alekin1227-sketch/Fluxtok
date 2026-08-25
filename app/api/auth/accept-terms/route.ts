import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/csrf";
import { requireCompanyIdentityBase } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/app-url";
import { REQUIRED_ACCOUNT_DOCUMENTS, saveAcceptances } from "@/lib/legal";
import { audit } from "@/lib/audit";

const schema = z.object({
  terms: z.literal("yes"),
  trialConsent: z.literal("yes"),
  dataConsent: z.literal("yes"),
});

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyIdentityBase();
  const form = await req.formData();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return NextResponse.redirect(appUrl("/accept-terms?error=consent"), 303);

  await saveAcceptances({
    tx: prisma,
    companyId: user.companyId,
    userId: user.id,
    documents: [...REQUIRED_ACCOUNT_DOCUMENTS],
    headers: req.headers,
  });
  await audit({ companyId: user.companyId, userId: user.id, action: "LEGAL_TERMS_ACCEPTED", entity: "user" });
  return NextResponse.redirect(appUrl("/dashboard"), 303);
}

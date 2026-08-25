import { NextRequest, NextResponse } from "next/server";
import { BillingPlan, LegalDocument } from "@prisma/client";
import { z } from "zod";
import { requireCompanyAdminIdentity } from "@/lib/auth";
import { PLAN_INFO } from "@/lib/billing";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { saveAcceptances } from "@/lib/legal";

const schema = z.object({
  plan: z.nativeEnum(BillingPlan),
  billingConsent: z.literal("yes"),
});

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyAdminIdentity();
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) return NextResponse.redirect(appUrl("/billing?error=not-configured"), 303);
  const f = await req.formData();
  const parsed = schema.safeParse(Object.fromEntries(f));
  if (!parsed.success) return NextResponse.redirect(appUrl("/billing?error=consent"), 303);
  const plan = parsed.data.plan;
  const info = PLAN_INFO[plan];

  try {
    await saveAcceptances({ tx: prisma, companyId: user.companyId, userId: user.id, documents: [LegalDocument.BILLING_RECURRING], headers: req.headers });
    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: `Fluxtok ${info.name}`,
        external_reference: user.companyId,
        payer_email: user.email,
        auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: info.price, currency_id: "BRL" },
        back_url: appUrl("/billing?return=1").toString(),
        status: "pending",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.id || !json.init_point) throw new Error(json.message || "Mercado Pago não retornou checkout.");
    await prisma.subscription.upsert({
      where: { companyId: user.companyId },
      create: { companyId: user.companyId, status: "TRIALING", plan, trialEndsAt: new Date(Date.now() + 7 * 86400000), amount: info.price, externalSubscriptionId: String(json.id) },
      update: { plan, amount: info.price, externalSubscriptionId: String(json.id), provider: "mercadopago" },
    });
    await audit({ companyId: user.companyId, userId: user.id, action: "BILLING_CHECKOUT_CREATED", entity: "subscription", metadata: { plan, amount: info.price } });
    return NextResponse.redirect(json.init_point, 303);
  } catch (error) {
    console.error("billing checkout", error);
    return NextResponse.redirect(appUrl("/billing?error=checkout"), 303);
  }
}

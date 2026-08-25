import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAdminIdentity } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { mapMercadoPagoStatus } from "@/lib/billing";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyAdminIdentity();
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  const local = await prisma.subscription.findUnique({ where: { companyId: user.companyId } });
  if (!token || !local?.externalSubscriptionId) return NextResponse.redirect(appUrl("/billing?error=sync"), 303);
  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(local.externalSubscriptionId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const remote = await res.json();
    if (!res.ok) throw new Error(remote.message || "Falha ao consultar assinatura");
    const status = mapMercadoPagoStatus(remote.status);
    await prisma.subscription.update({
      where: { companyId: user.companyId },
      data: {
        status,
        trialEndsAt: status === "ACTIVE" ? new Date() : undefined,
        amount: remote.auto_recurring?.transaction_amount ? Number(remote.auto_recurring.transaction_amount) : local.amount,
        currentPeriodEnd: remote.next_payment_date ? new Date(remote.next_payment_date) : local.currentPeriodEnd,
      },
    });
    await audit({ companyId: user.companyId, userId: user.id, action: "BILLING_STATUS_SYNCED", entity: "subscription", entityId: local.externalSubscriptionId, metadata: { status: remote.status } });
    return NextResponse.redirect(appUrl("/billing?synced=1"), 303);
  } catch (error) {
    console.error("billing sync", error);
    return NextResponse.redirect(appUrl("/billing?error=sync"), 303);
  }
}

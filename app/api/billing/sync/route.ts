import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAdminIdentity } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { applyMercadoPagoPreapproval, getMercadoPagoPreapproval } from "@/lib/mercadopago-subscription";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyAdminIdentity();
  const local = await prisma.subscription.findUnique({ where: { companyId: user.companyId } });
  const targetId = local?.pendingExternalSubscriptionId || local?.externalSubscriptionId;
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || !targetId) {
    return NextResponse.redirect(appUrl("/billing?error=sync"), 303);
  }

  try {
    const remote = await getMercadoPagoPreapproval(targetId);
    const result = await applyMercadoPagoPreapproval({ companyId: user.companyId, remote, actorUserId: user.id });
    await audit({
      companyId: user.companyId,
      userId: user.id,
      action: "BILLING_STATUS_SYNCED",
      entity: "subscription",
      entityId: targetId,
      metadata: { status: remote.status, pendingChange: Boolean(local?.pendingExternalSubscriptionId), changed: result.changed },
    });
    return NextResponse.redirect(appUrl(`/billing?synced=1${result.activated ? "&activated=1" : ""}`), 303);
  } catch (error) {
    console.error("billing sync", error);
    return NextResponse.redirect(appUrl("/billing?error=sync"), 303);
  }
}

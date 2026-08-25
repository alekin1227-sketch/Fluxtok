import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAdminIdentity } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { cancelMercadoPagoPreapproval } from "@/lib/mercadopago-subscription";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyAdminIdentity();
  const sub = await prisma.subscription.findUnique({ where: { companyId: user.companyId } });
  if (!sub?.pendingExternalSubscriptionId) return NextResponse.redirect(appUrl("/billing"), 303);

  const pendingId = sub.pendingExternalSubscriptionId;
  await cancelMercadoPagoPreapproval(pendingId).catch((error) => {
    console.warn("cancel pending plan change", error);
  });

  await prisma.subscription.update({
    where: { companyId: user.companyId },
    data: {
      pendingPlan: null,
      pendingAmount: null,
      pendingProvider: null,
      pendingExternalSubscriptionId: null,
      pendingCreatedAt: null,
    },
  });

  await audit({
    companyId: user.companyId,
    userId: user.id,
    action: "PLAN_CHANGE_CANCELED",
    entity: "subscription",
    entityId: pendingId,
  });

  return NextResponse.redirect(appUrl("/billing?pendingCanceled=1"), 303);
}

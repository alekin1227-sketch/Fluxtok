import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAdminIdentity } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyAdminIdentity();
  const subscription = user.company.subscription;
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

  if (!subscription?.externalSubscriptionId || !token) {
    return NextResponse.redirect(appUrl("/billing?error=cancel"), 303);
  }

  try {
    const res = await fetch(
      `https://api.mercadopago.com/preapproval/${encodeURIComponent(subscription.externalSubscriptionId)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      },
    );

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Não foi possível cancelar a assinatura.");

    await prisma.subscription.update({
      where: { companyId: user.companyId },
      data: { status: "CANCELED", cancelAtPeriodEnd: false },
    });

    await audit({
      companyId: user.companyId,
      userId: user.id,
      action: "SUBSCRIPTION_CANCELED",
      entity: "subscription",
      entityId: subscription.id,
    });

    return NextResponse.redirect(appUrl("/billing?canceled=1"), 303);
  } catch (error) {
    console.error("billing cancel", error);
    return NextResponse.redirect(appUrl("/billing?error=cancel"), 303);
  }
}

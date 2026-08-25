import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapMercadoPagoStatus, verifyMercadoPagoSignature } from "@/lib/billing";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") || url.searchParams.get("data_id") || url.searchParams.get("id");
  const ok = verifyMercadoPagoSignature({ xSignature: req.headers.get("x-signature"), xRequestId: req.headers.get("x-request-id"), dataId });
  if (!ok) return new NextResponse("invalid signature", { status: 401 });
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token || !dataId) return NextResponse.json({ ok: true });
  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const subscription = await res.json();
    if (!res.ok) throw new Error(subscription.message || "Falha ao consultar assinatura");
    const companyId = String(subscription.external_reference || "");
    if (companyId) {
      await prisma.subscription.upsert({
        where: { companyId },
        create: {
          companyId,
          status: mapMercadoPagoStatus(subscription.status),
          trialEndsAt: new Date(),
          externalSubscriptionId: String(subscription.id),
          amount: subscription.auto_recurring?.transaction_amount ? Number(subscription.auto_recurring.transaction_amount) : null,
          currentPeriodEnd: subscription.next_payment_date ? new Date(subscription.next_payment_date) : null,
        },
        update: {
          status: mapMercadoPagoStatus(subscription.status),
          externalSubscriptionId: String(subscription.id),
          amount: subscription.auto_recurring?.transaction_amount ? Number(subscription.auto_recurring.transaction_amount) : undefined,
          currentPeriodEnd: subscription.next_payment_date ? new Date(subscription.next_payment_date) : undefined,
        },
      });
    }
  } catch (error) {
    console.error("mercadopago webhook", error);
  }
  return NextResponse.json({ ok: true });
}

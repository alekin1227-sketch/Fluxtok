import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapMercadoPagoStatus, verifyMercadoPagoSignature } from "@/lib/billing";
import { audit } from "@/lib/audit";
import { getPlatformSettings } from "@/lib/platform-settings";
import { sendPlatformNotification } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }

  const dataId = String(body?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("data_id") || url.searchParams.get("id") || "");
  const topic = String(body?.type || body?.topic || url.searchParams.get("type") || url.searchParams.get("topic") || "");
  const ok = verifyMercadoPagoSignature({ xSignature: req.headers.get("x-signature"), xRequestId: req.headers.get("x-request-id"), dataId: dataId || null });
  if (!ok) return new NextResponse("invalid signature", { status: 401 });

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token || !dataId) return NextResponse.json({ ok: true });

  // Este endpoint atualiza assinatura somente para eventos de preapproval.
  // Eventos de payment/authorized_payment podem ser adicionados depois sem misturar IDs diferentes.
  if (topic && !topic.includes("subscription_preapproval") && topic !== "preapproval") return NextResponse.json({ ok: true });

  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const subscription = await res.json();
    if (!res.ok) throw new Error(subscription.message || "Falha ao consultar assinatura");
    const companyId = String(subscription.external_reference || "");
    if (companyId) {
      const status = mapMercadoPagoStatus(subscription.status);
      await prisma.subscription.upsert({
        where: { companyId },
        create: {
          companyId,
          status,
          trialEndsAt: new Date(),
          externalSubscriptionId: String(subscription.id),
          amount: subscription.auto_recurring?.transaction_amount ? Number(subscription.auto_recurring.transaction_amount) : null,
          currentPeriodEnd: subscription.next_payment_date ? new Date(subscription.next_payment_date) : null,
        },
        update: {
          status,
          externalSubscriptionId: String(subscription.id),
          amount: subscription.auto_recurring?.transaction_amount ? Number(subscription.auto_recurring.transaction_amount) : undefined,
          currentPeriodEnd: subscription.next_payment_date ? new Date(subscription.next_payment_date) : undefined,
        },
      });
      await audit({ companyId, action: "MERCADOPAGO_SUBSCRIPTION_UPDATED", entity: "subscription", entityId: String(subscription.id), metadata: { status: subscription.status } });
      if (status === "ACTIVE") {
        const platform = await getPlatformSettings();
        if (platform.notificationEmail) await sendPlatformNotification({ to: platform.notificationEmail, subject: "[Fluxtok] Assinatura ativada", text: `Empresa ${companyId} ativou uma assinatura no Mercado Pago.\nStatus: ${subscription.status}\nAssinatura: ${subscription.id}` }).catch((e) => console.error("billing notification", e));
      }
    }
  } catch (error) {
    console.error("mercadopago webhook", error);
    return new NextResponse("temporary error", { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

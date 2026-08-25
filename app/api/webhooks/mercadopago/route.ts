import { NextRequest, NextResponse } from "next/server";
import { verifyMercadoPagoSignature } from "@/lib/billing";
import { getPlatformSettings } from "@/lib/platform-settings";
import { sendPlatformNotification } from "@/lib/mail";
import { applyMercadoPagoPixPayment, getMercadoPagoPayment } from "@/lib/pix";
import { applyMercadoPagoPreapproval, getMercadoPagoPreapproval } from "@/lib/mercadopago-subscription";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }

  const dataId = String(body?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("data_id") || url.searchParams.get("id") || "");
  const topic = String(body?.type || body?.topic || url.searchParams.get("type") || url.searchParams.get("topic") || "");
  const ok = verifyMercadoPagoSignature({ xSignature: req.headers.get("x-signature"), xRequestId: req.headers.get("x-request-id"), dataId: dataId || null });
  if (!ok) return new NextResponse("invalid signature", { status: 401 });

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || !dataId) return NextResponse.json({ ok: true });

  try {
    if (topic === "payment" || topic === "payments") {
      const payment = await getMercadoPagoPayment(dataId);
      const result = await applyMercadoPagoPixPayment(payment);
      if (result.activated && result.companyId) {
        const platform = await getPlatformSettings();
        if (platform.notificationEmail) {
          await sendPlatformNotification({
            to: platform.notificationEmail,
            subject: "[Fluxtok] Pix aprovado",
            text: `Empresa ${result.companyId} teve um pagamento Pix aprovado no Mercado Pago.\nPagamento: ${dataId}`,
          }).catch((e) => console.error("pix notification", e));
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (topic && !topic.includes("subscription_preapproval") && topic !== "preapproval") {
      return NextResponse.json({ ok: true });
    }

    const subscription = await getMercadoPagoPreapproval(dataId);
    const companyId = String(subscription.external_reference || "");
    if (companyId) {
      const result = await applyMercadoPagoPreapproval({ companyId, remote: subscription });
      if (result.activated) {
        const platform = await getPlatformSettings();
        if (platform.notificationEmail) {
          await sendPlatformNotification({
            to: platform.notificationEmail,
            subject: "[Fluxtok] Assinatura ativada",
            text: `Empresa ${companyId} ativou uma assinatura no Mercado Pago.\nStatus: ${subscription.status}\nAssinatura: ${subscription.id}`,
          }).catch((e) => console.error("billing notification", e));
        }
      }
    }
  } catch (error) {
    console.error("mercadopago webhook", error);
    return new NextResponse("temporary error", { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

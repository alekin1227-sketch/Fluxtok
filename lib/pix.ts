import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export type MercadoPagoPayment = {
  id?: number | string;
  status?: string;
  payment_method_id?: string;
  transaction_amount?: number;
  external_reference?: string | null;
  date_of_expiration?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string | null;
      qr_code_base64?: string | null;
      ticket_url?: string | null;
    };
  };
  message?: string;
  error?: string;
  cause?: unknown;
};

export async function getMercadoPagoPayment(externalPaymentId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN ausente.");

  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(externalPaymentId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  const payment = (await res.json()) as MercadoPagoPayment;
  if (!res.ok || !payment.id) {
    throw new Error(payment.message || payment.error || "Falha ao consultar pagamento Pix no Mercado Pago.");
  }

  return payment;
}

function sameAmount(a: number, b: number) {
  return Math.abs(a - b) < 0.001;
}

/**
 * Atualiza o pagamento local com base no objeto oficial do Mercado Pago.
 * A liberação dos 30 dias é idempotente: um mesmo pagamento aprovado só
 * consegue estender o acesso uma única vez, mesmo com Webhooks repetidos.
 */
export async function applyMercadoPagoPixPayment(payment: MercadoPagoPayment, actorUserId?: string | null) {
  const localId = String(payment.external_reference || "");
  const externalId = payment.id ? String(payment.id) : "";
  if (!localId || !externalId) return { handled: false, activated: false };

  const local = await prisma.pixPayment.findUnique({ where: { id: localId } });
  if (!local) return { handled: false, activated: false };

  if (local.externalPaymentId && local.externalPaymentId !== externalId) {
    throw new Error("ID do pagamento Mercado Pago não corresponde ao registro Pix local.");
  }

  if (payment.payment_method_id && payment.payment_method_id !== "pix") {
    throw new Error("O pagamento recebido não é Pix.");
  }

  const remoteAmount = Number(payment.transaction_amount ?? NaN);
  if (!Number.isFinite(remoteAmount) || !sameAmount(remoteAmount, Number(local.amount))) {
    throw new Error("Valor do pagamento Pix não corresponde ao valor criado no Fluxtok.");
  }

  const remoteStatus = String(payment.status || "unknown");
  const txData = payment.point_of_interaction?.transaction_data;
  const expiresAt = payment.date_of_expiration ? new Date(payment.date_of_expiration) : null;

  if (remoteStatus !== "approved") {
    await prisma.pixPayment.update({
      where: { id: local.id },
      data: {
        externalPaymentId: externalId,
        status: remoteStatus,
        qrCode: txData?.qr_code ?? undefined,
        qrCodeBase64: txData?.qr_code_base64 ?? undefined,
        ticketUrl: txData?.ticket_url ?? undefined,
        expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : undefined,
      },
    });
    return { handled: true, activated: false, companyId: local.companyId, localId: local.id };
  }

  const result = await prisma.$transaction(async (tx) => {
    // Claim atômico. Se outro Webhook já aprovou, count será 0 e não soma 30 dias novamente.
    const claimed = await tx.pixPayment.updateMany({
      where: { id: local.id, approvedAt: null },
      data: {
        externalPaymentId: externalId,
        status: "approved",
        approvedAt: new Date(),
        qrCode: txData?.qr_code ?? undefined,
        qrCodeBase64: txData?.qr_code_base64 ?? undefined,
        ticketUrl: txData?.ticket_url ?? undefined,
        expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : undefined,
      },
    });

    if (!claimed.count) {
      return { activated: false, periodEnd: null as Date | null };
    }

    const existing = await tx.subscription.findUnique({ where: { companyId: local.companyId } });
    const now = new Date();
    let startFrom = now;

    // Renovação antecipada de outro Pix preserva apenas período PAGO já adquirido.
    // Dias de teste não são somados ao período pago: ao pagar, o teste termina.
    if (
      existing?.status === SubscriptionStatus.ACTIVE &&
      existing.provider === "mercadopago_pix" &&
      existing.currentPeriodEnd &&
      existing.currentPeriodEnd > startFrom
    ) {
      startFrom = existing.currentPeriodEnd;
    }

    const periodEnd = new Date(startFrom.getTime() + 30 * 86400000);

    await tx.subscription.upsert({
      where: { companyId: local.companyId },
      create: {
        companyId: local.companyId,
        status: SubscriptionStatus.ACTIVE,
        plan: local.plan,
        trialEndsAt: now,
        currentPeriodEnd: periodEnd,
        amount: local.amount,
        currency: "BRL",
        provider: "mercadopago_pix",
        externalSubscriptionId: null,
        cancelAtPeriodEnd: false,
      },
      update: {
        status: SubscriptionStatus.ACTIVE,
        plan: local.plan,
        trialEndsAt: now,
        currentPeriodEnd: periodEnd,
        amount: local.amount,
        currency: "BRL",
        provider: "mercadopago_pix",
        externalSubscriptionId: null,
        cancelAtPeriodEnd: false,
      },
    });

    return { activated: true, periodEnd };
  });

  const { activated, periodEnd } = result;

  if (activated) {
    await audit({
      companyId: local.companyId,
      userId: actorUserId || local.userId,
      action: "PIX_PAYMENT_APPROVED",
      entity: "pix_payment",
      entityId: local.id,
      metadata: {
        plan: local.plan,
        amount: Number(local.amount),
        externalPaymentId: externalId,
        currentPeriodEnd: periodEnd?.toISOString() || null,
      },
    });
  }

  return {
    handled: true,
    activated,
    companyId: local.companyId,
    localId: local.id,
    periodEnd,
  };
}

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";
import { requireCompanyAdminIdentity } from "@/lib/auth";
import { isMercadoPagoCardProvider, PLAN_INFO } from "@/lib/billing";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { LEGAL_VERSION, requestLegalMeta } from "@/lib/legal";
import { applyMercadoPagoPixPayment, type MercadoPagoPayment } from "@/lib/pix";

const schema = z.object({
  plan: z.nativeEnum(BillingPlan),
  document: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 11 || value.length === 14, "CPF/CNPJ inválido"),
  pixConsent: z.literal("yes"),
  payerEmail: z.string().trim().email().max(254).optional(),
});

function maskDocument(value: string) {
  if (value.length <= 4) return "***";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function maskEmail(value: string) {
  const at = value.lastIndexOf("@");
  return at >= 0 ? `***@${value.slice(at + 1)}` : "***";
}

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const user = await requireCompanyAdminIdentity();
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) return NextResponse.redirect(appUrl("/billing?error=not-configured"), 303);

  const form = await req.formData();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return NextResponse.redirect(appUrl("/billing?error=pix-data"), 303);

  const plan = parsed.data.plan;
  const document = parsed.data.document;
  const payerEmail = parsed.data.payerEmail?.trim().toLowerCase() || user.email.trim().toLowerCase();
  const info = PLAN_INFO[plan];

  const current = await prisma.subscription.findUnique({ where: { companyId: user.companyId } });
  if (
    current?.status === SubscriptionStatus.ACTIVE &&
    isMercadoPagoCardProvider(current.provider) &&
    current.externalSubscriptionId
  ) {
    return NextResponse.redirect(appUrl("/billing?error=pix-active-card"), 303);
  }

  const idempotencyKey = crypto.randomUUID();
  const legalMeta = requestLegalMeta(req.headers);
  const local = await prisma.pixPayment.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      plan,
      amount: info.price,
      status: "creating",
      idempotencyKey,
      consentVersion: LEGAL_VERSION,
      consentIpHash: legalMeta.ipHash,
      consentUserAgent: legalMeta.userAgent,
    },
  });

  try {
    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: info.price,
        description: `Fluxtok ${info.name} - 30 dias`,
        payment_method_id: "pix",
        external_reference: local.id,
        notification_url: appUrl("/api/webhooks/mercadopago").toString(),
        payer: {
          email: payerEmail,
          first_name: user.name.split(" ")[0] || user.name,
          identification: {
            type: document.length === 14 ? "CNPJ" : "CPF",
            number: document,
          },
        },
        metadata: {
          company_id: user.companyId,
          plan,
          source: "fluxtok_pix",
        },
      }),
    });

    const payment = (await res.json()) as MercadoPagoPayment;
    if (!res.ok || !payment.id) {
      console.error("mercadopago pix create", {
        status: res.status,
        document: maskDocument(document),
        payer: maskEmail(payerEmail),
        message: payment?.message,
        error: payment?.error,
        cause: payment?.cause,
      });
      await prisma.pixPayment.update({ where: { id: local.id }, data: { status: "error" } });
      throw new Error(payment.message || payment.error || "Mercado Pago não criou o Pix.");
    }

    const transactionData = payment.point_of_interaction?.transaction_data;
    const expiresAt = payment.date_of_expiration ? new Date(payment.date_of_expiration) : null;

    await prisma.pixPayment.update({
      where: { id: local.id },
      data: {
        externalPaymentId: String(payment.id),
        status: String(payment.status || "pending"),
        qrCode: transactionData?.qr_code || null,
        qrCodeBase64: transactionData?.qr_code_base64 || null,
        ticketUrl: transactionData?.ticket_url || null,
        expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
      },
    });

    if (payment.status === "approved") {
      await applyMercadoPagoPixPayment(payment, user.id);
    }

    await audit({
      companyId: user.companyId,
      userId: user.id,
      action: "PIX_PAYMENT_CREATED",
      entity: "pix_payment",
      entityId: local.id,
      metadata: {
        plan,
        amount: info.price,
        externalPaymentId: String(payment.id),
        payerEmailMatchesAccount: payerEmail === user.email.trim().toLowerCase(),
      },
    });

    return NextResponse.redirect(appUrl(`/billing/pix/${local.id}`), 303);
  } catch (error) {
    console.error("billing pix create", error);
    await prisma.pixPayment.updateMany({ where: { id: local.id, status: "creating" }, data: { status: "error" } });
    return NextResponse.redirect(appUrl("/billing?error=pix"), 303);
  }
}

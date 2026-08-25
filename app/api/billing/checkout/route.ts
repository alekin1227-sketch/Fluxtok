import { NextRequest, NextResponse } from "next/server";
import { BillingPlan, LegalDocument, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";
import { requireCompanyAdminIdentity } from "@/lib/auth";
import { PLAN_INFO } from "@/lib/billing";
import { assertSameOrigin } from "@/lib/csrf";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { saveAcceptances } from "@/lib/legal";
import { cancelMercadoPagoPreapproval } from "@/lib/mercadopago-subscription";

const schema = z.object({
  plan: z.nativeEnum(BillingPlan),
  billingConsent: z.literal("yes"),
  payerEmail: z.string().trim().email().max(254).optional(),
});

function mercadoPagoMode() {
  return process.env.MERCADOPAGO_MODE?.trim().toLowerCase() === "test" ? "test" : "production";
}

function mercadoPagoPayerEmail(requestedEmail: string) {
  if (mercadoPagoMode() !== "test") return requestedEmail.trim().toLowerCase();
  const configured = process.env.MERCADOPAGO_TEST_PAYER_EMAIL?.trim().toLowerCase();
  if (!configured) {
    throw new Error(
      "MERCADOPAGO_TEST_PAYER_EMAIL ausente. Em teste de Assinaturas, use o e-mail EXATO da conta Comprador de teste do mesmo país/site do Vendedor de teste."
    );
  }
  return configured;
}

function emailDomain(email: string) {
  const at = email.lastIndexOf("@");
  return at >= 0 ? `***@${email.slice(at + 1)}` : "***";
}

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
  const mode = mercadoPagoMode();

  try {
    const requestedPayerEmail = parsed.data.payerEmail?.trim().toLowerCase() || user.email.trim().toLowerCase();
    const payerEmail = mercadoPagoPayerEmail(requestedPayerEmail);

    await saveAcceptances({
      tx: prisma,
      companyId: user.companyId,
      userId: user.id,
      documents: [LegalDocument.BILLING_RECURRING],
      headers: req.headers,
    });

    const current = await prisma.subscription.findUnique({ where: { companyId: user.companyId } });

    // Um checkout pendente anterior não deve ficar abandonado no Mercado Pago.
    if (current?.pendingExternalSubscriptionId) {
      await cancelMercadoPagoPreapproval(current.pendingExternalSubscriptionId).catch((error) => {
        console.warn("cancel previous pending preapproval", error);
      });
    }

    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: `Fluxtok ${info.name}`,
        external_reference: user.companyId,
        payer_email: payerEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: info.price,
          currency_id: "BRL",
        },
        back_url: appUrl("/billing?return=1").toString(),
        status: "pending",
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.id || !json.init_point) {
      console.error("mercadopago preapproval", {
        mode,
        status: res.status,
        payer: emailDomain(payerEmail),
        message: json?.message,
        error: json?.error,
        cause: json?.cause,
      });
      throw new Error(json.message || "Mercado Pago não retornou checkout.");
    }

    // REGRA CRÍTICA: iniciar checkout NÃO muda status, plano ou benefício atual.
    // A troca só acontece após o Mercado Pago confirmar authorized.
    await prisma.subscription.upsert({
      where: { companyId: user.companyId },
      create: {
        companyId: user.companyId,
        status: SubscriptionStatus.TRIALING,
        plan: BillingPlan.STARTER,
        trialEndsAt: new Date(),
        pendingPlan: plan,
        pendingAmount: info.price,
        pendingProvider: "mercadopago",
        pendingExternalSubscriptionId: String(json.id),
        pendingCreatedAt: new Date(),
      },
      update: {
        pendingPlan: plan,
        pendingAmount: info.price,
        pendingProvider: "mercadopago",
        pendingExternalSubscriptionId: String(json.id),
        pendingCreatedAt: new Date(),
      },
    });

    await audit({
      companyId: user.companyId,
      userId: user.id,
      action: current?.status === SubscriptionStatus.ACTIVE ? "PLAN_CHANGE_CHECKOUT_CREATED" : "BILLING_CHECKOUT_CREATED",
      entity: "subscription",
      metadata: {
        currentPlan: current?.plan || null,
        targetPlan: plan,
        amount: info.price,
        mercadoPagoMode: mode,
        payerEmailMatchesAccount: payerEmail === user.email.trim().toLowerCase(),
      },
    });

    return NextResponse.redirect(String(json.init_point), 303);
  } catch (error) {
    console.error("billing checkout", error);
    return NextResponse.redirect(appUrl("/billing?error=checkout"), 303);
  }
}

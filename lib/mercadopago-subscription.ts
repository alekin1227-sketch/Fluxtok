import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { isMercadoPagoCardProvider, mapMercadoPagoStatus } from "@/lib/billing";

export type MercadoPagoPreapproval = {
  id?: string | number;
  status?: string;
  external_reference?: string | null;
  next_payment_date?: string | null;
  auto_recurring?: { transaction_amount?: number | null; frequency?: number | null; frequency_type?: string | null };
  message?: string;
};

export async function getMercadoPagoPreapproval(id: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN ausente.");
  const res = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const remote = (await res.json()) as MercadoPagoPreapproval;
  if (!res.ok || !remote.id) throw new Error(remote.message || "Falha ao consultar assinatura no Mercado Pago.");
  return remote;
}

export async function cancelMercadoPagoPreapproval(id: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN ausente.");
  const res = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || "Falha ao cancelar assinatura anterior no Mercado Pago.");
}

function validDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Aplica o estado oficial do Mercado Pago sem destruir o plano vigente.
 * Uma troca de plano só vira o plano atual quando o novo preapproval fica authorized.
 */
export async function applyMercadoPagoPreapproval(args: {
  companyId: string;
  remote: MercadoPagoPreapproval;
  actorUserId?: string | null;
}) {
  const remoteId = String(args.remote.id || "");
  if (!remoteId) return { handled: false, changed: false };

  const local = await prisma.subscription.findUnique({ where: { companyId: args.companyId } });
  if (!local) return { handled: false, changed: false };

  const isPendingChange = local.pendingExternalSubscriptionId === remoteId;
  const isCurrentSubscription = local.externalSubscriptionId === remoteId;
  if (!isPendingChange && !isCurrentSubscription) return { handled: false, changed: false };

  const mapped = mapMercadoPagoStatus(args.remote.status);
  const remoteAmount = Number(args.remote.auto_recurring?.transaction_amount ?? NaN);
  const nextPaymentDate = validDate(args.remote.next_payment_date);

  if (isPendingChange) {
    if (mapped === SubscriptionStatus.ACTIVE) {
      const targetPlan = local.pendingPlan || local.plan;
      const targetAmount = Number.isFinite(remoteAmount)
        ? remoteAmount
        : Number(local.pendingAmount ?? local.amount ?? 0);

      // Se já havia cartão recorrente, cancele o antigo somente DEPOIS que o novo foi autorizado.
      if (
        local.status === SubscriptionStatus.ACTIVE &&
        isMercadoPagoCardProvider(local.provider) &&
        local.externalSubscriptionId &&
        local.externalSubscriptionId !== remoteId
      ) {
        await cancelMercadoPagoPreapproval(local.externalSubscriptionId);
      }

      const targetProvider = local.pendingProvider || "mercadopago";

      await prisma.subscription.update({
        where: { companyId: args.companyId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          plan: targetPlan,
          amount: Number.isFinite(targetAmount) && targetAmount > 0 ? targetAmount : undefined,
          provider: targetProvider,
          externalSubscriptionId: remoteId,
          currentPeriodEnd: nextPaymentDate,
          trialEndsAt: new Date(),
          cancelAtPeriodEnd: false,
          pendingPlan: null,
          pendingAmount: null,
          pendingProvider: null,
          pendingExternalSubscriptionId: null,
          pendingCreatedAt: null,
        },
      });

      await audit({
        companyId: args.companyId,
        userId: args.actorUserId || undefined,
        action: "PLAN_CHANGE_ACTIVATED",
        entity: "subscription",
        entityId: remoteId,
        metadata: { plan: targetPlan, amount: targetAmount, provider: targetProvider },
      });

      return { handled: true, changed: true, activated: true, plan: targetPlan };
    }

    if (mapped === SubscriptionStatus.CANCELED) {
      await prisma.subscription.update({
        where: { companyId: args.companyId },
        data: {
          pendingPlan: null,
          pendingAmount: null,
          pendingProvider: null,
          pendingExternalSubscriptionId: null,
          pendingCreatedAt: null,
        },
      });
      return { handled: true, changed: true, activated: false };
    }

    // pending/paused/qualquer estado ainda não aprovado: plano atual permanece intacto.
    return { handled: true, changed: false, activated: false };
  }

  // Atualização da assinatura que já é a vigente.
  if (!mapped) return { handled: true, changed: false, activated: local.status === SubscriptionStatus.ACTIVE };

  await prisma.subscription.update({
    where: { companyId: args.companyId },
    data: {
      status: mapped,
      trialEndsAt: mapped === SubscriptionStatus.ACTIVE ? new Date() : undefined,
      amount: Number.isFinite(remoteAmount) ? remoteAmount : undefined,
      currentPeriodEnd: nextPaymentDate ?? undefined,
    },
  });

  return { handled: true, changed: true, activated: mapped === SubscriptionStatus.ACTIVE };
}

/**
 * Corrige automaticamente o bug antigo em que iniciar uma troca podia transformar
 * um Pix pago em TRIALING/PRO antes do pagamento novo ser concluído.
 */
export async function repairInterruptedPaidPixUpgrade(companyId: string) {
  const sub = await prisma.subscription.findUnique({ where: { companyId } });
  const now = new Date();
  if (!sub || sub.status !== SubscriptionStatus.TRIALING || !sub.currentPeriodEnd || sub.currentPeriodEnd <= now) return false;

  const latestPaidPix = await prisma.pixPayment.findFirst({
    where: { companyId, status: "approved", approvedAt: { not: null } },
    orderBy: { approvedAt: "desc" },
  });
  if (!latestPaidPix) return false;

  const attemptedPlan = sub.plan;
  const attemptedAmount = sub.amount;
  const attemptedExternalId = sub.externalSubscriptionId;

  await prisma.subscription.update({
    where: { companyId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      plan: latestPaidPix.plan,
      amount: latestPaidPix.amount,
      provider: "mercadopago_pix",
      externalSubscriptionId: null,
      trialEndsAt: now,
      pendingPlan: attemptedExternalId ? attemptedPlan : null,
      pendingAmount: attemptedExternalId ? attemptedAmount : null,
      pendingProvider: attemptedExternalId ? "mercadopago" : null,
      pendingExternalSubscriptionId: attemptedExternalId,
      pendingCreatedAt: attemptedExternalId ? sub.updatedAt : null,
    },
  });

  await audit({
    companyId,
    action: "SUBSCRIPTION_AUTO_REPAIRED",
    entity: "subscription",
    entityId: sub.id,
    metadata: {
      restoredPlan: latestPaidPix.plan,
      preservedPaidUntil: sub.currentPeriodEnd.toISOString(),
      pendingPlan: attemptedExternalId ? attemptedPlan : null,
    },
  });
  return true;
}

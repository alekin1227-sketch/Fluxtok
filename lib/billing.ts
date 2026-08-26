import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import crypto from "crypto";

export type BillingCycle = "MONTHLY" | "ANNUAL";

function envNumber(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const normalized = raw.replace(",", ".").replace(/[^0-9.-]/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : fallback;
}

function envPrice(name: string, fallback: number) {
  const value = envNumber(name, fallback);
  return value > 0 ? value : fallback;
}

function moneyRound(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const ANNUAL_DISCOUNT_PERCENT = Math.min(
  50,
  Math.max(0, envNumber("FLUXTOK_ANNUAL_DISCOUNT_PERCENT", 10)),
);

export const PLAN_INFO: Record<
  BillingPlan,
  { name: string; price: number; description: string; features: string[] }
> = {
  STARTER: {
    name: "Essencial",
    price: envPrice("FLUXTOK_STARTER_PRICE", 49.9),
    description: "Para lojas iniciando a operação com creators.",
    features: [
      "Creators, produtos e amostras",
      "FluxRadar e FluxScore",
      "Campanhas e pendências",
      "TikTok Shop",
      "Suporte interno",
      "Até 3 usuários",
    ],
  },
  PRO: {
    name: "Pro",
    price: envPrice("FLUXTOK_PRO_PRICE", 79.9),
    description: "Para operações que precisam de mais equipe e acompanhamento.",
    features: [
      "Tudo do Essencial",
      "Usuários adicionais",
      "Indicadores e auditoria",
      "Suporte prioritário",
      "Prioridade em novos recursos",
    ],
  },
};

export function annualPrice(plan: BillingPlan) {
  const envName = plan === BillingPlan.STARTER ? "FLUXTOK_STARTER_ANNUAL_PRICE" : "FLUXTOK_PRO_ANNUAL_PRICE";
  const monthly = PLAN_INFO[plan].price;
  const calculated = monthly * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100);
  return moneyRound(envPrice(envName, calculated));
}

export function annualSavings(plan: BillingPlan) {
  return moneyRound(PLAN_INFO[plan].price * 12 - annualPrice(plan));
}

export function annualMonthlyEquivalent(plan: BillingPlan) {
  return moneyRound(annualPrice(plan) / 12);
}

export function billingProviderForCycle(cycle: BillingCycle) {
  return cycle === "ANNUAL" ? "mercadopago_annual" : "mercadopago_monthly";
}

export function billingCycleFromProvider(provider?: string | null): BillingCycle {
  return provider === "mercadopago_annual" ? "ANNUAL" : "MONTHLY";
}

export function billingCycleLabel(cycle: BillingCycle) {
  return cycle === "ANNUAL" ? "Anual" : "Mensal";
}

export function isMercadoPagoCardProvider(provider?: string | null) {
  return provider === "mercadopago" || provider === "mercadopago_monthly" || provider === "mercadopago_annual";
}

export function billingOffer(plan: BillingPlan, cycle: BillingCycle) {
  const monthlyPrice = PLAN_INFO[plan].price;
  if (cycle === "ANNUAL") {
    return {
      cycle,
      provider: billingProviderForCycle(cycle),
      amount: annualPrice(plan),
      frequency: 12,
      frequencyType: "months" as const,
      label: "Anual",
      monthlyEquivalent: annualMonthlyEquivalent(plan),
      savings: annualSavings(plan),
    };
  }

  return {
    cycle,
    provider: billingProviderForCycle(cycle),
    amount: monthlyPrice,
    frequency: 1,
    frequencyType: "months" as const,
    label: "Mensal",
    monthlyEquivalent: monthlyPrice,
    savings: 0,
  };
}

export function mapMercadoPagoStatus(status?: string): SubscriptionStatus | null {
  if (status === "authorized") return SubscriptionStatus.ACTIVE;
  if (status === "paused") return SubscriptionStatus.PAST_DUE;
  if (status === "cancelled" || status === "canceled") return SubscriptionStatus.CANCELED;
  // pending/unknown nunca deve transformar um plano pago em teste.
  return null;
}

export function verifyMercadoPagoSignature(args: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!args.xSignature || !args.xRequestId || !args.dataId) return false;
  const parts = Object.fromEntries(args.xSignature.split(",").map((p) => p.trim().split("=", 2)));
  const ts = parts.ts;
  const received = parts.v1;
  if (!ts || !received) return false;
  const manifest = `id:${args.dataId.toLowerCase()};request-id:${args.xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

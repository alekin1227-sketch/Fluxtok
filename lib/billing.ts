import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import crypto from "crypto";

function envPrice(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const normalized = raw.replace(",", ".").replace(/[^0-9.-]/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const PLAN_INFO: Record<BillingPlan, { name: string; price: number; description: string; features: string[] }> = {
  STARTER: {
    name: "Essencial",
    price: envPrice("FLUXTOK_STARTER_PRICE", 49.9),
    description: "Para lojas iniciando a operação com creators.",
    features: ["Creators, produtos e amostras", "FluxRadar e FluxScore", "Campanhas e pendências", "TikTok Shop", "Suporte interno", "Até 3 usuários"],
  },
  PRO: {
    name: "Pro",
    price: envPrice("FLUXTOK_PRO_PRICE", 79.9),
    description: "Para operações que precisam de mais equipe e acompanhamento.",
    features: ["Tudo do Essencial", "Usuários adicionais", "Indicadores e auditoria", "Suporte prioritário", "Prioridade em novos recursos"],
  },
};

export function mapMercadoPagoStatus(status?: string): SubscriptionStatus | null {
  if (status === "authorized") return SubscriptionStatus.ACTIVE;
  if (status === "paused") return SubscriptionStatus.PAST_DUE;
  if (status === "cancelled" || status === "canceled") return SubscriptionStatus.CANCELED;
  // pending/unknown nunca deve transformar um plano pago em teste.
  return null;
}

export function verifyMercadoPagoSignature(args: { xSignature: string | null; xRequestId: string | null; dataId: string | null }) {
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

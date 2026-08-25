import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import crypto from "crypto";

export const PLAN_INFO: Record<BillingPlan, { name: string; price: number; description: string; features: string[] }> = {
  STARTER: {
    name: "Essencial",
    price: Number(process.env.FLUXTOK_STARTER_PRICE || "49.90"),
    description: "Para lojas iniciando a operação com creators.",
    features: ["Creators e produtos", "Amostras e pendências", "Campanhas", "TikTok Shop", "Até 3 usuários"],
  },
  PRO: {
    name: "Pro",
    price: Number(process.env.FLUXTOK_PRO_PRICE || "79.90"),
    description: "Para operações que precisam de mais equipe e acompanhamento.",
    features: ["Tudo do Essencial", "Usuários adicionais", "Indicadores avançados", "Histórico e auditoria", "Prioridade em novos recursos"],
  },
};

export function mapMercadoPagoStatus(status?: string): SubscriptionStatus {
  if (status === "authorized") return SubscriptionStatus.ACTIVE;
  if (status === "paused") return SubscriptionStatus.PAST_DUE;
  if (status === "cancelled" || status === "canceled") return SubscriptionStatus.CANCELED;
  return SubscriptionStatus.TRIALING;
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

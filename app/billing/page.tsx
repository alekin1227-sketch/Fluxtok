import { BillingPlan, UserRole } from "@prisma/client";
import { requireCompanyIdentity } from "@/lib/auth";
import { PLAN_INFO } from "@/lib/billing";
import { Brand } from "@/components/brand";
import { Notice } from "@/components/notice";

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyIdentity();
  const q = await searchParams;
  const sub = user.company.subscription;
  const isAdmin = user.role === UserRole.COMPANY_ADMIN;
  const daysLeft = sub?.status === "TRIALING" ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000)) : null;

  return <main className="billing-shell">
    <header className="billing-top"><Brand /><a className="btn btn-soft" href="/dashboard">Voltar ao painel</a></header>
    <section className="billing-head"><div className="eyebrow">PLANO E ASSINATURA</div><h1>Escolha como continuar no Fluxtok.</h1><p>{sub?.status === "ACTIVE" ? "Sua assinatura está ativa." : daysLeft && daysLeft > 0 ? `Você ainda tem ${daysLeft} dia(s) grátis.` : "Seu teste terminou. Seus dados continuam salvos."}</p></section>

    {q.error === "not-configured" && <Notice type="error">O pagamento ainda não foi configurado pelo administrador do Fluxtok.</Notice>}
    {q.error === "checkout" && <Notice type="error">Não foi possível abrir o checkout. Tente novamente.</Notice>}
    {q.error === "consent" && <Notice type="error">Confirme os termos da cobrança recorrente para continuar.</Notice>}
    {q.error === "cancel" && <Notice type="error">Não foi possível cancelar a assinatura. Confira a configuração do Mercado Pago.</Notice>}
    {q.error === "sync" && <Notice type="error">Não foi possível consultar o status no Mercado Pago.</Notice>}
    {q.synced && <Notice>Status da assinatura atualizado diretamente pelo Mercado Pago.</Notice>}
    {q.return && <Notice>Se você concluiu o pagamento, a ativação pode levar alguns segundos após a confirmação do Mercado Pago.</Notice>}
    {q.canceled && <Notice>Assinatura cancelada. Seus dados permanecem salvos no Fluxtok.</Notice>}
    {!isAdmin && <Notice type="error">Somente o administrador da empresa pode contratar ou cancelar o plano.</Notice>}

    <div className="pricing-grid billing-plans">
      {([BillingPlan.STARTER, BillingPlan.PRO] as const).map((plan) => {
        const info = PLAN_INFO[plan];
        return <article className={`price-card ${plan === "PRO" ? "price-featured" : ""}`} key={plan}>
          {plan === "PRO" && <div className="price-badge">Mais completo</div>}
          <h2>{info.name}</h2><p>{info.description}</p><div className="price"><strong>R$ {info.price.toFixed(2).replace(".", ",")}</strong><span>/mês</span></div>
          <ul>{info.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
          {isAdmin ? <form action="/api/billing/checkout" method="post" className="stack billing-consent"><input type="hidden" name="plan" value={plan} /><label className="check-row"><input type="checkbox" name="billingConsent" value="yes" required /><span>Confirmo a assinatura recorrente de <b>R$ {info.price.toFixed(2).replace(".", ",")}/mês</b> e li as regras de cancelamento nos <a href="/termos" target="_blank">Termos de uso</a>.</span></label><button className={`btn btn-lg ${plan === "PRO" ? "btn-primary" : "btn-soft"}`} type="submit">Assinar {info.name}</button></form> : <button className="btn btn-soft btn-lg" disabled>Administrador necessário</button>}
        </article>;
      })}
    </div>

    {isAdmin && sub?.externalSubscriptionId && <div className="billing-sync"><span>Já concluiu ou alterou o pagamento no Mercado Pago?</span><form action="/api/billing/sync" method="post"><button className="btn btn-soft">Atualizar status agora</button></form></div>}
    {isAdmin && sub?.status === "ACTIVE" && sub.externalSubscriptionId && <section className="billing-danger-zone"><div><strong>Cancelar assinatura</strong><p>O acesso pago será encerrado após a confirmação do provedor. Os dados não são apagados automaticamente.</p></div><form action="/api/billing/cancel" method="post"><button className="btn btn-danger" type="submit">Cancelar assinatura</button></form></section>}
    <p className="billing-note">O checkout é processado pelo Mercado Pago. O Fluxtok não armazena os dados completos do seu cartão.</p>
  </main>;
}

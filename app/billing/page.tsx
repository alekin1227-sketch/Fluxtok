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
  const pixExpired = sub?.provider === "mercadopago_pix" && sub.currentPeriodEnd && sub.currentPeriodEnd <= new Date();
  const daysLeft = sub?.status === "TRIALING" ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000)) : null;
  const pixUntil = sub?.provider === "mercadopago_pix" && sub.currentPeriodEnd ? sub.currentPeriodEnd.toLocaleDateString("pt-BR") : null;

  return <main className="billing-shell">
    <header className="billing-top"><Brand /><a className="btn btn-soft" href="/dashboard">Voltar ao painel</a></header>
    <section className="billing-head"><div className="eyebrow">PLANO E ASSINATURA</div><h1>Escolha como continuar no Fluxtok.</h1><p>{pixExpired ? "Seu período pago via Pix terminou. Renove para continuar." : sub?.status === "ACTIVE" && pixUntil ? `Seu acesso via Pix está ativo até ${pixUntil}.` : sub?.status === "ACTIVE" ? "Sua assinatura está ativa." : daysLeft && daysLeft > 0 ? `Você ainda tem ${daysLeft} dia(s) grátis.` : "Seu teste terminou. Seus dados continuam salvos."}</p></section>

    {q.error === "not-configured" && <Notice type="error">O pagamento ainda não foi configurado pelo administrador do Fluxtok.</Notice>}
    {q.error === "checkout" && <Notice type="error">Não foi possível abrir o checkout. Tente novamente.</Notice>}
    {q.error === "consent" && <Notice type="error">Confirme os termos da cobrança recorrente para continuar.</Notice>}
    {q.error === "pix-data" && <Notice type="error">Confira CPF/CNPJ e confirme as regras do pagamento Pix.</Notice>}
    {q.error === "pix" && <Notice type="error">Não foi possível gerar o Pix agora. Confira a integração do Mercado Pago.</Notice>}
    {q.error === "pix-active-card" && <Notice type="error">Sua assinatura recorrente no cartão já está ativa. Cancele-a antes de mudar para Pix para evitar cobrança em duplicidade.</Notice>}
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
          {isAdmin ? <div className="payment-methods">
            <section className="payment-method"><div><strong>💳 Cartão</strong><small>Renovação automática mensal</small></div><form action="/api/billing/checkout" method="post" className="stack billing-consent"><input type="hidden" name="plan" value={plan} /><label>E-mail usado no pagamento<input className="input" type="email" name="payerEmail" defaultValue={user.email} placeholder="pagamento@exemplo.com" required maxLength={254} /></label><small>Este e-mail pode ser diferente do e-mail de cadastro no Fluxtok. Ele será usado somente no fluxo de pagamento do Mercado Pago e não altera seu login.</small><label className="check-row"><input type="checkbox" name="billingConsent" value="yes" required /><span>Confirmo a assinatura recorrente de <b>R$ {info.price.toFixed(2).replace(".", ",")}/mês</b> e li os <a href="/termos" target="_blank">Termos de uso</a>.</span></label><button className={`btn btn-lg ${plan === "PRO" ? "btn-primary" : "btn-soft"}`} type="submit">Assinar com cartão</button></form></section>
            <div className="payment-or">ou</div>
            <section className="payment-method pix-method"><div><strong>⚡ Pix</strong><small>Pagamento único · libera 30 dias · sem renovação automática</small></div><form action="/api/billing/pix/create" method="post" className="stack"><input type="hidden" name="plan" value={plan} /><label>E-mail usado no pagamento<input className="input" type="email" name="payerEmail" defaultValue={user.email} placeholder="pagamento@exemplo.com" required maxLength={254} /></label><small>O e-mail do pagador pode ser diferente do e-mail de cadastro no Fluxtok. Isso não altera o acesso à conta.</small><label>CPF ou CNPJ do pagador<input className="input" name="document" inputMode="numeric" placeholder="Somente números" required /></label><label className="check-row"><input type="checkbox" name="pixConsent" value="yes" required /><span>Confirmo o Pix de <b>R$ {info.price.toFixed(2).replace(".", ",")}</b> referente a 30 dias de acesso e entendo que ele não renova automaticamente.</span></label><button className="btn btn-lg btn-pix" type="submit">Pagar com Pix</button></form></section>
          </div> : <button className="btn btn-soft btn-lg" disabled>Administrador necessário</button>}
        </article>;
      })}
    </div>

    {isAdmin && sub?.externalSubscriptionId && <div className="billing-sync"><span>Já concluiu ou alterou o pagamento no Mercado Pago?</span><form action="/api/billing/sync" method="post"><button className="btn btn-soft">Atualizar status agora</button></form></div>}
    {isAdmin && sub?.status === "ACTIVE" && sub.externalSubscriptionId && <section className="billing-danger-zone"><div><strong>Cancelar assinatura</strong><p>O acesso pago será encerrado após a confirmação do provedor. Os dados não são apagados automaticamente.</p></div><form action="/api/billing/cancel" method="post"><button className="btn btn-danger" type="submit">Cancelar assinatura</button></form></section>}
    <p className="billing-note">Cartão: cobrança recorrente processada pelo Mercado Pago. Pix: pagamento avulso que libera 30 dias após confirmação. O e-mail informado no pagamento pode ser diferente do e-mail usado para entrar no Fluxtok. O Fluxtok não armazena dados completos do cartão nem o CPF/CNPJ informado para gerar o Pix.</p>
  </main>;
}

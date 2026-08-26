import { BillingPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { requireCompanyIdentity } from "@/lib/auth";
import {
  ANNUAL_DISCOUNT_PERCENT,
  PLAN_INFO,
  annualMonthlyEquivalent,
  annualPrice,
  annualSavings,
  billingCycleFromProvider,
  billingCycleLabel,
  isMercadoPagoCardProvider,
} from "@/lib/billing";
import { Brand } from "@/components/brand";
import { Notice } from "@/components/notice";

function price(value: number) {
  return Number.isFinite(value) ? value.toFixed(2).replace(".", ",") : "—";
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyIdentity();
  const q = await searchParams;
  const sub = user.company.subscription;
  const isAdmin = user.role === UserRole.COMPANY_ADMIN;
  const isActive = sub?.status === SubscriptionStatus.ACTIVE;
  const pixExpired = sub?.provider === "mercadopago_pix" && sub.currentPeriodEnd && sub.currentPeriodEnd <= new Date();
  const daysLeft = sub?.status === SubscriptionStatus.TRIALING ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000)) : null;
  const pixUntil = sub?.provider === "mercadopago_pix" && sub.currentPeriodEnd ? sub.currentPeriodEnd.toLocaleDateString("pt-BR") : null;
  const pendingPlan = sub?.pendingPlan ? PLAN_INFO[sub.pendingPlan] : null;
  const pendingCycle = sub?.pendingProvider ? billingCycleFromProvider(sub.pendingProvider) : null;
  const currentCycle = isMercadoPagoCardProvider(sub?.provider) ? billingCycleFromProvider(sub?.provider) : null;

  return <main className="billing-shell">
    <header className="billing-top"><Brand /><a className="btn btn-soft" href="/dashboard">Voltar ao painel</a></header>
    <section className="billing-head"><div className="eyebrow">PLANO E ASSINATURA</div><h1>Escolha como continuar no Fluxtok.</h1><p>{pixExpired ? "Seu período pago via Pix terminou. Renove para continuar." : isActive && pixUntil ? `Seu acesso via Pix está ativo até ${pixUntil}.` : isActive && currentCycle ? `Seu plano ${PLAN_INFO[sub!.plan].name} está ativo na cobrança ${billingCycleLabel(currentCycle).toLowerCase()}.` : isActive ? `Seu plano ${PLAN_INFO[sub!.plan].name} está ativo.` : daysLeft && daysLeft > 0 ? `Você ainda tem ${daysLeft} dia(s) grátis.` : "Seu teste terminou. Seus dados continuam salvos."}</p></section>

    <div className="billing-cycle-highlight">
      <div><strong>Mensal</strong><span>Flexibilidade com cobrança todos os meses.</span></div>
      <div className="annual-highlight"><strong>Anual · {ANNUAL_DISCOUNT_PERCENT}% de desconto</strong><span>Uma cobrança a cada 12 meses e menor custo equivalente por mês.</span></div>
    </div>

    {pendingPlan && <Notice>Existe uma mudança para <b>{pendingPlan.name}</b>{pendingCycle ? ` · ${billingCycleLabel(pendingCycle)}` : ""} aguardando conclusão. Seu plano atual <b>{PLAN_INFO[sub!.plan].name}</b> continua ativo até o Mercado Pago confirmar o novo pagamento.</Notice>}
    {q.pendingCanceled && <Notice>Troca de plano cancelada. Seu plano atual foi mantido.</Notice>}
    {q.activated && <Notice>Pagamento confirmado. O novo plano foi ativado.</Notice>}
    {q.error === "not-configured" && <Notice type="error">O pagamento ainda não foi configurado pelo administrador do Fluxtok.</Notice>}
    {q.error === "checkout" && <Notice type="error">Não foi possível abrir o checkout. Seu plano atual não foi alterado.</Notice>}
    {q.error === "consent" && <Notice type="error">Confirme os termos da cobrança recorrente para continuar.</Notice>}
    {q.error === "pix-data" && <Notice type="error">Confira CPF/CNPJ e confirme as regras do pagamento Pix.</Notice>}
    {q.error === "pix" && <Notice type="error">Não foi possível gerar o Pix agora. Seu plano atual não foi alterado.</Notice>}
    {q.error === "pix-active-card" && <Notice type="error">Sua assinatura recorrente no cartão já está ativa. Cancele-a antes de mudar para Pix para evitar cobrança em duplicidade.</Notice>}
    {q.error === "cancel" && <Notice type="error">Não foi possível cancelar a assinatura. Confira a configuração do Mercado Pago.</Notice>}
    {q.error === "sync" && <Notice type="error">Não foi possível consultar o status no Mercado Pago.</Notice>}
    {q.synced && !q.activated && <Notice>Status consultado. Enquanto o novo pagamento não for aprovado, seu plano atual permanece igual.</Notice>}
    {q.return && <Notice>Se você concluiu o pagamento, a ativação pode levar alguns segundos. Até a confirmação, seu plano atual continua ativo.</Notice>}
    {q.canceled && <Notice>Assinatura cancelada. Seus dados permanecem salvos no Fluxtok.</Notice>}
    {!isAdmin && <Notice type="error">Somente o administrador da empresa pode contratar ou cancelar o plano.</Notice>}

    {isAdmin && sub?.pendingExternalSubscriptionId && <div className="billing-sync"><span>Mudança pendente para <b>{pendingPlan?.name}{pendingCycle ? ` · ${billingCycleLabel(pendingCycle)}` : ""}</b>. Você pode consultar o pagamento ou desistir sem perder o plano atual.</span><div className="quick-actions"><form action="/api/billing/sync" method="post"><button className="btn btn-soft">Atualizar status</button></form><form action="/api/billing/pending/cancel" method="post"><button className="btn btn-ghost">Cancelar troca</button></form></div></div>}

    <div className="pricing-grid billing-plans">
      {([BillingPlan.STARTER, BillingPlan.PRO] as const).map((plan) => {
        const info = PLAN_INFO[plan];
        const yearly = annualPrice(plan);
        const yearlyEq = annualMonthlyEquivalent(plan);
        const savings = annualSavings(plan);
        const isCurrentPlan = isActive && sub?.plan === plan;
        const isCurrentCard = isCurrentPlan && isMercadoPagoCardProvider(sub?.provider);
        const isCurrentPix = isCurrentPlan && sub?.provider === "mercadopago_pix";
        const isCurrentMonthly = isCurrentCard && currentCycle === "MONTHLY";
        const isCurrentAnnual = isCurrentCard && currentCycle === "ANNUAL";
        const isPendingThisPlan = sub?.pendingPlan === plan;
        const pixButton = isCurrentPix ? "Renovar 30 dias com Pix" : isCurrentPlan ? "Pagar 30 dias com Pix" : `Mudar para ${info.name} com Pix`;

        return <article className={`price-card ${plan === "PRO" ? "price-featured" : ""}`} key={plan}>
          {plan === "PRO" && <div className="price-badge">Mais completo</div>}
          {isCurrentPlan && <div className="price-badge">Plano atual</div>}
          {isPendingThisPlan && !isCurrentPlan && <div className="price-badge">Aguardando pagamento</div>}
          <h2>{info.name}</h2><p>{info.description}</p>
          <div className="price"><strong>R$ {price(info.price)}</strong><span>/mês</span></div>
          <div className="annual-price-line"><strong>Anual: R$ {price(yearly)}</strong><span>equivale a R$ {price(yearlyEq)}/mês · economize R$ {price(savings)}</span></div>
          <ul>{info.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>

          {isAdmin ? <div className="payment-methods">
            <section className="payment-method">
              <div><strong>💳 Cartão recorrente</strong><small>Escolha cobrança mensal ou anual. O anual é cobrado integralmente a cada 12 meses.</small></div>

              <div className="cycle-options">
                <div className={`cycle-option ${isCurrentMonthly ? "cycle-current" : ""}`}>
                  <div className="cycle-option-head"><div><b>Mensal</b><small>R$ {price(info.price)} a cada mês</small></div>{isCurrentMonthly && <span className="mini-badge">Atual</span>}</div>
                  {isCurrentMonthly ? <button className="btn btn-soft btn-lg" disabled>Assinatura mensal atual</button> : <CardCheckoutForm plan={plan} cycle="MONTHLY" amount={info.price} payerEmail={user.email} featured={false} buttonText={isCurrentPlan ? "Mudar para mensal" : `Assinar ${info.name} mensal`} />}
                </div>

                <div className={`cycle-option annual-option ${isCurrentAnnual ? "cycle-current" : ""}`}>
                  <div className="cycle-option-head"><div><b>Anual · economize {ANNUAL_DISCOUNT_PERCENT}%</b><small>R$ {price(yearly)} a cada 12 meses · equivalente a R$ {price(yearlyEq)}/mês</small></div>{isCurrentAnnual ? <span className="mini-badge">Atual</span> : <span className="mini-badge annual-badge">Melhor valor</span>}</div>
                  {isCurrentAnnual ? <button className="btn btn-soft btn-lg" disabled>Assinatura anual atual</button> : <CardCheckoutForm plan={plan} cycle="ANNUAL" amount={yearly} payerEmail={user.email} featured buttonText={isCurrentPlan ? "Mudar para anual" : `Assinar ${info.name} anual`} />}
                </div>
              </div>
            </section>

            <div className="payment-or">ou</div>
            <section className="payment-method pix-method"><div><strong>⚡ Pix</strong><small>Pagamento único · libera 30 dias · sem renovação automática</small></div><form action="/api/billing/pix/create" method="post" className="stack"><input type="hidden" name="plan" value={plan} /><label>E-mail usado no pagamento<input className="input" type="email" name="payerEmail" defaultValue={user.email} placeholder="pagamento@exemplo.com" required maxLength={254} /></label><small>O e-mail do pagador pode ser diferente do e-mail de cadastro no Fluxtok. Isso não altera o acesso à conta.</small><label>CPF ou CNPJ do pagador<input className="input" name="document" inputMode="numeric" placeholder="Somente números" required /></label><label className="check-row"><input type="checkbox" name="pixConsent" value="yes" required /><span>Confirmo o Pix de <b>R$ {price(info.price)}</b> referente a 30 dias de acesso e entendo que ele não renova automaticamente.</span></label><button className="btn btn-lg btn-pix" type="submit">{pixButton}</button></form></section>
          </div> : <button className="btn btn-soft btn-lg" disabled>Administrador necessário</button>}
        </article>;
      })}
    </div>

    {isAdmin && !sub?.pendingExternalSubscriptionId && sub?.externalSubscriptionId && <div className="billing-sync"><span>Já concluiu ou alterou o pagamento no Mercado Pago?</span><form action="/api/billing/sync" method="post"><button className="btn btn-soft">Atualizar status agora</button></form></div>}
    {isAdmin && sub?.status === "ACTIVE" && sub.externalSubscriptionId && <section className="billing-danger-zone"><div><strong>Cancelar assinatura</strong><p>O acesso pago será encerrado após a confirmação do provedor. Os dados não são apagados automaticamente.</p></div><form action="/api/billing/cancel" method="post"><button className="btn btn-danger" type="submit">Cancelar assinatura</button></form></section>}
    <p className="billing-note">Abrir uma troca de plano ou de periodicidade nunca altera o benefício atual. O novo plano só é aplicado depois que o Mercado Pago confirmar o pagamento. Cartão mensal: cobrança a cada mês. Cartão anual: cobrança integral a cada 12 meses. Pix: pagamento avulso de 30 dias.</p>
  </main>;
}

function CardCheckoutForm({ plan, cycle, amount, payerEmail, featured, buttonText }: { plan: BillingPlan; cycle: "MONTHLY" | "ANNUAL"; amount: number; payerEmail: string; featured: boolean; buttonText: string }) {
  const cadenceText = cycle === "ANNUAL" ? `R$ ${price(amount)} a cada 12 meses` : `R$ ${price(amount)} por mês`;
  return <form action="/api/billing/checkout" method="post" className="stack billing-consent">
    <input type="hidden" name="plan" value={plan} />
    <input type="hidden" name="billingCycle" value={cycle} />
    <label>E-mail usado no pagamento<input className="input" type="email" name="payerEmail" defaultValue={payerEmail} placeholder="pagamento@exemplo.com" required maxLength={254} /></label>
    <small>Este e-mail pode ser diferente do e-mail de cadastro no Fluxtok. Ele será usado somente no fluxo de pagamento e não altera seu login.</small>
    <label className="check-row"><input type="checkbox" name="billingConsent" value="yes" required /><span>Confirmo a assinatura recorrente de <b>{cadenceText}</b> e li os <a href="/termos" target="_blank">Termos de uso</a>.</span></label>
    <button className={`btn btn-lg ${featured ? "btn-primary" : "btn-soft"}`} type="submit">{buttonText}</button>
  </form>;
}

import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { Notice } from "@/components/notice";
import { PLAN_INFO, billingCycleFromProvider, billingCycleLabel, isMercadoPagoCardProvider } from "@/lib/billing";

const allowedStatuses = new Set(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"]);
const allowedPlans = new Set(["STARTER", "PRO"]);

function statusLabel(status?: string | null) {
  if (status === "ACTIVE") return "Pago";
  if (status === "TRIALING") return "Teste";
  if (status === "PAST_DUE") return "Pagamento pendente";
  if (status === "CANCELED") return "Cancelado";
  if (status === "EXPIRED") return "Expirado";
  return "Legado";
}

function statusTone(status?: string | null) {
  if (status === "ACTIVE") return "success";
  if (status === "TRIALING") return "info";
  if (status === "PAST_DUE") return "warning";
  return "danger";
}

function paymentMethod(provider?: string | null) {
  if (provider === "mercadopago_pix") return "Pix";
  if (isMercadoPagoCardProvider(provider)) return `Cartão ${billingCycleLabel(billingCycleFromProvider(provider)).toLowerCase()}`;
  return "—";
}

function accessText(company: Awaited<ReturnType<typeof loadCompanies>>[number]) {
  const sub = company.subscription;
  if (!sub) return company.trial?.trialEndsAt ? `Legado até ${company.trial.trialEndsAt.toLocaleDateString("pt-BR")}` : "Sem limite legado";
  if (sub.status === "TRIALING") return `Teste até ${sub.trialEndsAt.toLocaleDateString("pt-BR")}`;
  if (sub.status === "ACTIVE" && sub.provider === "mercadopago_pix") return sub.currentPeriodEnd ? `Pago até ${sub.currentPeriodEnd.toLocaleDateString("pt-BR")}` : "Pix ativo";
  if (sub.status === "ACTIVE") return sub.currentPeriodEnd ? `Próxima cobrança ${sub.currentPeriodEnd.toLocaleDateString("pt-BR")}` : "Recorrente ativo";
  return statusLabel(sub.status);
}

async function loadCompanies() {
  return prisma.company.findMany({
    include: {
      users: { take: 1, orderBy: { createdAt: "asc" } },
      _count: { select: { users: true, creators: true, samples: true, contents: true, supportTickets: true, pixPayments: true } },
      trial: true,
      subscription: true,
      tiktokConnection: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSuperadmin();
  const q = await searchParams;
  const allCompanies = await loadCompanies();
  const search = q.q?.trim().toLowerCase() || "";
  const status = q.status && allowedStatuses.has(q.status) ? q.status : "";
  const plan = q.plan && allowedPlans.has(q.plan) ? q.plan : "";
  const onlyDisabled = q.account === "disabled";

  const companies = allCompanies.filter((c) => {
    const matchesSearch = !search || [c.name, c.slug, c.users[0]?.email || ""].some((value) => value.toLowerCase().includes(search));
    const matchesStatus = !status || c.subscription?.status === status;
    const matchesPlan = !plan || c.subscription?.plan === plan;
    const matchesAccount = !onlyDisabled || !c.active;
    return matchesSearch && matchesStatus && matchesPlan && matchesAccount;
  });

  return <>
    <div className="page-head"><div><div className="eyebrow">CLIENTES</div><h1 className="page-title">Empresas</h1><p className="page-subtitle">Pesquise clientes, acompanhe pagamento e gerencie somente testes quando ainda forem aplicáveis.</p></div><div className="quick-actions"><a className="btn btn-soft" href="/superadmin/pagamentos">Pagamentos</a><a className="btn btn-primary" href="#nova-empresa">+ Criar manualmente</a></div></div>
    {q.created && <Notice>Empresa criada.</Notice>}{q.saved && <Notice>Alteração salva.</Notice>}{q.error === "active-trial" && <Notice type="error">Esta empresa já possui um plano pago ativo. O período gratuito não pode ser estendido enquanto a assinatura estiver ativa.</Notice>}{q.error && q.error !== "active-trial" && <Notice type="error">Não foi possível concluir a operação.</Notice>}

    <section className="section admin-filter-section">
      <form className="filter-bar" method="get">
        <input name="q" defaultValue={q.q || ""} placeholder="Buscar empresa, slug ou e-mail" />
        <select name="status" defaultValue={status}><option value="">Todos os status</option><option value="TRIALING">Em teste</option><option value="ACTIVE">Pago</option><option value="PAST_DUE">Pagamento pendente</option><option value="CANCELED">Cancelado</option><option value="EXPIRED">Expirado</option></select>
        <select name="plan" defaultValue={plan}><option value="">Todos os planos</option><option value="STARTER">Essencial</option><option value="PRO">Pro</option></select>
        <select name="account" defaultValue={onlyDisabled ? "disabled" : ""}><option value="">Todas as contas</option><option value="disabled">Somente desativadas</option></select>
        <button className="btn btn-soft" type="submit">Filtrar</button>
        {(search || status || plan || onlyDisabled) && <a className="btn btn-ghost" href="/superadmin/empresas">Limpar</a>}
      </form>
      <div className="admin-filter-summary"><strong>{companies.length}</strong><span>de {allCompanies.length} empresa(s)</span></div>
    </section>

    <section className="form-card" id="nova-empresa"><div className="form-card-head"><div><h2>Criar acesso manual</h2><p>Use para demonstrações, parceiros ou clientes assistidos. A conta nasce com 7 dias de teste.</p></div></div><form className="stack" action="/api/superadmin/companies" method="post"><div className="form-grid compact-grid"><Field name="name" label="Empresa *"/><Field name="adminName" label="Responsável *"/><Field name="adminEmail" label="E-mail *" type="email"/><Field name="adminPassword" label="Senha inicial *" type="password" minLength={12}/></div><div className="form-actions"><button className="btn btn-primary">Criar com 7 dias grátis</button></div></form></section>

    <section className="section"><div className="section-bar"><div><h2>Empresas cadastradas</h2><p>Plano pago e período gratuito nunca são exibidos como se fossem a mesma coisa.</p></div></div><div className="company-admin-grid">{companies.length === 0 ? <div className="empty-state"><strong>Nenhuma empresa encontrada</strong><span>Ajuste os filtros acima.</span></div> : companies.map((c) => {
      const sub = c.subscription;
      const isPaid = sub?.status === "ACTIVE";
      const isTrial = sub?.status === "TRIALING";
      return <article className="company-admin-card" key={c.id}>
        <div className="company-admin-head"><div><strong>{c.name}</strong><span>{c.users[0]?.email || c.slug}</span></div><div className="company-admin-badges"><span className={`badge tone-${statusTone(sub?.status)}`}>{statusLabel(sub?.status)}</span><span className={`badge ${c.active ? "tone-success" : "tone-danger"}`}>{c.active ? "Conta ativa" : "Desativada"}</span></div></div>
        <div className="company-admin-meta"><span><b>Plano</b>{sub ? PLAN_INFO[sub.plan].name : "—"}</span><span><b>Acesso</b>{accessText(c)}</span><span><b>Pagamento</b>{isPaid ? paymentMethod(sub?.provider) : "—"}</span><span><b>TikTok</b>{c.tiktokConnection?.status === "CONNECTED" ? "Conectado" : "Manual"}</span></div>
        <div className="usage-line"><span>{c._count.users} usuário(s)</span><span>{c._count.creators} creators</span><span>{c._count.samples} amostras</span><span>{c._count.contents} conteúdos</span><span>{c._count.supportTickets} chamados</span><span>{c._count.pixPayments} Pix</span></div>

        {!isPaid && <div className="trial-extension"><strong>{isTrial ? "Adicionar dias de teste" : "Conceder período de teste"}</strong><p className="mini-help">Ao conceder dias, a conta volta para status de teste. Planos pagos ativos não recebem essa opção.</p><form action={`/api/superadmin/companies/${c.id}/trial`} method="post"><input name="days" type="number" min="1" max="365" defaultValue="7" required/><button className="btn btn-mini">Adicionar dias</button></form><div className="trial-shortcuts">{[1,3,7,14,30].map((days)=><form key={days} action={`/api/superadmin/companies/${c.id}/trial`} method="post"><input type="hidden" name="days" value={days}/><button className="btn btn-ghost btn-mini">+{days}d</button></form>)}</div></div>}

        {isPaid && <div className="paid-admin-strip"><div><strong>Plano pago ativo</strong><span>{sub?.provider === "mercadopago_pix" ? "Pix avulso" : paymentMethod(sub?.provider)}</span></div><a className="btn btn-soft btn-mini" href={`/superadmin/pagamentos?q=${encodeURIComponent(c.name)}`}>Ver cobrança</a></div>}
        <div className="company-admin-actions"><form action={`/api/superadmin/companies/${c.id}/toggle`} method="post"><button className={`btn btn-mini ${c.active ? "btn-danger-soft" : "btn-soft"}`}>{c.active ? "Desativar conta" : "Reativar conta"}</button></form></div>
      </article>;
    })}</div></section>
  </>;
}

function Field({name,label,type="text",minLength}:{name:string;label:string;type?:string;minLength?:number}){return <div className="field"><label>{label}</label><input name={name} type={type} required minLength={minLength}/></div>}

import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { PLAN_INFO, billingCycleFromProvider, isMercadoPagoCardProvider } from "@/lib/billing";
import { supportStatusLabel, supportTone } from "@/lib/support";

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function subscriptionLabel(status?: string | null) {
  if (status === "ACTIVE") return "Pago";
  if (status === "TRIALING") return "Teste";
  if (status === "PAST_DUE") return "Pagamento pendente";
  if (status === "CANCELED") return "Cancelado";
  if (status === "EXPIRED") return "Expirado";
  return "Legado";
}

function subscriptionTone(status?: string | null) {
  if (status === "ACTIVE") return "success";
  if (status === "TRIALING") return "info";
  if (status === "PAST_DUE") return "warning";
  return "danger";
}

export default async function SuperadminDashboard() {
  await requireSuperadmin();
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 3600000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    companies,
    disabledCompanies,
    activeTrials,
    expiringTrials,
    activeSubs,
    openTickets,
    signups7d,
    tiktokConnected,
    recentCompanies,
    recentTickets,
    pix30d,
    pendingPix,
    expiringTrialCompanies,
    recentPix,
    pendingPlanChanges,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { active: false } }),
    prisma.subscription.count({ where: { status: "TRIALING", trialEndsAt: { gt: now } } }),
    prisma.subscription.count({ where: { status: "TRIALING", trialEndsAt: { gt: now, lte: in48h } } }),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, select: { plan: true, amount: true, provider: true, currentPeriodEnd: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "WAITING_SUPPORT"] } } }),
    prisma.company.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.tikTokConnection.count({ where: { status: "CONNECTED" } }),
    prisma.company.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { subscription: true, users: { take: 1, orderBy: { createdAt: "asc" } } } }),
    prisma.supportTicket.findMany({ take: 5, where: { status: { not: "CLOSED" } }, orderBy: { lastMessageAt: "desc" }, include: { company: true } }),
    prisma.pixPayment.aggregate({ where: { status: "approved", approvedAt: { gte: thirtyDaysAgo } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.pixPayment.count({ where: { status: { in: ["pending", "in_process", "creating"] } } }),
    prisma.company.findMany({ take: 5, where: { subscription: { is: { status: "TRIALING", trialEndsAt: { gt: now, lte: in48h } } } }, orderBy: { subscription: { trialEndsAt: "asc" } }, include: { subscription: true } }),
    prisma.pixPayment.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { company: true } }),
    prisma.subscription.count({ where: { pendingExternalSubscriptionId: { not: null } } }),
  ]);

  const recurringSubs = activeSubs.filter((s) => isMercadoPagoCardProvider(s.provider));
  const annualSubs = recurringSubs.filter((s) => billingCycleFromProvider(s.provider) === "ANNUAL");
  const activePixSubs = activeSubs.filter((s) => s.provider === "mercadopago_pix" && s.currentPeriodEnd && s.currentPeriodEnd > now);
  const mrr = recurringSubs.reduce((sum, s) => {
    const chargedAmount = Number(s.amount ?? PLAN_INFO[s.plan].price);
    return sum + (billingCycleFromProvider(s.provider) === "ANNUAL" ? chargedAmount / 12 : chargedAmount);
  }, 0);
  const pixRevenue30d = Number(pix30d._sum.amount ?? 0);

  return <>
    <div className="page-head"><div><div className="eyebrow">FLUXTOK ADMIN</div><h1 className="page-title">Visão geral</h1><p className="page-subtitle">Clientes, cobrança, testes, suporte e sinais de atenção em uma visão operacional.</p></div><div className="quick-actions"><a className="btn btn-soft" href="/superadmin/pagamentos">Pagamentos</a><a className="btn btn-soft" href="/superadmin/suporte">Suporte</a><a className="btn btn-primary" href="/superadmin/empresas#nova-empresa">+ Empresa</a></div></div>

    <div className="admin-metric-grid admin-metric-grid-wide">
      <AdminMetric label="Empresas" value={companies} hint={`${signups7d} novas em 7 dias · ${disabledCompanies} desativadas`} />
      <AdminMetric label="Testes ativos" value={activeTrials} hint={`${expiringTrials} vencem em até 48h`} tone={expiringTrials ? "warning" : undefined} />
      <AdminMetric label="Cartão recorrente" value={recurringSubs.length} hint={`MRR normalizado ${money(mrr)} · ${annualSubs.length} anual(is)`} tone="success" />
      <AdminMetric label="Pix ativos" value={activePixSubs.length} hint={`${money(pixRevenue30d)} recebidos em 30 dias`} tone="success" />
      <AdminMetric label="Suporte" value={openTickets} hint="aguardando atenção" tone={openTickets ? "warning" : undefined} />
      <AdminMetric label="Trocas de plano" value={pendingPlanChanges} hint="aguardando confirmação do pagamento" tone={pendingPlanChanges ? "warning" : undefined} />
      <AdminMetric label="TikTok conectado" value={tiktokConnected} hint={`${pendingPix} Pix pendente(s)`} tone={pendingPix ? "warning" : undefined} />
    </div>

    <div className="admin-dashboard-grid">
      <section className="section admin-panel"><div className="section-bar"><div><h2>Cadastros recentes</h2><p>Últimas empresas que entraram no Fluxtok.</p></div><a className="text-link" href="/superadmin/empresas">Ver todas →</a></div><div className="list-card">{recentCompanies.map((c) => <a href={`/superadmin/empresas?q=${encodeURIComponent(c.name)}`} className="admin-list-row" key={c.id}><div><strong>{c.name}</strong><span>{c.users[0]?.email || c.slug}</span></div><div><span className={`badge tone-${subscriptionTone(c.subscription?.status)}`}>{subscriptionLabel(c.subscription?.status)}</span><small>{c.createdAt.toLocaleDateString("pt-BR")}</small></div></a>)}</div></section>

      <section className="section admin-panel"><div className="section-bar"><div><h2>Chamados recentes</h2><p>Priorize quem está esperando resposta.</p></div><a className="text-link" href="/superadmin/suporte">Caixa de entrada →</a></div><div className="list-card">{recentTickets.length === 0 ? <div className="empty-state"><strong>Caixa em dia</strong><span>Nenhum chamado aberto.</span></div> : recentTickets.map((t) => <a href={`/superadmin/suporte/${t.id}`} className="admin-list-row" key={t.id}><div><strong>{t.subject}</strong><span>{t.company.name}</span></div><div><span className={`badge tone-${supportTone(t.status)}`}>{supportStatusLabel[t.status]}</span><small>{t.lastMessageAt.toLocaleDateString("pt-BR")}</small></div></a>)}</div></section>

      <section className="section admin-panel"><div className="section-bar"><div><h2>Atenção nas próximas 48h</h2><p>Testes próximos do fim. Assinantes pagos não aparecem aqui.</p></div><a className="text-link" href="/superadmin/empresas?status=TRIALING">Gerenciar →</a></div><div className="list-card">{expiringTrialCompanies.length === 0 ? <div className="empty-state"><strong>Nada urgente</strong><span>Nenhum teste vence nas próximas 48 horas.</span></div> : expiringTrialCompanies.map((c) => <a href={`/superadmin/empresas?q=${encodeURIComponent(c.name)}`} className="admin-list-row" key={c.id}><div><strong>{c.name}</strong><span>Período gratuito</span></div><div><span className="badge tone-warning">Vence em breve</span><small>{c.subscription?.trialEndsAt.toLocaleString("pt-BR")}</small></div></a>)}</div></section>

      <section className="section admin-panel"><div className="section-bar"><div><h2>Pix recentes</h2><p>Últimas cobranças geradas pelo Fluxtok.</p></div><a className="text-link" href="/superadmin/pagamentos">Ver pagamentos →</a></div><div className="list-card">{recentPix.length === 0 ? <div className="empty-state"><strong>Sem Pix ainda</strong><span>As cobranças Pix aparecerão aqui.</span></div> : recentPix.map((p) => <a href={`/superadmin/pagamentos#pix-${p.id}`} className="admin-list-row" key={p.id}><div><strong>{p.company.name}</strong><span>{p.plan === "PRO" ? "Pro" : "Essencial"} · {money(Number(p.amount))}</span></div><div><span className={`badge ${p.status === "approved" ? "tone-success" : p.status === "error" ? "tone-danger" : "tone-warning"}`}>{p.status === "approved" ? "Aprovado" : p.status === "error" ? "Erro" : "Pendente"}</span><small>{p.createdAt.toLocaleDateString("pt-BR")}</small></div></a>)}</div></section>
    </div>
  </>;
}

function AdminMetric({ label, value, hint, tone }: { label: string; value: number; hint: string; tone?: "success" | "warning" }) {
  return <div className={`metric-card ${tone ? `metric-${tone}` : ""}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-hint">{hint}</div></div>;
}

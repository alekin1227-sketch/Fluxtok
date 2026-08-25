import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { PLAN_INFO } from "@/lib/billing";
import { supportStatusLabel, supportTone } from "@/lib/support";

export default async function SuperadminDashboard() {
  await requireSuperadmin();
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 3600000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const [companies, activeTrials, expiringTrials, activeSubs, openTickets, signups7d, tiktokConnected, recentCompanies, recentTickets] = await Promise.all([
    prisma.company.count(),
    prisma.subscription.count({ where: { status: "TRIALING", trialEndsAt: { gt: now } } }),
    prisma.subscription.count({ where: { status: "TRIALING", trialEndsAt: { gt: now, lte: in48h } } }),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, select: { plan: true, amount: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "WAITING_SUPPORT"] } } }),
    prisma.company.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.tikTokConnection.count({ where: { status: "CONNECTED" } }),
    prisma.company.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { subscription: true, users: { take: 1, orderBy: { createdAt: "asc" } } } }),
    prisma.supportTicket.findMany({ take: 5, where: { status: { not: "CLOSED" } }, orderBy: { lastMessageAt: "desc" }, include: { company: true } }),
  ]);
  const mrr = activeSubs.reduce((sum, s) => sum + Number(s.amount ?? PLAN_INFO[s.plan].price), 0);
  return <>
    <div className="page-head"><div><div className="eyebrow">FLUXTOK ADMIN</div><h1 className="page-title">Visão geral</h1><p className="page-subtitle">Cadastros, testes, receita estimada e suporte sem precisar caçar informação em várias telas.</p></div><div className="quick-actions"><a className="btn btn-soft" href="/superadmin/suporte">Ver suporte</a><a className="btn btn-primary" href="/superadmin/empresas#nova-empresa">+ Empresa</a></div></div>
    <div className="admin-metric-grid">
      <AdminMetric label="Empresas" value={companies} hint={`${signups7d} novas em 7 dias`} />
      <AdminMetric label="Testes ativos" value={activeTrials} hint={`${expiringTrials} vencem em até 48h`} tone={expiringTrials ? "warning" : undefined} />
      <AdminMetric label="Assinantes" value={activeSubs.length} hint={`MRR estimado R$ ${mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} tone="success" />
      <AdminMetric label="Suporte" value={openTickets} hint="aguardando atenção" tone={openTickets ? "warning" : undefined} />
      <AdminMetric label="TikTok conectado" value={tiktokConnected} hint="lojas integradas" />
    </div>
    <div className="admin-dashboard-grid">
      <section className="section admin-panel"><div className="section-bar"><div><h2>Cadastros recentes</h2><p>Últimas empresas que entraram no Fluxtok.</p></div><a className="text-link" href="/superadmin/empresas">Ver todas →</a></div><div className="list-card">{recentCompanies.map((c) => <a href="/superadmin/empresas" className="admin-list-row" key={c.id}><div><strong>{c.name}</strong><span>{c.users[0]?.email || c.slug}</span></div><div><span className="badge tone-info">{c.subscription?.status || "LEGADO"}</span><small>{c.createdAt.toLocaleDateString("pt-BR")}</small></div></a>)}</div></section>
      <section className="section admin-panel"><div className="section-bar"><div><h2>Chamados recentes</h2><p>Priorize quem está esperando resposta.</p></div><a className="text-link" href="/superadmin/suporte">Caixa de entrada →</a></div><div className="list-card">{recentTickets.length === 0 ? <div className="empty-state"><strong>Caixa em dia</strong><span>Nenhum chamado aberto.</span></div> : recentTickets.map((t) => <a href={`/superadmin/suporte/${t.id}`} className="admin-list-row" key={t.id}><div><strong>{t.subject}</strong><span>{t.company.name}</span></div><div><span className={`badge tone-${supportTone(t.status)}`}>{supportStatusLabel[t.status]}</span><small>{t.lastMessageAt.toLocaleDateString("pt-BR")}</small></div></a>)}</div></section>
    </div>
  </>;
}
function AdminMetric({ label, value, hint, tone }: { label: string; value: number; hint: string; tone?: "success" | "warning" }) { return <div className={`metric-card ${tone ? `metric-${tone}` : ""}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-hint">{hint}</div></div>; }

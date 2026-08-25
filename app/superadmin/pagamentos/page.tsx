import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { PLAN_INFO } from "@/lib/billing";

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function planLabel(plan: "STARTER" | "PRO") {
  return PLAN_INFO[plan].name;
}

function pixStatus(status: string) {
  if (status === "approved") return { label: "Aprovado", tone: "success" };
  if (status === "error" || status === "rejected" || status === "cancelled" || status === "canceled") return { label: "Falhou", tone: "danger" };
  return { label: "Pendente", tone: "warning" };
}

function subscriptionStatus(status: string) {
  if (status === "ACTIVE") return { label: "Ativo", tone: "success" };
  if (status === "TRIALING") return { label: "Teste", tone: "info" };
  if (status === "PAST_DUE") return { label: "Pendente", tone: "warning" };
  return { label: status === "CANCELED" ? "Cancelado" : "Expirado", tone: "danger" };
}

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSuperadmin();
  const q = await searchParams;
  const search = q.q?.trim().toLowerCase() || "";
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [subscriptions, pixPayments, pix30d] = await Promise.all([
    prisma.subscription.findMany({ take: 100, orderBy: { updatedAt: "desc" }, include: { company: true } }),
    prisma.pixPayment.findMany({ take: 100, orderBy: { createdAt: "desc" }, include: { company: true, user: true } }),
    prisma.pixPayment.aggregate({ where: { status: "approved", approvedAt: { gte: thirtyDaysAgo } }, _sum: { amount: true }, _count: { _all: true } }),
  ]);

  const filteredSubscriptions = subscriptions.filter((s) => !search || s.company.name.toLowerCase().includes(search));
  const filteredPix = pixPayments.filter((p) => !search || [p.company.name, p.user.email, p.externalPaymentId || ""].some((value) => value.toLowerCase().includes(search)));
  const recurring = subscriptions.filter((s) => s.status === "ACTIVE" && s.provider !== "mercadopago_pix");
  const activePix = subscriptions.filter((s) => s.status === "ACTIVE" && s.provider === "mercadopago_pix" && s.currentPeriodEnd && s.currentPeriodEnd > now);
  const mrr = recurring.reduce((sum, s) => sum + Number(s.amount ?? PLAN_INFO[s.plan].price), 0);
  const pendingPix = pixPayments.filter((p) => ["creating", "pending", "in_process"].includes(p.status)).length;
  const pendingPlanChanges = subscriptions.filter((s) => Boolean(s.pendingPlan && s.pendingExternalSubscriptionId)).length;

  return <>
    <div className="page-head"><div><div className="eyebrow">COBRANÇA</div><h1 className="page-title">Pagamentos</h1><p className="page-subtitle">Veja assinaturas recorrentes e cobranças Pix sem misturar receita recorrente com pagamentos avulsos.</p></div><a className="btn btn-soft" href="/superadmin">Voltar à visão geral</a></div>

    <div className="admin-metric-grid admin-metric-grid-four">
      <div className="metric-card metric-success"><div className="metric-label">Cartões ativos</div><div className="metric-value">{recurring.length}</div><div className="metric-hint">MRR recorrente {money(mrr)}</div></div>
      <div className="metric-card metric-success"><div className="metric-label">Pix ativos</div><div className="metric-value">{activePix.length}</div><div className="metric-hint">acesso pago vigente</div></div>
      <div className="metric-card"><div className="metric-label">Pix em 30 dias</div><div className="metric-value">{money(Number(pix30d._sum.amount ?? 0))}</div><div className="metric-hint">{pix30d._count._all} pagamento(s) aprovado(s)</div></div>
      <div className={`metric-card ${pendingPlanChanges ? "metric-warning" : ""}`}><div className="metric-label">Trocas de plano</div><div className="metric-value">{pendingPlanChanges}</div><div className="metric-hint">checkout iniciado, ainda não ativado</div></div>
    </div>

    <section className="section admin-filter-section"><form className="filter-bar" method="get"><input name="q" defaultValue={q.q || ""} placeholder="Buscar empresa, e-mail ou ID do pagamento"/><button className="btn btn-soft">Buscar</button>{search && <a className="btn btn-ghost" href="/superadmin/pagamentos">Limpar</a>}</form></section>

    <section className="section"><div className="section-bar"><div><h2>Assinaturas e acessos pagos</h2><p>O período gratuito não aparece quando a assinatura já está ativa.</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Empresa</th><th>Plano</th><th>Status</th><th>Forma</th><th>Valor</th><th>Próximo marco</th></tr></thead><tbody>{filteredSubscriptions.map((s) => { const st = subscriptionStatus(s.status); return <tr key={s.id}><td><strong>{s.company.name}</strong></td><td>{planLabel(s.plan)}{s.pendingPlan && <small className="table-sub">→ {planLabel(s.pendingPlan)} pendente</small>}</td><td><span className={`badge tone-${st.tone}`}>{st.label}</span></td><td>{s.provider === "mercadopago_pix" ? "Pix" : s.provider === "mercadopago" ? "Cartão" : s.provider || "—"}</td><td>{money(Number(s.amount ?? PLAN_INFO[s.plan].price))}</td><td>{s.status === "TRIALING" ? `Teste até ${s.trialEndsAt.toLocaleDateString("pt-BR")}` : s.status === "ACTIVE" && s.provider === "mercadopago_pix" && s.currentPeriodEnd ? `Pago até ${s.currentPeriodEnd.toLocaleDateString("pt-BR")}` : s.status === "ACTIVE" && s.currentPeriodEnd ? `Próxima cobrança ${s.currentPeriodEnd.toLocaleDateString("pt-BR")}` : s.status === "ACTIVE" ? "Recorrente" : "—"}</td></tr>; })}</tbody></table></div></section>

    <section className="section"><div className="section-bar"><div><h2>Histórico Pix</h2><p>Pagamentos criados e confirmados pelo Mercado Pago.</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Empresa</th><th>Plano</th><th>Pagador</th><th>Valor</th><th>Status</th><th>Criado</th><th>Aprovado</th></tr></thead><tbody>{filteredPix.map((p) => { const st = pixStatus(p.status); return <tr id={`pix-${p.id}`} key={p.id}><td><strong>{p.company.name}</strong><small className="table-sub">{p.externalPaymentId || p.id}</small></td><td>{planLabel(p.plan)}</td><td>{p.user.email}</td><td>{money(Number(p.amount))}</td><td><span className={`badge tone-${st.tone}`}>{st.label}</span></td><td>{p.createdAt.toLocaleString("pt-BR")}</td><td>{p.approvedAt ? p.approvedAt.toLocaleString("pt-BR") : "—"}</td></tr>; })}</tbody></table></div></section>
  </>;
}

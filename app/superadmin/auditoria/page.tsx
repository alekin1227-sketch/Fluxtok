import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";

function friendlyAction(action: string) {
  const labels: Record<string, string> = {
    PIX_PAYMENT_CREATED: "Pix criado",
    PIX_PAYMENT_APPROVED: "Pix aprovado",
    BILLING_CHECKOUT_CREATED: "Checkout de cartão criado",
    BILLING_STATUS_SYNCED: "Assinatura sincronizada",
    MERCADOPAGO_SUBSCRIPTION_UPDATED: "Mercado Pago atualizou assinatura",
    SUBSCRIPTION_CANCELED: "Assinatura cancelada",
    TRIAL_EXTENDED: "Teste alterado pelo Superadmin",
  };
  return labels[action] || action.replaceAll("_", " ").toLowerCase();
}

export default async function AuditPage() {
  await requireSuperadmin();
  const logs = await prisma.auditLog.findMany({ take: 100, orderBy: { createdAt: "desc" }, include: { company: true } });

  return <>
    <div className="page-head"><div><div className="eyebrow">SEGURANÇA E HISTÓRICO</div><h1 className="page-title">Auditoria</h1><p className="page-subtitle">Últimas ações importantes registradas pelo Fluxtok. Útil para suporte, cobrança e diagnóstico.</p></div><a className="btn btn-soft" href="/superadmin">Voltar à visão geral</a></div>
    <section className="section"><div className="section-bar"><div><h2>Últimos 100 eventos</h2><p>O sistema não mostra tokens ou credenciais nesta tela.</p></div></div><div className="audit-list">{logs.length === 0 ? <div className="empty-state"><strong>Sem eventos</strong><span>Os eventos de auditoria aparecerão aqui.</span></div> : logs.map((log) => <article className="audit-row" key={log.id}><div className="audit-dot"/><div><strong>{friendlyAction(log.action)}</strong><span>{log.company?.name || "Plataforma"}{log.entity ? ` · ${log.entity}` : ""}</span></div><time>{log.createdAt.toLocaleString("pt-BR")}</time></article>)}</div></section>
  </>;
}

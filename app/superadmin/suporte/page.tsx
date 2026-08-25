import { SupportTicketStatus, type Prisma } from "@prisma/client";
import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supportStatusLabel, supportTone } from "@/lib/support";

export default async function AdminSupport({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSuperadmin(); const q = await searchParams;
  const validStatus = Object.values(SupportTicketStatus).includes(q.status as SupportTicketStatus) ? (q.status as SupportTicketStatus) : undefined;
  const where: Prisma.SupportTicketWhereInput = validStatus ? { status: validStatus } : {};
  const tickets = await prisma.supportTicket.findMany({ where, include: { company: true, createdBy: true, _count: { select: { messages: true } } }, orderBy: { lastMessageAt: "desc" } });
  return <>
    <div className="page-head"><div><div className="eyebrow">ATENDIMENTO</div><h1 className="page-title">Suporte</h1><p className="page-subtitle">Responda clientes sem sair do Superadmin. As conversas ficam registradas por empresa.</p></div></div>
    <form className="filter-bar"><select name="status" defaultValue={q.status || ""}><option value="">Todos os status</option><option value="WAITING_SUPPORT">Aguardando suporte</option><option value="WAITING_CUSTOMER">Aguardando cliente</option><option value="OPEN">Aberto</option><option value="CLOSED">Encerrado</option></select><button className="btn btn-soft">Filtrar</button>{q.status && <a className="btn btn-ghost" href="/superadmin/suporte">Limpar</a>}</form>
    <div className="list-card">{tickets.length === 0 ? <div className="empty-state"><strong>Nenhum chamado</strong><span>A caixa de entrada está vazia.</span></div> : tickets.map((t) => <a className="support-row" href={`/superadmin/suporte/${t.id}`} key={t.id}><div><strong>{t.subject}</strong><span>{t.company.name} · {t.createdBy.email} · {t.category} · {t._count.messages} msg</span></div><div><span className={`badge tone-${supportTone(t.status)}`}>{supportStatusLabel[t.status]}</span><small>{t.lastMessageAt.toLocaleString("pt-BR")}</small></div></a>)}</div>
  </>;
}

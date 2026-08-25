import { notFound } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supportStatusLabel, supportTone } from "@/lib/support";

export default async function AdminTicket({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperadmin(); const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({ where: { id }, include: { company: true, createdBy: true, messages: { include: { authorUser: true }, orderBy: { createdAt: "asc" } } } });
  if (!ticket) notFound();
  return <>
    <div className="page-head"><div><a className="back-link" href="/superadmin/suporte">← Suporte</a><h1 className="page-title">{ticket.subject}</h1><p className="page-subtitle">{ticket.company.name} · {ticket.createdBy.email} · {ticket.category}</p></div><span className={`badge tone-${supportTone(ticket.status)}`}>{supportStatusLabel[ticket.status]}</span></div>
    <section className="support-thread">{ticket.messages.map((m)=><article className={`support-message ${m.sender === "SUPPORT" ? "support-message-admin" : ""}`} key={m.id}><div className="support-message-head"><strong>{m.sender === "SUPPORT" ? (m.authorUser?.name || "Suporte Fluxtok") : (m.authorUser?.name || ticket.createdBy.name)}</strong><small>{m.createdAt.toLocaleString("pt-BR")}</small></div><p>{m.message}</p></article>)}</section>
    <section className="form-card"><div className="form-card-head"><div><h2>Responder cliente</h2><p>A resposta aparece no Fluxtok e, com SMTP configurado, também gera um aviso por e-mail.</p></div></div><form className="stack" action={`/api/superadmin/support/${ticket.id}/reply`} method="post"><div className="field"><textarea name="message" required minLength={2} maxLength={6000} placeholder="Escreva uma resposta objetiva..." /></div><div className="form-actions"><button className="btn btn-primary">Responder</button></div></form></section>
    <section className="form-card compact-admin-form"><div><h2>Status do chamado</h2><p>Use “aguardando cliente” depois de responder ou encerre quando resolvido.</p></div><form className="button-row" action={`/api/superadmin/support/${ticket.id}/status`} method="post"><button className="btn btn-soft" name="status" value="WAITING_CUSTOMER">Aguardando cliente</button><button className="btn btn-soft" name="status" value="WAITING_SUPPORT">Aguardando suporte</button><button className="btn btn-danger-soft" name="status" value="CLOSED">Encerrar</button></form></section>
  </>;
}

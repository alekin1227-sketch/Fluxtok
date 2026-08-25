import { notFound } from "next/navigation";
import { requireCompanyIdentity } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supportStatusLabel, supportTone } from "@/lib/support";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCompanyIdentity();
  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({ where: { id, companyId: user.companyId }, include: { messages: { include: { authorUser: true }, orderBy: { createdAt: "asc" } } } });
  if (!ticket) notFound();
  return <>
    <div className="page-head"><div><a className="back-link" href="/support">← Suporte</a><h1 className="page-title">{ticket.subject}</h1><p className="page-subtitle">{ticket.category} · aberto em {ticket.createdAt.toLocaleDateString("pt-BR")}</p></div><span className={`badge tone-${supportTone(ticket.status)}`}>{supportStatusLabel[ticket.status]}</span></div>
    <section className="support-thread">{ticket.messages.map((m) => <article className={`support-message ${m.sender === "SUPPORT" ? "support-message-admin" : ""}`} key={m.id}><div className="support-message-head"><strong>{m.sender === "SUPPORT" ? "Suporte Fluxtok" : (m.authorUser?.name || "Você")}</strong><small>{m.createdAt.toLocaleString("pt-BR")}</small></div><p>{m.message}</p></article>)}</section>
    {ticket.status !== "CLOSED" ? <section className="form-card"><div className="form-card-head"><div><h2>Responder</h2><p>Sua resposta ficará registrada na conversa.</p></div></div><form className="stack" action={`/api/support/tickets/${ticket.id}/reply`} method="post"><div className="field"><textarea name="message" required minLength={2} maxLength={6000} placeholder="Escreva sua mensagem..." /></div><div className="form-actions"><button className="btn btn-primary">Enviar resposta</button></div></form></section> : <div className="notice">Este chamado foi encerrado. Abra um novo chamado se precisar de outro atendimento.</div>}
  </>;
}

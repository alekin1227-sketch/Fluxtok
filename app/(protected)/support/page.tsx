import { requireCompanyIdentity } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";
import { supportStatusLabel, supportTone } from "@/lib/support";
import { Notice } from "@/components/notice";

export default async function SupportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyIdentity();
  const q = await searchParams;
  const [tickets, settings] = await Promise.all([
    prisma.supportTicket.findMany({ where: { companyId: user.companyId }, include: { _count: { select: { messages: true } } }, orderBy: { lastMessageAt: "desc" } }),
    getPlatformSettings(),
  ]);
  return <>
    <div className="page-head"><div><div className="eyebrow">AJUDA HUMANA</div><h1 className="page-title">Suporte</h1><p className="page-subtitle">Abra um chamado sem sair do Fluxtok e acompanhe as respostas no mesmo lugar.</p></div><a className="btn btn-primary" href="#novo">+ Novo chamado</a></div>
    {q.created && <Notice>Chamado criado. A equipe de suporte foi notificada quando o e-mail está configurado.</Notice>}
    {q.error && <Notice type="error">Não foi possível enviar o chamado. Confira os campos.</Notice>}
    <div className="support-intro"><div><strong>Canal oficial de suporte</strong><span>{settings.supportEmail || "Atendimento pelo próprio painel"}</span></div><div><strong>Como funciona</strong><span>Você envia a mensagem e recebe a resposta nesta conversa. Se o SMTP estiver ativo, também recebe aviso por e-mail.</span></div></div>
    <section className="form-card" id="novo"><div className="form-card-head"><div><h2>Novo chamado</h2><p>Explique o problema em poucas palavras e informe o que você esperava que acontecesse.</p></div></div><form action="/api/support/tickets" method="post" className="stack"><div className="form-grid compact-grid"><div className="field"><label>Assunto *</label><input name="subject" required minLength={3} maxLength={160} placeholder="Ex.: Não consigo sincronizar produtos" /></div><div className="field"><label>Categoria *</label><select name="category" defaultValue="Dúvida"><option>Dúvida</option><option>Conta</option><option>Pagamento</option><option>TikTok Shop</option><option>Erro técnico</option><option>Sugestão</option></select></div></div><div className="field"><label>Mensagem *</label><textarea name="message" required minLength={10} maxLength={6000} placeholder="Descreva o que aconteceu e, se possível, informe a tela em que ocorreu." /></div><div className="form-actions"><button className="btn btn-primary">Enviar chamado</button></div></form></section>
    <section className="section"><div className="section-bar"><div><h2>Meus chamados</h2><p>{tickets.length} conversa(s)</p></div></div><div className="list-card">{tickets.length === 0 ? <div className="empty-state"><strong>Nenhum chamado</strong><span>Quando precisar, abra uma conversa com o suporte.</span></div> : tickets.map((t) => <a className="support-row" href={`/support/${t.id}`} key={t.id}><div><strong>{t.subject}</strong><span>{t.category} · {t._count.messages} mensagem(ns)</span></div><div><span className={`badge tone-${supportTone(t.status)}`}>{supportStatusLabel[t.status]}</span><small>{t.lastMessageAt.toLocaleString("pt-BR")}</small></div></a>)}</div></section>
  </>;
}

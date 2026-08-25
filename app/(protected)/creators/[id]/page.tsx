import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contentKindLabel, sampleStatusLabel, creatorStatusLabel } from "@/lib/labels";
import { creatorFluxScore, scoreLabel } from "@/lib/flux-radar";
import { Notice } from "@/components/notice";

interface HistoryEvent {
  date: Date;
  text: string;
  url?: string | null;
  kind: "sample" | "content";
}

export default async function CreatorDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const { id } = await params;
  const q = await searchParams;
  const creator = await prisma.creator.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      samples: { include: { product: true, contents: { select: { publishedAt: true } } }, orderBy: { createdAt: "desc" } },
      contents: { include: { product: true }, orderBy: { publishedAt: "desc" } },
    },
  });
  if (!creator) notFound();

  const pending = creator.samples.filter((s) => s.contents.length === 0 && (s.status === "RECEIVED" || s.status === "WAITING_CONTENT")).length;
  const sales = creator.contents.reduce((sum, c) => sum + (c.sales ?? 0), 0);
  const flux = creatorFluxScore({ samples: creator.samples, sales });
  const events: HistoryEvent[] = [
    ...creator.samples.map((s): HistoryEvent => ({ date: s.sentAt ?? s.createdAt, text: `${s.product.name}: ${sampleStatusLabel[s.status]}`, kind: "sample" })),
    ...creator.contents.map((c): HistoryEvent => ({ date: c.publishedAt, text: `${contentKindLabel[c.kind]} publicado — ${c.product.name}`, url: c.url, kind: "content" })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
  const hasHistory = creator.samples.length > 0 || creator.contents.length > 0;

  return <>
    <div className="page-head"><div><a className="back-link" href="/creators">← Creators</a><h1 className="page-title">{creator.handle}</h1><p className="page-subtitle">{creator.name}{creator.niche ? ` · ${creator.niche}` : ""}</p></div><div className="quick-actions">{creator.profileUrl && <a className="btn btn-soft" target="_blank" rel="noreferrer" href={creator.profileUrl}>Abrir TikTok →</a>}<a className="btn btn-primary" href="#editar">Editar creator</a></div></div>

    {q.updated && <Notice>Creator atualizado.</Notice>}
    {q.archived && <Notice type="info">O creator possui histórico e foi marcado como finalizado para preservar os registros.</Notice>}
    {q.error === "duplicate" && <Notice type="error">Esse @ já pertence a outro creator da empresa.</Notice>}
    {q.error && q.error !== "duplicate" && <Notice type="error">Não foi possível salvar as alterações.</Notice>}

    <div className="metric-grid metric-grid-3"><Metric label="Amostras" value={creator.samples.length} /><Metric label="Publicados" value={creator.contents.length} tone="success" /><Metric label="Pendentes" value={pending} tone={pending ? "warning" : undefined} /></div>

    <details className="form-card create-panel section" id="editar" open={Boolean(q.error)}>
      <summary className="create-panel-summary"><span><b>Editar creator</b><small>Atualize cadastro, contato ou status.</small></span><span>Revisar</span></summary>
      <form className="stack create-panel-body" action={`/api/creators/${creator.id}`} method="post">
        <input type="hidden" name="intent" value="update" />
        <div className="form-grid compact-grid">
          <Field name="name" label="Nome *" defaultValue={creator.name} required />
          <Field name="handle" label="@ do TikTok *" defaultValue={creator.handle} required />
          <div className="field"><label>Status</label><select name="status" defaultValue={creator.status}>{Object.entries(creatorStatusLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <Field name="niche" label="Nicho" defaultValue={creator.niche || ""} />
          <Field name="followers" label="Seguidores" type="number" defaultValue={creator.followers ? String(creator.followers) : ""} />
          <Field name="profileUrl" label="Perfil TikTok" type="url" defaultValue={creator.profileUrl || ""} />
          <Field name="contact" label="Contato" defaultValue={creator.contact || ""} />
          <Field name="contactOrigin" label="Onde encontrou" defaultValue={creator.contactOrigin || ""} />
          <div className="field span-2"><label>Observações</label><textarea name="notes" defaultValue={creator.notes || ""} /></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary">Salvar alterações</button></div>
      </form>
      <form className="danger-zone-inline" action={`/api/creators/${creator.id}`} method="post">
        <input type="hidden" name="intent" value="delete" />
        <div><b>{hasHistory ? "Finalizar creator" : "Excluir creator"}</b><span>{hasHistory ? "O histórico será preservado e o creator ficará como Finalizado." : "Sem amostras ou conteúdos, ele pode ser removido."}</span></div>
        <button className="btn btn-danger-soft" type="submit">{hasHistory ? "Finalizar" : "Excluir"}</button>
      </form>
    </details>

    <details className="creator-score-panel creator-score-collapsible">
      <summary><div><div className="eyebrow">FLUXSCORE</div><strong className="creator-score-value">{flux.score ?? "—"}</strong><span>/ 100</span></div><div><h2>{scoreLabel(flux.score)}</h2><p>Ver análise operacional do creator</p></div></summary>
      <div className="creator-score-details"><p>Considera taxa de publicação, cumprimento de prazo e sinal de vendas. Não é IA e não garante performance futura.</p><div className="score-breakdown"><span>Publicação <b>{Math.round(flux.publicationRate * 100)}%</b></span><span>No prazo <b>{Math.round(flux.onTimeRate * 100)}%</b></span><span>Vendas registradas <b>{sales}</b></span></div></div>
    </details>

    <section className="section"><div className="section-bar"><div><h2>Histórico</h2><p>Envios e conteúdos desse creator.</p></div></div><div className="timeline">
      {events.length === 0 ? <div className="empty-state"><strong>Sem histórico ainda</strong><span>Registre uma amostra para começar.</span></div> : events.map((event, index) => <div className="timeline-item" key={`${event.date.toISOString()}-${index}`}><div className={`timeline-dot ${event.kind === "content" ? "timeline-success" : ""}`} /><div><strong>{event.date.toLocaleDateString("pt-BR")}</strong><p>{event.text}</p>{event.url && <a className="text-link" href={event.url} target="_blank" rel="noopener noreferrer">Abrir conteúdo →</a>}</div></div>)}
    </div></section>
  </>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" }) { return <div className={`metric-card ${tone ? `metric-${tone}` : ""}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>; }
function Field({ name, label, type = "text", defaultValue, required = false }: { name: string; label: string; type?: string; defaultValue?: string; required?: boolean }) { return <div className="field"><label>{label}</label><input name={name} type={type} defaultValue={defaultValue} required={required} /></div>; }

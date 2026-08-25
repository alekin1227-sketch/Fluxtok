import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contentKindLabel, sampleStatusLabel } from "@/lib/labels";
import { creatorFluxScore, scoreLabel } from "@/lib/flux-radar";

interface HistoryEvent {
  date: Date;
  text: string;
  url?: string | null;
  kind: "sample" | "content";
}

export default async function CreatorDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCompanyUser();
  const { id } = await params;
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

  return <>
    <div className="page-head"><div><a className="back-link" href="/creators">← Creators</a><h1 className="page-title">{creator.handle}</h1><p className="page-subtitle">{creator.name}{creator.niche ? ` · ${creator.niche}` : ""}</p></div>{creator.profileUrl && <a className="btn btn-soft" target="_blank" rel="noreferrer" href={creator.profileUrl}>Abrir TikTok →</a>}</div>
    <div className="creator-score-panel"><div><div className="eyebrow">FLUXSCORE</div><strong className="creator-score-value">{flux.score ?? "—"}</strong><span>/ 100</span></div><div><h2>{scoreLabel(flux.score)}</h2><p>Indicador operacional transparente: considera taxa de publicação, cumprimento de prazo e sinal de vendas. Não é IA e não garante performance futura.</p><div className="score-breakdown"><span>Publicação <b>{Math.round(flux.publicationRate * 100)}%</b></span><span>No prazo <b>{Math.round(flux.onTimeRate * 100)}%</b></span><span>Vendas registradas <b>{sales}</b></span></div></div></div>
    <div className="metric-grid metric-grid-3"><Metric label="Amostras" value={creator.samples.length} /><Metric label="Publicados" value={creator.contents.length} tone="success" /><Metric label="Pendentes" value={pending} tone={pending ? "warning" : undefined} /></div>

    <section className="section"><div className="section-bar"><div><h2>Histórico da colaboração</h2><p>Envios e conteúdos em ordem cronológica.</p></div></div><div className="timeline">
      {events.length === 0 ? <div className="empty-state"><strong>Sem histórico ainda</strong><span>Registre uma amostra para começar.</span></div> : events.map((event, index) => <div className="timeline-item" key={`${event.date.toISOString()}-${index}`}><div className={`timeline-dot ${event.kind === "content" ? "timeline-success" : ""}`} /><div><strong>{event.date.toLocaleDateString("pt-BR")}</strong><p>{event.text}</p>{event.url && <a className="text-link" href={event.url} target="_blank" rel="noopener noreferrer">Abrir conteúdo →</a>}</div></div>)}
    </div></section>
  </>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" }) { return <div className={`metric-card ${tone ? `metric-${tone}` : ""}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>; }

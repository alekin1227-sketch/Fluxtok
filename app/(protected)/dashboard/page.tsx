import { Prisma, SampleStatus } from "@prisma/client";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanySettings, pendingTone } from "@/lib/tenant";
import { buildFluxRadar } from "@/lib/flux-radar";

export default async function Dashboard() {
  const user = await requireCompanyUser();
  const companyId = user.companyId;
  const settings = await getCompanySettings(companyId);
  const pendingWhere: Prisma.SampleWhereInput = {
    companyId,
    status: { in: [SampleStatus.RECEIVED, SampleStatus.WAITING_CONTENT] },
    contents: { none: {} },
  };

  const [creators, products, sent, waitingReceipt, published, pendingCount, lateCount, pendingSamples, radarSamples, campaigns, performance, tiktok] = await Promise.all([
    prisma.creator.count({ where: { companyId } }),
    prisma.product.count({ where: { companyId, active: true } }),
    prisma.sample.count({ where: { companyId, status: { in: ["SENT", "IN_TRANSIT", "RECEIVED", "WAITING_CONTENT", "CONTENT_PUBLISHED"] } } }),
    prisma.sample.count({ where: { companyId, status: { in: ["SENT", "IN_TRANSIT"] } } }),
    prisma.content.count({ where: { companyId } }),
    prisma.sample.count({ where: pendingWhere }),
    prisma.sample.count({ where: { ...pendingWhere, contentDueAt: { lt: new Date() } } }),
    prisma.sample.findMany({ where: pendingWhere, include: { creator: true, product: true }, orderBy: { contentDueAt: "asc" }, take: 8 }),
    prisma.sample.findMany({ where: { companyId, status: { in: ["SENT", "IN_TRANSIT", "RECEIVED", "WAITING_CONTENT"] } }, include: { creator: true, product: true, contents: { select: { publishedAt: true } } }, orderBy: { updatedAt: "desc" }, take: 80 }),
    prisma.campaign.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.content.aggregate({ where: { companyId }, _sum: { revenue: true, sales: true } }),
    prisma.tikTokConnection.findUnique({ where: { companyId }, select: { status: true, shopName: true, lastSyncAt: true } }),
  ]);

  const radar = buildFluxRadar(radarSamples, settings.warningDaysBeforeDue);
  const setup = [
    { done: creators > 0, label: "Cadastrar o primeiro creator", href: "/creators#novo" },
    { done: products > 0, label: "Cadastrar ou sincronizar um produto", href: "/products#novo" },
    { done: sent > 0, label: "Registrar a primeira amostra", href: "/samples#novo" },
    { done: published > 0, label: "Registrar o primeiro conteúdo", href: "/contents#novo" },
  ];
  const setupDone = setup.filter((x) => x.done).length;

  return <>
    <div className="page-head">
      <div><div className="eyebrow">VISÃO GERAL</div><h1 className="page-title">Olá, {firstName(user.name)}</h1><p className="page-subtitle">O Fluxtok mostra o que aconteceu e, no FluxRadar, o que merece sua próxima ação.</p></div>
      <div className="quick-actions"><a className="btn btn-soft" href="/creators#novo">+ Creator</a><a className="btn btn-primary" href="/samples#novo">+ Amostra</a></div>
    </div>

    <div className="metric-grid">
      <Metric label="Creators" value={creators} hint="cadastrados" />
      <Metric label="Amostras" value={sent} hint="enviadas" />
      <Metric label="Em transporte" value={waitingReceipt} hint="aguardando recebimento" />
      <Metric label="Pendentes" value={pendingCount} hint="aguardando conteúdo" tone={pendingCount ? "warning" : undefined} />
      <Metric label="Publicados" value={published} hint="conteúdos registrados" tone="success" />
      <Metric label="Atrasados" value={lateCount} hint="exigem atenção" tone={lateCount ? "danger" : undefined} />
    </div>

    {setupDone < setup.length && <section className="setup-guide"><div><div className="eyebrow">COMECE POR AQUI</div><h2>{setupDone}/{setup.length} passos concluídos</h2><p>Você não precisa configurar tudo de uma vez. Complete o fluxo básico e o restante aparece conforme o uso.</p></div><div className="setup-steps">{setup.map((x) => <a href={x.href} className={x.done ? "setup-step done" : "setup-step"} key={x.label}><span>{x.done ? "✓" : "→"}</span>{x.label}</a>)}</div></section>}

    <section className="fluxradar-card">
      <div className="fluxradar-head"><div><div className="eyebrow">DIFERENCIAL FLUXTOK</div><h2>FluxRadar</h2><p>Em vez de só mostrar números, o sistema prioriza as próximas ações da operação.</p></div><span className="radar-pill">Atualizado agora</span></div>
      <div className="radar-list">{radar.length === 0 ? <div className="radar-empty"><b>Operação em dia</b><span>Nenhuma ação urgente encontrada. Continue acompanhando os próximos envios.</span></div> : radar.map((item, i) => <a className={`radar-item radar-${item.tone}`} href={item.href} key={`${item.title}-${i}`}><span className="radar-index">{i + 1}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><b>Resolver →</b></a>)}</div>
    </section>

    <div className="snapshot-grid">
      <a className="snapshot-card" href="/campaigns"><small>Campanhas ativas</small><strong>{campaigns}</strong><span>Organizar ações →</span></a>
      <a className="snapshot-card" href="/contents"><small>Vendas registradas</small><strong>{performance._sum.sales ?? 0}</strong><span>Dados manuais →</span></a>
      <a className="snapshot-card" href="/contents"><small>Faturamento atribuído</small><strong>R$ {Number(performance._sum.revenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong><span>Ver conteúdos →</span></a>
      <a className="snapshot-card" href="/integrations/tiktok"><small>TikTok Shop</small><strong>{tiktok?.status === "CONNECTED" ? "Conectado" : "Manual"}</strong><span>{tiktok?.shopName || "Configurar integração"} →</span></a>
    </div>

    <section className="section">
      <div className="section-bar"><div><h2>Pendências prioritárias</h2><p>Ordenadas pelo prazo de publicação.</p></div><a className="text-link" href="/pending">Ver todas →</a></div>
      <div className="list-card">
        {pendingSamples.length === 0 ? <div className="empty-state"><strong>Tudo em dia</strong><span>Nenhuma amostra está aguardando conteúdo.</span></div> : pendingSamples.map((s) => {
          const tone = pendingTone(s.contentDueAt, settings.warningDaysBeforeDue);
          const days = s.receivedAt ? Math.max(0, Math.floor((Date.now() - s.receivedAt.getTime()) / 86400000)) : 0;
          return <div className="attention-row" key={s.id}><div className={`status-dot status-${tone}`} /><div className="attention-main"><strong>{s.creator.handle}</strong><span>{s.product.name}</span></div><div className="attention-meta">Recebida há {days} dia(s)</div><div><span className={`badge tone-${tone}`}>{toneLabel(tone)}</span></div></div>;
        })}
      </div>
    </section>
  </>;
}

function Metric({ label, value, hint, tone }: { label: string; value: number; hint: string; tone?: "success" | "warning" | "danger" }) { return <div className={`metric-card ${tone ? `metric-${tone}` : ""}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-hint">{hint}</div></div>; }
function firstName(name: string) { return name.trim().split(/\s+/)[0] || name; }
function toneLabel(tone: string) { return tone === "danger" ? "Atrasado" : tone === "warning" ? "Prazo próximo" : tone === "success" ? "No prazo" : "Sem prazo"; }

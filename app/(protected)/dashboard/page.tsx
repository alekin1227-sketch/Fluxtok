import { Prisma, SampleStatus } from "@prisma/client";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/tenant";
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

  const [creators, activeSamples, published, pendingCount, lateCount, radarSamples, campaigns, performance, tiktok] = await Promise.all([
    prisma.creator.count({ where: { companyId, status: { not: "NOT_INTERESTED" } } }),
    prisma.sample.count({ where: { companyId, status: { in: ["PREPARING", "SENT", "IN_TRANSIT", "RECEIVED", "WAITING_CONTENT"] } } }),
    prisma.content.count({ where: { companyId } }),
    prisma.sample.count({ where: pendingWhere }),
    prisma.sample.count({ where: { ...pendingWhere, contentDueAt: { lt: new Date() } } }),
    prisma.sample.findMany({
      where: { companyId, status: { in: ["SENT", "IN_TRANSIT", "RECEIVED", "WAITING_CONTENT"] } },
      include: { creator: true, product: true, contents: { select: { publishedAt: true } } },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    prisma.campaign.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.content.aggregate({ where: { companyId }, _sum: { revenue: true, sales: true } }),
    prisma.tikTokConnection.findUnique({ where: { companyId }, select: { status: true, shopName: true } }),
  ]);

  const radar = buildFluxRadar(radarSamples, settings.warningDaysBeforeDue).slice(0, 5);

  return <>
    <div className="page-head simple-page-head">
      <div>
        <div className="eyebrow">INÍCIO</div>
        <h1 className="page-title">Olá, {firstName(user.name)}</h1>
        <p className="page-subtitle">Veja o que precisa de atenção agora. Os detalhes ficam nas telas específicas.</p>
      </div>
      <div className="quick-actions">
        <a className="btn btn-soft" href="/creators#novo">+ Creator</a>
        <a className="btn btn-primary" href="/samples#novo">+ Amostra</a>
      </div>
    </div>

    <div className="metric-grid metric-grid-simple">
      <Metric label="Creators ativos" value={creators} />
      <Metric label="Amostras em andamento" value={activeSamples} />
      <Metric label="Conteúdos pendentes" value={pendingCount} tone={pendingCount ? "warning" : undefined} />
      <Metric label="Publicados" value={published} tone="success" />
    </div>

    <section className="fluxradar-card simple-radar">
      <div className="fluxradar-head">
        <div>
          <div className="eyebrow">PRÓXIMAS AÇÕES</div>
          <h2>FluxRadar</h2>
          <p>Mostra primeiro o que está atrasado ou perto do prazo.</p>
        </div>
        {lateCount > 0 && <span className="radar-pill">{lateCount} atrasado(s)</span>}
      </div>
      <div className="radar-list">
        {radar.length === 0 ? <div className="radar-empty"><b>Tudo em dia</b><span>Nenhuma ação urgente encontrada.</span></div> : radar.map((item, i) => <a className={`radar-item radar-${item.tone}`} href={item.href} key={`${item.title}-${i}`}><span className="radar-index">{i + 1}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><b>Resolver →</b></a>)}
      </div>
      <div className="simple-radar-footer"><a className="text-link" href="/pending">Ver todas as pendências →</a></div>
    </section>

    <details className="dashboard-more">
      <summary>Ver mais indicadores</summary>
      <div className="snapshot-grid simple-snapshot-grid">
        <a className="snapshot-card" href="/campaigns"><small>Campanhas ativas</small><strong>{campaigns}</strong><span>Ver campanhas →</span></a>
        <a className="snapshot-card" href="/contents"><small>Vendas registradas</small><strong>{performance._sum.sales ?? 0}</strong><span>Ver conteúdos →</span></a>
        <a className="snapshot-card" href="/contents"><small>Faturamento atribuído</small><strong>R$ {Number(performance._sum.revenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong><span>Ver resultados →</span></a>
        <a className="snapshot-card" href="/integrations/tiktok"><small>TikTok Shop</small><strong>{tiktok?.status === "CONNECTED" ? "Conectado" : "Manual"}</strong><span>{tiktok?.shopName || "Configurar"} →</span></a>
      </div>
    </details>
  </>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" | "danger" }) {
  return <div className={`metric-card ${tone ? `metric-${tone}` : ""}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>;
}
function firstName(name: string) { return name.trim().split(/\s+/)[0] || name; }

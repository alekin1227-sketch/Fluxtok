import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanySettings, pendingTone } from "@/lib/tenant";

export default async function Pending({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const q = await searchParams;
  const settings = await getCompanySettings(user.companyId);
  const rows = await prisma.sample.findMany({
    where: { companyId: user.companyId, status: { in: ["RECEIVED", "WAITING_CONTENT"] }, contents: { none: {} } },
    include: { creator: true, product: true },
  });

  rows.sort((a, b) => {
    if (q.sort === "creator") return a.creator.handle.localeCompare(b.creator.handle);
    if (q.sort === "received") return (a.receivedAt?.getTime() ?? 0) - (b.receivedAt?.getTime() ?? 0);
    if (q.sort === "product") return a.product.name.localeCompare(b.product.name);
    return (a.contentDueAt?.getTime() ?? Infinity) - (b.contentDueAt?.getTime() ?? Infinity);
  });

  const lateCount = rows.filter((row) => pendingTone(row.contentDueAt, settings.warningDaysBeforeDue) === "danger").length;

  return <>
    <div className="page-head"><div><div className="eyebrow">O QUE PRECISA DE ATENÇÃO</div><h1 className="page-title">Pendências</h1><p className="page-subtitle">Creators que receberam amostra e ainda não têm conteúdo registrado.</p></div><div className="summary-pill"><strong>{lateCount}</strong><span>atrasada(s)</span></div></div>

    <section className="section section-first">
      <form className="filter-bar"><select name="sort" defaultValue={q.sort ?? "delay"}><option value="delay">Maior atraso</option><option value="received">Data de recebimento</option><option value="creator">Creator</option><option value="product">Produto</option></select><button className="btn btn-soft">Ordenar</button></form>
      <div className="table-wrap"><table className="table"><thead><tr><th>Situação</th><th>Creator</th><th>Produto</th><th>Recebido</th><th>Prazo</th><th>Resumo</th></tr></thead><tbody>{rows.map((s) => {
        const tone = pendingTone(s.contentDueAt, settings.warningDaysBeforeDue);
        const late = s.contentDueAt ? Math.max(0, Math.floor((Date.now() - s.contentDueAt.getTime()) / 86400000)) : 0;
        return <tr key={s.id}><td><span className={`badge tone-${tone}`}>{tone === "danger" ? "Atrasado" : tone === "warning" ? "Prazo próximo" : tone === "success" ? "No prazo" : "Sem prazo"}</span></td><td><a className="entity-link" href={`/creators/${s.creator.id}`}><strong>{s.creator.handle}</strong><span>{s.creator.name}</span></a></td><td>{s.product.name}</td><td>{s.receivedAt?.toLocaleDateString("pt-BR") ?? "—"}</td><td>{s.contentDueAt?.toLocaleDateString("pt-BR") ?? "—"}</td><td>{tone === "danger" ? `${late} dia(s) de atraso` : tone === "neutral" ? "Defina um prazo" : "Aguardando publicação"}</td></tr>;
      })}</tbody></table>{rows.length === 0 && <div className="empty-state"><strong>Tudo em dia</strong><span>Nenhum conteúdo está pendente no momento.</span></div>}</div>
    </section>
  </>;
}

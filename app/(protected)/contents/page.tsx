import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contentKindLabel } from "@/lib/labels";
import { Notice } from "@/components/notice";

export default async function Contents({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const q = await searchParams;
  const [samples, contents] = await Promise.all([
    prisma.sample.findMany({
      where: { companyId: user.companyId, status: { in: ["RECEIVED", "WAITING_CONTENT"] }, contents: { none: {} } },
      include: { creator: true, product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.content.findMany({ where: { companyId: user.companyId }, include: { creator: true, product: true }, orderBy: { publishedAt: "desc" } }),
  ]);

  return <>
    <div className="page-head"><div><div className="eyebrow">ENTREGAS</div><h1 className="page-title">Conteúdos</h1><p className="page-subtitle">Registre a publicação e encerre a pendência da amostra.</p></div><a className="btn btn-primary" href="#novo">+ Registrar conteúdo</a></div>

    {q.created && <Notice>Conteúdo registrado. A amostra foi marcada como publicada.</Notice>}
    {q.error && <Notice type="error">Não foi possível registrar o conteúdo. Confira a amostra, data e URL.</Notice>}

    <section className="form-card" id="novo">
      <div className="form-card-head"><div><h2>Registrar publicação</h2><p>Os dados de desempenho são opcionais e podem ser preenchidos depois.</p></div></div>
      <form className="stack" action="/api/contents" method="post">
        <div className="form-grid compact-grid">
          <div className="field span-2"><label>Amostra relacionada *</label><select name="sampleId" required><option value="">Selecione a amostra</option>{samples.map((s) => <option key={s.id} value={s.id}>{s.creator.handle} — {s.product.name}</option>)}</select></div>
          <div className="field"><label>Tipo *</label><select name="kind" defaultValue="VIDEO">{Object.entries(contentKindLabel).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select></div>
          <Field name="publishedAt" label="Data de publicação *" type="date" required />
          <div className="field span-2"><label>Link do conteúdo *</label><input name="url" type="url" placeholder="https://www.tiktok.com/..." required /></div>
        </div>
        <details className="optional-box"><summary>Adicionar resultados do conteúdo</summary><div className="form-grid optional-grid">
          <Field name="views" label="Visualizações" type="number" />
          <Field name="sales" label="Vendas" type="number" />
          <Field name="revenue" label="Faturamento gerado (R$)" type="number" step="0.01" />
          <div className="field span-2"><label>Observações</label><textarea name="notes" placeholder="Anotações sobre o desempenho ou a publicação." /></div>
        </div></details>
        <div className="form-actions"><button className="btn btn-primary" disabled={samples.length === 0}>Registrar conteúdo</button>{samples.length === 0 && <span className="helper">Nenhuma amostra está aguardando conteúdo.</span>}</div>
      </form>
    </section>

    <section className="section">
      <div className="section-bar"><div><h2>Publicações registradas</h2><p>{contents.length} conteúdo(s)</p></div></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Creator</th><th>Produto</th><th>Tipo</th><th>Publicado</th><th>Views</th><th>Vendas</th><th>Link</th></tr></thead><tbody>
        {contents.map((c) => <tr key={c.id}><td><strong>{c.creator.handle}</strong></td><td>{c.product.name}</td><td><span className="badge tone-brand">{contentKindLabel[c.kind]}</span></td><td>{c.publishedAt.toLocaleDateString("pt-BR")}</td><td>{c.views?.toLocaleString("pt-BR") ?? "—"}</td><td>{c.sales ?? "—"}</td><td><a className="text-link" target="_blank" rel="noreferrer" href={c.url}>Abrir →</a></td></tr>)}
      </tbody></table>{contents.length === 0 && <div className="empty-state"><strong>Nenhum conteúdo registrado</strong><span>Quando um creator publicar, registre o link aqui.</span></div>}</div>
    </section>
  </>;
}

function Field({ name, label, type = "text", required = false, step }: { name: string; label: string; type?: string; required?: boolean; step?: string }) { return <div className="field"><label>{label}</label><input name={name} type={type} required={required} step={step} /></div>; }

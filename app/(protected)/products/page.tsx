import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Notice } from "@/components/notice";

export default async function Products({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const q = await searchParams;
  const products = await prisma.product.findMany({ where: { companyId: user.companyId }, orderBy: { name: "asc" } });

  return <>
    <div className="page-head"><div><div className="eyebrow">CATÁLOGO SIMPLES</div><h1 className="page-title">Produtos</h1><p className="page-subtitle">Cadastre apenas o necessário para vincular produtos às amostras.</p></div><a className="btn btn-primary" href="#novo">+ Novo produto</a></div>

    {q.created && <Notice>Produto cadastrado com sucesso.</Notice>}
    {q.error && <Notice type="error">Não foi possível cadastrar. Confira os campos preenchidos.</Notice>}

    <section className="form-card" id="novo">
      <div className="form-card-head"><div><h2>Novo produto</h2><p>Você pode começar somente com o nome.</p></div></div>
      <form className="stack" action="/api/products" method="post">
        <div className="form-grid compact-grid">
          <Field name="name" label="Nome do produto *" placeholder="Ex.: Kit Skincare" required />
          <div className="field"><label>Situação</label><select name="active" defaultValue="true"><option value="true">Ativo</option><option value="false">Inativo</option></select></div>
        </div>
        <details className="optional-box"><summary>Adicionar SKU, custo e links</summary><div className="form-grid optional-grid">
          <Field name="sku" label="SKU" placeholder="Opcional" />
          <Field name="cost" label="Custo da amostra (R$)" type="number" placeholder="0,00" step="0.01" />
          <Field name="tiktokUrl" label="Link no TikTok Shop" type="url" placeholder="https://..." />
          <Field name="photoUrl" label="Link da foto" type="url" placeholder="https://..." />
        </div></details>
        <div className="form-actions"><button className="btn btn-primary">Cadastrar produto</button></div>
      </form>
    </section>

    <section className="section">
      <div className="section-bar"><div><h2>Produtos cadastrados</h2><p>{products.length} produto(s)</p></div></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Produto</th><th>SKU</th><th>Custo</th><th>Situação</th><th>Origem / TikTok</th></tr></thead><tbody>
        {products.map((p) => <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.sku ?? "—"}</td><td>{p.cost ? `R$ ${Number(p.cost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</td><td><span className={`badge ${p.active ? "tone-success" : "tone-neutral"}`}>{p.active ? "Ativo" : "Inativo"}</span></td><td>{p.tiktokProductId ? <span className="badge tone-brand">Sincronizado</span> : p.tiktokUrl ? <a className="text-link" target="_blank" rel="noreferrer" href={p.tiktokUrl}>Abrir →</a> : "Manual"}</td></tr>)}
      </tbody></table>{products.length === 0 && <div className="empty-state"><strong>Nenhum produto cadastrado</strong><span>Cadastre o primeiro produto para começar a registrar amostras.</span></div>}</div>
    </section>
  </>;
}

function Field({ name, label, type = "text", placeholder, required = false, step }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean; step?: string }) {
  return <div className="field"><label>{label}</label><input name={name} type={type} placeholder={placeholder} required={required} step={step} /></div>;
}

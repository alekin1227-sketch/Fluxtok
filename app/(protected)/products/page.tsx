import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Notice } from "@/components/notice";

export default async function Products({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const q = await searchParams;
  const products = await prisma.product.findMany({
    where: { companyId: user.companyId },
    include: { _count: { select: { samples: true, contents: true, campaigns: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return <>
    <div className="page-head"><div><div className="eyebrow">CADASTRO</div><h1 className="page-title">Produtos</h1><p className="page-subtitle">Cadastre, revise e mantenha apenas os produtos usados na operação.</p></div><a className="btn btn-primary" href="#novo">+ Novo produto</a></div>

    {q.created && <Notice>Produto cadastrado com sucesso.</Notice>}
    {q.updated && <Notice>Produto atualizado.</Notice>}
    {q.deleted && <Notice>Produto excluído.</Notice>}
    {q.archived && <Notice type="info">O produto possui histórico e foi apenas desativado para não quebrar dados antigos.</Notice>}
    {q.error && <Notice type="error">Não foi possível concluir a operação. Confira os campos.</Notice>}

    <details className="form-card create-panel" id="novo" open={Boolean(q.error)}>
      <summary className="create-panel-summary"><span><b>Novo produto</b><small>Nome é o único campo obrigatório.</small></span><span>Adicionar</span></summary>
      <form className="stack create-panel-body" action="/api/products" method="post">
        <input type="hidden" name="intent" value="create" />
        <div className="form-grid compact-grid">
          <Field name="name" label="Nome do produto *" placeholder="Ex.: Kit Skincare" required />
          <div className="field"><label>Situação</label><select name="active" defaultValue="true"><option value="true">Ativo</option><option value="false">Inativo</option></select></div>
        </div>
        <details className="optional-box"><summary>SKU, custo e links</summary><div className="form-grid optional-grid">
          <Field name="sku" label="SKU" placeholder="Opcional" />
          <Field name="cost" label="Custo da amostra (R$)" type="number" placeholder="0,00" step="0.01" />
          <Field name="tiktokUrl" label="Link no TikTok Shop" type="url" placeholder="https://..." />
          <Field name="photoUrl" label="Link da foto" type="url" placeholder="https://..." />
        </div></details>
        <div className="form-actions"><button className="btn btn-primary">Cadastrar produto</button></div>
      </form>
    </details>

    <section className="section">
      <div className="section-bar"><div><h2>Produtos cadastrados</h2><p>{products.length} produto(s)</p></div></div>
      <div className="simple-record-list">
        {products.map((p) => {
          const hasHistory = p._count.samples > 0 || p._count.contents > 0;
          return <article className="simple-record" key={p.id}>
            <div className="simple-record-main">
              <div><strong>{p.name}</strong><span>{p.sku || "Sem SKU"}{p.cost ? ` · R$ ${Number(p.cost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}</span></div>
              <div className="simple-record-badges"><span className={`badge ${p.active ? "tone-success" : "tone-neutral"}`}>{p.active ? "Ativo" : "Inativo"}</span>{p.tiktokProductId && <span className="badge tone-brand">TikTok</span>}</div>
            </div>
            <div className="simple-record-meta"><span>{p._count.samples} amostra(s)</span><span>{p._count.contents} conteúdo(s)</span></div>
            <details className="record-actions"><summary>Editar</summary>
              <form className="stack record-edit-form" action="/api/products" method="post">
                <input type="hidden" name="intent" value="update" /><input type="hidden" name="id" value={p.id} />
                <div className="form-grid compact-grid">
                  <Field name="name" label="Nome *" defaultValue={p.name} required />
                  <Field name="sku" label="SKU" defaultValue={p.sku || ""} />
                  <Field name="cost" label="Custo (R$)" type="number" step="0.01" defaultValue={p.cost ? String(p.cost) : ""} />
                  <div className="field"><label>Situação</label><select name="active" defaultValue={String(p.active)}><option value="true">Ativo</option><option value="false">Inativo</option></select></div>
                  <Field name="tiktokUrl" label="Link TikTok Shop" type="url" defaultValue={p.tiktokUrl || ""} />
                  <Field name="photoUrl" label="Link da foto" type="url" defaultValue={p.photoUrl || ""} />
                </div>
                <div className="form-actions"><button className="btn btn-primary">Salvar alterações</button></div>
              </form>
              <form className="danger-zone-inline" action="/api/products" method="post">
                <input type="hidden" name="intent" value="delete" /><input type="hidden" name="id" value={p.id} />
                <div><b>{hasHistory ? "Desativar produto" : "Excluir produto"}</b><span>{hasHistory ? "Como já existe histórico, o Fluxtok preserva os registros e apenas desativa." : "O produto não possui histórico e pode ser removido."}</span></div>
                <button className="btn btn-danger-soft" type="submit">{hasHistory ? "Desativar" : "Excluir"}</button>
              </form>
            </details>
          </article>;
        })}
        {products.length === 0 && <div className="empty-state"><strong>Nenhum produto cadastrado</strong><span>Cadastre o primeiro produto para começar.</span></div>}
      </div>
    </section>
  </>;
}

function Field({ name, label, type = "text", placeholder, required = false, step, defaultValue }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean; step?: string; defaultValue?: string }) {
  return <div className="field"><label>{label}</label><input name={name} type={type} placeholder={placeholder} required={required} step={step} defaultValue={defaultValue} /></div>;
}

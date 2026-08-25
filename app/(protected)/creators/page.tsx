import { CreatorStatus, Prisma } from "@prisma/client";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creatorStatusLabel } from "@/lib/labels";
import { getCompanySettings } from "@/lib/tenant";
import { Notice } from "@/components/notice";

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const q = await searchParams;
  const settings = await getCompanySettings(user.companyId);
  const and: Prisma.CreatorWhereInput[] = [];

  if (q.search) and.push({ OR: [{ name: { contains: q.search } }, { handle: { contains: q.search } }, { niche: { contains: q.search } }] });
  if (q.status) and.push({ status: q.status as CreatorStatus });
  if (q.filter === "pending") and.push({ samples: { some: { status: { in: ["RECEIVED", "WAITING_CONTENT"] }, contents: { none: {} } } } });
  if (q.filter === "inactive") {
    const cutoff = new Date(Date.now() - settings.inactiveCreatorDays * 86400000);
    and.push({ createdAt: { lt: cutoff }, samples: { none: { updatedAt: { gte: cutoff } } }, contents: { none: { publishedAt: { gte: cutoff } } } });
  }

  const creators = await prisma.creator.findMany({ where: { companyId: user.companyId, AND: and }, orderBy: { updatedAt: "desc" } });

  return <>
    <div className="page-head"><div><div className="eyebrow">CREATORS</div><h1 className="page-title">Creators</h1><p className="page-subtitle">Cadastre, acompanhe o status e abra o creator quando precisar revisar detalhes.</p></div><a className="btn btn-primary" href="#novo">+ Novo creator</a></div>

    {q.created && <Notice>Creator cadastrado com sucesso.</Notice>}
    {q.deleted && <Notice>Creator excluído.</Notice>}
    {q.saved && <Notice>Status atualizado.</Notice>}
    {q.error === "duplicate" && <Notice type="error">Esse @ já está cadastrado nesta empresa.</Notice>}
    {q.error === "invalid" && <Notice type="error">Confira nome, @ e os campos opcionais.</Notice>}

    <details className="form-card create-panel" id="novo" open={Boolean(q.error)}>
      <summary className="create-panel-summary"><span><b>Novo creator</b><small>Nome e @ são suficientes para começar.</small></span><span>Adicionar</span></summary>
      <form action="/api/creators" method="post" className="stack create-panel-body">
        <div className="form-grid compact-grid">
          <Field name="name" label="Nome *" placeholder="Ex.: Ana Souza" required />
          <Field name="handle" label="@ do TikTok *" placeholder="@anasouza" required />
          <div className="field"><label>Status</label><select name="status" defaultValue="FOUND">{Object.entries(creatorStatusLabel).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select></div>
        </div>
        <details className="optional-box"><summary>Detalhes opcionais</summary><div className="form-grid optional-grid">
          <Field name="niche" label="Nicho" placeholder="Beleza, fitness..." />
          <Field name="followers" label="Seguidores" type="number" placeholder="25000" />
          <Field name="profileUrl" label="Perfil TikTok" type="url" placeholder="https://www.tiktok.com/@..." />
          <Field name="contact" label="Contato" placeholder="E-mail ou telefone" />
          <Field name="contactOrigin" label="Onde encontrou" placeholder="TikTok, indicação..." />
          <div className="field span-2"><label>Observações</label><textarea name="notes" /></div>
        </div></details>
        <div className="form-actions"><button className="btn btn-primary" type="submit">Cadastrar creator</button></div>
      </form>
    </details>

    <section className="section">
      <div className="section-bar"><div><h2>Lista de creators</h2><p>{creators.length} resultado(s)</p></div></div>
      <form className="filter-bar">
        <input name="search" placeholder="Buscar nome, @ ou nicho" defaultValue={q.search} />
        <select name="status" defaultValue={q.status ?? ""}><option value="">Todos os status</option>{Object.entries(creatorStatusLabel).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select>
        <select name="filter" defaultValue={q.filter ?? ""}><option value="">Todos</option><option value="pending">Com conteúdo pendente</option><option value="inactive">Sem atividade recente</option></select>
        <button className="btn btn-soft">Filtrar</button>{(q.search || q.status || q.filter) && <a className="btn btn-ghost" href="/creators">Limpar</a>}
      </form>
      <div className="table-wrap"><table className="table simple-table"><thead><tr><th>Creator</th><th>Nicho / seguidores</th><th>Status</th><th></th></tr></thead><tbody>
        {creators.map((c) => <tr key={c.id}><td><a className="entity-link" href={`/creators/${c.id}`}><strong>{c.name}</strong><span>{c.handle}</span></a></td><td>{c.niche ?? "—"}<div className="cell-sub">{c.followers?.toLocaleString("pt-BR") ?? "—"} seguidores</div></td><td><form className="inline-form" action={`/api/creators/${c.id}/status`} method="post"><select name="status" defaultValue={c.status}>{Object.entries(creatorStatusLabel).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select><button className="btn btn-mini">Salvar</button></form></td><td><a className="text-link" href={`/creators/${c.id}`}>Revisar →</a></td></tr>)}
      </tbody></table>{creators.length === 0 && <div className="empty-state"><strong>Nenhum creator encontrado</strong><span>Cadastre um creator ou ajuste os filtros.</span></div>}</div>
    </section>
  </>;
}

function Field({ name, label, type = "text", placeholder, required = false }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }) {
  return <div className="field"><label>{label}</label><input name={name} type={type} placeholder={placeholder} required={required} /></div>;
}

import { CreatorStatus, Prisma } from "@prisma/client";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creatorStatusLabel, creatorTone } from "@/lib/labels";
import { getCompanySettings } from "@/lib/tenant";
import { Notice } from "@/components/notice";

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const q = await searchParams;
  const settings = await getCompanySettings(user.companyId);
  const and: Prisma.CreatorWhereInput[] = [];

  if (q.search) and.push({ OR: [{ name: { contains: q.search } }, { handle: { contains: q.search } }, { niche: { contains: q.search } }] });
  if (q.status) and.push({ status: q.status as CreatorStatus });
  if (q.filter === "samples") and.push({ samples: { some: {} } });
  if (q.filter === "pending") and.push({ samples: { some: { status: { in: ["RECEIVED", "WAITING_CONTENT"] }, contents: { none: {} } } } });
  if (q.filter === "inactive") {
    const cutoff = new Date(Date.now() - settings.inactiveCreatorDays * 86400000);
    and.push({ createdAt: { lt: cutoff }, samples: { none: { updatedAt: { gte: cutoff } } }, contents: { none: { publishedAt: { gte: cutoff } } } });
  }

  const creators = await prisma.creator.findMany({ where: { companyId: user.companyId, AND: and }, orderBy: { updatedAt: "desc" } });

  return <>
    <div className="page-head"><div><div className="eyebrow">RELACIONAMENTO</div><h1 className="page-title">Creators</h1><p className="page-subtitle">Cadastre só o essencial. Complete os detalhes quando fizer sentido.</p></div><a className="btn btn-primary" href="#novo">+ Novo creator</a></div>

    {q.created && <Notice>Creator cadastrado com sucesso.</Notice>}
    {q.saved && <Notice>Status atualizado.</Notice>}
    {q.error === "duplicate" && <Notice type="error">Esse @ já está cadastrado nesta empresa.</Notice>}
    {q.error === "invalid" && <Notice type="error">Confira nome, @ e os campos opcionais preenchidos.</Notice>}

    <section className="form-card" id="novo">
      <div className="form-card-head"><div><h2>Novo creator</h2><p>Nome, @ e status são suficientes para começar.</p></div><span className="required-note">* campos essenciais</span></div>
      <form action="/api/creators" method="post" className="stack">
        <div className="form-grid compact-grid">
          <Field name="name" label="Nome *" placeholder="Ex.: Ana Souza" required />
          <Field name="handle" label="@ do TikTok *" placeholder="@anasouza" required />
          <SelectStatus />
        </div>
        <details className="optional-box"><summary>Adicionar detalhes opcionais</summary><div className="form-grid optional-grid">
          <Field name="niche" label="Nicho" placeholder="Beleza, fitness..." />
          <Field name="followers" label="Seguidores aproximados" type="number" placeholder="25000" />
          <Field name="profileUrl" label="Link do perfil" type="url" placeholder="https://www.tiktok.com/@..." />
          <Field name="contact" label="Contato" placeholder="E-mail ou telefone" />
          <Field name="contactOrigin" label="Onde encontrou" placeholder="TikTok, indicação..." />
          <div className="field span-2"><label>Observações</label><textarea name="notes" placeholder="Algum detalhe importante sobre a parceria." /></div>
        </div></details>
        <div className="form-actions"><button className="btn btn-primary" type="submit">Cadastrar creator</button></div>
      </form>
    </section>

    <section className="section">
      <div className="section-bar"><div><h2>Creators cadastrados</h2><p>{creators.length} resultado(s)</p></div></div>
      <form className="filter-bar">
        <input name="search" placeholder="Buscar nome, @ ou nicho" defaultValue={q.search} />
        <select name="status" defaultValue={q.status ?? ""}><option value="">Todos os status</option>{Object.entries(creatorStatusLabel).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select>
        <select name="filter" defaultValue={q.filter ?? ""}><option value="">Todos</option><option value="pending">Com conteúdo pendente</option><option value="samples">Com amostras</option><option value="inactive">Sem atividade recente</option></select>
        <button className="btn btn-soft">Filtrar</button>{(q.search || q.status || q.filter) && <a className="btn btn-ghost" href="/creators">Limpar</a>}
      </form>
      <div className="table-wrap"><table className="table"><thead><tr><th>Creator</th><th>Nicho</th><th>Seguidores</th><th>Status</th><th>Atualizado</th></tr></thead><tbody>
        {creators.map((c) => <tr key={c.id}><td><a className="entity-link" href={`/creators/${c.id}`}><strong>{c.name}</strong><span>{c.handle}</span></a></td><td>{c.niche ?? "—"}</td><td>{c.followers?.toLocaleString("pt-BR") ?? "—"}</td><td><form className="inline-form" action={`/api/creators/${c.id}/status`} method="post"><select name="status" defaultValue={c.status}>{Object.entries(creatorStatusLabel).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select><button className="btn btn-mini">Salvar</button></form><span className={`badge tone-${creatorTone(c.status)}`}>{creatorStatusLabel[c.status]}</span></td><td>{c.updatedAt.toLocaleDateString("pt-BR")}</td></tr>)}
      </tbody></table>{creators.length === 0 && <div className="empty-state"><strong>Nenhum creator encontrado</strong><span>Cadastre um creator ou ajuste os filtros.</span></div>}</div>
    </section>
  </>;
}

function Field({ name, label, type = "text", placeholder, required = false }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }) {
  return <div className="field"><label>{label}</label><input name={name} type={type} placeholder={placeholder} required={required} /></div>;
}
function SelectStatus() { return <div className="field"><label>Status *</label><select name="status" defaultValue="FOUND">{Object.entries(creatorStatusLabel).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select></div>; }

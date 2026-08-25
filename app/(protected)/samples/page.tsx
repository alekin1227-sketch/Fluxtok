import { Prisma, SampleStatus } from "@prisma/client";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sampleStatusLabel, sampleTone } from "@/lib/labels";
import { daysSince } from "@/lib/tenant";
import { Notice } from "@/components/notice";

export default async function Samples({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const q = await searchParams;
  const sampleWhere: Prisma.SampleWhereInput = { companyId: user.companyId };
  if (q.status) sampleWhere.status = q.status as SampleStatus;
  if (q.search) sampleWhere.OR = [
    { creator: { is: { name: { contains: q.search } } } },
    { creator: { is: { handle: { contains: q.search } } } },
    { product: { is: { name: { contains: q.search } } } },
  ];

  const [creators, products, campaigns, samples] = await Promise.all([
    prisma.creator.findMany({ where: { companyId: user.companyId, status: { not: "NOT_INTERESTED" } }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: "asc" } }),
    prisma.campaign.findMany({ where: { companyId: user.companyId, status: { in: ["ACTIVE", "DRAFT"] } }, orderBy: { createdAt: "desc" } }),
    prisma.sample.findMany({ where: sampleWhere, include: { creator: true, product: true, campaign: true, contents: true }, orderBy: { updatedAt: "desc" } }),
  ]);

  const canCreate = creators.length > 0 && products.length > 0;

  return <>
    <div className="page-head"><div><div className="eyebrow">OPERAÇÃO PRINCIPAL</div><h1 className="page-title">Amostras</h1><p className="page-subtitle">Registre o envio e acompanhe o que já chegou e o que ainda precisa virar conteúdo.</p></div><a className="btn btn-primary" href="#novo">+ Registrar amostra</a></div>

    {q.created && <Notice>Amostra registrada com sucesso.</Notice>}
    {q.saved && <Notice>Status da amostra atualizado.</Notice>}
    {q.error && <Notice type="error">Não foi possível salvar a amostra. Confira os dados.</Notice>}
    {!canCreate && <Notice type="info">Para registrar uma amostra, cadastre pelo menos um creator e um produto ativo.</Notice>}

    <section className="form-card" id="novo">
      <div className="form-card-head"><div><h2>Registrar amostra</h2><p>Escolha creator, produto e etapa atual. O prazo é calculado automaticamente quando a amostra é recebida.</p></div></div>
      <form className="stack" action="/api/samples" method="post">
        <div className="form-grid compact-grid">
          <Select name="creatorId" label="Creator *" options={creators.map((x) => [x.id, `${x.handle} — ${x.name}`])} />
          <Select name="productId" label="Produto *" options={products.map((x) => [x.id, x.name])} />
          <div className="field"><label>Status *</label><select name="status" defaultValue="PREPARING">{Object.entries(sampleStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <Field name="sentAt" label="Data de envio" type="date" />
          <div className="field"><label>Campanha</label><select name="campaignId"><option value="">Sem campanha</option>{campaigns.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
        </div>
        <details className="optional-box"><summary>Rastreamento, datas e observações</summary><div className="form-grid optional-grid">
          <Field name="trackingCode" label="Código de rastreamento" placeholder="Opcional" />
          <Field name="carrier" label="Transportadora" placeholder="Correios, Jadlog..." />
          <Field name="expectedAt" label="Previsão de entrega" type="date" />
          <Field name="receivedAt" label="Data recebida" type="date" />
          <Field name="contentDueAt" label="Prazo do conteúdo" type="date" />
          <div className="field span-2"><label>Observações</label><textarea name="notes" placeholder="Detalhes do envio ou combinado com o creator." /></div>
        </div></details>
        <div className="form-actions"><button className="btn btn-primary" disabled={!canCreate}>Registrar amostra</button></div>
      </form>
    </section>

    <section className="section">
      <div className="section-bar"><div><h2>Acompanhamento</h2><p>{samples.length} amostra(s)</p></div></div>
      <form className="filter-bar"><input name="search" placeholder="Buscar creator, @ ou produto" defaultValue={q.search} /><select name="status" defaultValue={q.status ?? ""}><option value="">Todos os status</option>{Object.entries(sampleStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><button className="btn btn-soft">Filtrar</button>{(q.search || q.status) && <a className="btn btn-ghost" href="/samples">Limpar</a>}</form>
      <div className="table-wrap"><table className="table"><thead><tr><th>Creator</th><th>Produto / campanha</th><th>Etapa</th><th>Tempo na etapa</th><th>Prazo conteúdo</th></tr></thead><tbody>
        {samples.map((s) => <tr key={s.id}><td><strong>{s.creator.handle}</strong><div className="cell-sub">{s.creator.name}</div></td><td>{s.product.name}<div className="cell-sub">{s.campaign?.name || "Sem campanha"}</div></td><td><form className="inline-form" action={`/api/samples/${s.id}/status`} method="post"><select name="status" defaultValue={s.status}>{Object.entries(sampleStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><button className="btn btn-mini">Salvar</button></form><span className={`badge tone-${sampleTone(s.status)}`}>{sampleStatusLabel[s.status]}</span></td><td>{daysSince(s.statusChangedAt)} dia(s)</td><td>{s.contentDueAt?.toLocaleDateString("pt-BR") ?? "—"}</td></tr>)}
      </tbody></table>{samples.length === 0 && <div className="empty-state"><strong>Nenhuma amostra encontrada</strong><span>Registre o primeiro envio para começar o acompanhamento.</span></div>}</div>
    </section>
  </>;
}

function Field({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) { return <div className="field"><label>{label}</label><input name={name} type={type} placeholder={placeholder} /></div>; }
function Select({ name, label, options }: { name: string; label: string; options: string[][] }) { return <div className="field"><label>{label}</label><select name={name} required><option value="">Selecione</option>{options.map(([v, x]) => <option key={v} value={v}>{x}</option>)}</select></div>; }

import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contentKindLabel } from "@/lib/labels";
import { Notice } from "@/components/notice";
import { tiktokDisplayConfigured } from "@/lib/integrations/tiktok/display";

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
  const displayReady = tiktokDisplayConfigured();

  return <>
    <div className="page-head"><div><div className="eyebrow">PUBLICAÇÕES</div><h1 className="page-title">Conteúdos</h1><p className="page-subtitle">Registre o link e acompanhe os resultados sem misturar com o restante da operação.</p></div><div className="quick-actions">{displayReady && <form action="/api/contents/sync-tiktok-views" method="post"><button className="btn btn-soft">↻ Atualizar views TikTok</button></form>}<a className="btn btn-primary" href="#novo">+ Registrar conteúdo</a></div></div>

    {q.created && <Notice>Conteúdo registrado. A amostra foi marcada como publicada.</Notice>}
    {q.updated && <Notice>Conteúdo atualizado.</Notice>}
    {q.deleted && <Notice>Conteúdo excluído. Se era o único da amostra, ela voltou para aguardando conteúdo.</Notice>}
    {q.tiktokSynced !== undefined && <Notice>{q.tiktokSynced} conteúdo(s) tiveram as visualizações atualizadas pelo TikTok.</Notice>}
    {q.tiktokSkipped && Number(q.tiktokSkipped) > 0 && <Notice type="info">{q.tiktokSkipped} vídeo(s) não foram retornados pela conta TikTok autorizada.</Notice>}
    {q.tiktokError === "not-configured" && <Notice type="info">A Display API ainda não foi configurada no servidor.</Notice>}
    {q.tiktokError === "sync" && <Notice type="error">O TikTok não conseguiu atualizar os vídeos. Confira o token e o scope video.list.</Notice>}
    {q.error && <Notice type="error">Não foi possível concluir. Confira os dados.</Notice>}

    {!displayReady && <section className="integration-ready-strip"><div><b>Views automáticas do TikTok estão preparadas</b><span>Quando você cadastrar a Display API, basta adicionar o token no Railway. Nenhuma mudança de banco é necessária nesta etapa.</span></div><a className="text-link" href="/integrations/tiktok">Ver preparação →</a></section>}

    <details className="form-card create-panel" id="novo" open={Boolean(q.error)}>
      <summary className="create-panel-summary"><span><b>Registrar publicação</b><small>Link e data são suficientes. Resultados podem ser revisados depois.</small></span><span>Adicionar</span></summary>
      <form className="stack create-panel-body" action="/api/contents" method="post">
        <input type="hidden" name="intent" value="create" />
        <div className="form-grid compact-grid">
          <div className="field span-2"><label>Amostra relacionada *</label><select name="sampleId" required><option value="">Selecione a amostra</option>{samples.map((s) => <option key={s.id} value={s.id}>{s.creator.handle} — {s.product.name}</option>)}</select></div>
          <div className="field"><label>Tipo *</label><select name="kind" defaultValue="VIDEO">{Object.entries(contentKindLabel).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select></div>
          <Field name="publishedAt" label="Data de publicação *" type="date" required />
          <div className="field span-2"><label>Link do conteúdo *</label><input name="url" type="url" placeholder="https://www.tiktok.com/..." required /></div>
        </div>
        <details className="optional-box"><summary>Resultados opcionais</summary><div className="form-grid optional-grid">
          <Field name="views" label="Visualizações" type="number" />
          <Field name="sales" label="Vendas" type="number" />
          <Field name="revenue" label="Faturamento (R$)" type="number" step="0.01" />
          <div className="field span-2"><label>Observações</label><textarea name="notes" /></div>
        </div></details>
        <div className="form-actions"><button className="btn btn-primary" disabled={samples.length === 0}>Registrar conteúdo</button>{samples.length === 0 && <span className="helper">Nenhuma amostra está aguardando conteúdo.</span>}</div>
      </form>
    </details>

    <section className="section">
      <div className="section-bar"><div><h2>Publicações</h2><p>{contents.length} conteúdo(s)</p></div></div>
      <div className="simple-record-list">
        {contents.map((c) => <article className="simple-record" key={c.id}>
          <div className="simple-record-main"><div><strong>{c.creator.handle} · {c.product.name}</strong><span>{contentKindLabel[c.kind]} · {c.publishedAt.toLocaleDateString("pt-BR")}</span></div><div className="simple-record-badges"><span className="badge tone-brand">{c.views?.toLocaleString("pt-BR") ?? "—"} views</span>{c.sales !== null && <span className="badge tone-success">{c.sales} venda(s)</span>}</div></div>
          <div className="simple-record-meta"><a className="text-link" target="_blank" rel="noreferrer" href={c.url}>Abrir vídeo →</a>{c.tiktokContentId && <span>TikTok ID detectado</span>}</div>
          <details className="record-actions"><summary>Revisar dados</summary>
            <form className="stack record-edit-form" action="/api/contents" method="post">
              <input type="hidden" name="intent" value="update" /><input type="hidden" name="id" value={c.id} />
              <div className="form-grid compact-grid">
                <div className="field"><label>Tipo</label><select name="kind" defaultValue={c.kind}>{Object.entries(contentKindLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <Field name="publishedAt" label="Publicado em" type="date" defaultValue={dateInput(c.publishedAt)} required />
                <div className="field span-2"><label>Link</label><input name="url" type="url" defaultValue={c.url} required /></div>
                <Field name="views" label="Visualizações" type="number" defaultValue={c.views !== null ? String(c.views) : ""} />
                <Field name="sales" label="Vendas" type="number" defaultValue={c.sales !== null ? String(c.sales) : ""} />
                <Field name="revenue" label="Faturamento (R$)" type="number" step="0.01" defaultValue={c.revenue !== null ? String(c.revenue) : ""} />
                <div className="field span-2"><label>Observações</label><textarea name="notes" defaultValue={c.notes || ""} /></div>
              </div>
              <div className="form-actions"><button className="btn btn-primary">Salvar alterações</button></div>
            </form>
            <form className="danger-zone-inline" action="/api/contents" method="post"><input type="hidden" name="intent" value="delete" /><input type="hidden" name="id" value={c.id} /><div><b>Excluir conteúdo</b><span>Remove este registro de publicação. O histórico da amostra será ajustado automaticamente.</span></div><button className="btn btn-danger-soft">Excluir</button></form>
          </details>
        </article>)}
        {contents.length === 0 && <div className="empty-state"><strong>Nenhum conteúdo registrado</strong><span>Quando um creator publicar, registre o link aqui.</span></div>}
      </div>
    </section>
  </>;
}

function Field({ name, label, type = "text", required = false, step, defaultValue }: { name: string; label: string; type?: string; required?: boolean; step?: string; defaultValue?: string }) { return <div className="field"><label>{label}</label><input name={name} type={type} required={required} step={step} defaultValue={defaultValue} /></div>; }
function dateInput(date: Date) { return date.toISOString().slice(0, 10); }

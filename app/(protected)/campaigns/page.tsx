import { CampaignStatus } from "@prisma/client";
import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Notice } from "@/components/notice";

const statusLabel: Record<CampaignStatus, string> = { DRAFT: "Rascunho", ACTIVE: "Ativa", PAUSED: "Pausada", FINISHED: "Finalizada" };

export default async function Campaigns({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const q = await searchParams;
  const [campaigns, products] = await Promise.all([
    prisma.campaign.findMany({ where: { companyId: user.companyId }, include: { product: true, samples: { include: { contents: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: "asc" } }),
  ]);
  return <>
    <div className="page-head"><div><div className="eyebrow">ORGANIZAÇÃO</div><h1 className="page-title">Campanhas</h1><p className="page-subtitle">Agrupe creators e amostras por lançamento, ação ou produto.</p></div><a className="btn btn-primary" href="#nova">+ Nova campanha</a></div>
    {q.created && <Notice>Campanha criada.</Notice>}
    {q.error && <Notice type="error">Confira os dados da campanha.</Notice>}
    <section className="form-card" id="nova"><div className="form-card-head"><div><h2>Nova campanha</h2><p>Comece pelo nome. Produto, objetivo e datas são opcionais.</p></div></div>
      <form className="stack" action="/api/campaigns" method="post"><div className="form-grid compact-grid">
        <div className="field"><label>Nome *</label><input name="name" placeholder="Ex.: Lançamento Sérum Agosto" required minLength={2} /></div>
        <div className="field"><label>Produto</label><select name="productId"><option value="">Sem produto fixo</option>{products.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="field"><label>Início</label><input name="startsAt" type="date" /></div><div className="field"><label>Fim</label><input name="endsAt" type="date" /></div>
        <div className="field span-2"><label>Objetivo</label><input name="objective" placeholder="Ex.: gerar 20 vídeos para lançamento" /></div>
      </div><div className="form-actions"><button className="btn btn-primary">Criar campanha</button></div></form>
    </section>
    <section className="section"><div className="section-bar"><div><h2>Campanhas</h2><p>{campaigns.length} cadastrada(s)</p></div></div>
      <div className="campaign-grid">{campaigns.map((c)=>{
        const published=c.samples.reduce((n,s)=>n+s.contents.length,0); const pending=c.samples.filter(s=>s.contents.length===0 && (s.status === "RECEIVED" || s.status === "WAITING_CONTENT")).length;
        return <article className="campaign-card" key={c.id}><div className="campaign-card-top"><span className={`badge ${c.status==="ACTIVE"?"tone-success":""}`}>{statusLabel[c.status]}</span><small>{c.product?.name || "Vários produtos"}</small></div><h3>{c.name}</h3>{c.objective&&<p>{c.objective}</p>}<div className="campaign-stats"><span><b>{c.samples.length}</b>Amostras</span><span><b>{published}</b>Conteúdos</span><span><b>{pending}</b>Pendentes</span></div></article>;
      })}{campaigns.length===0&&<div className="empty-state"><strong>Nenhuma campanha</strong><span>Use campanhas quando quiser agrupar uma ação específica.</span></div>}</div>
    </section>
  </>;
}

import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Notice } from "@/components/notice";
import { tiktokDisplayConfigured } from "@/lib/integrations/tiktok/display";

export default async function TikTokIntegration({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const q = await searchParams;
  const connection = await prisma.tikTokConnection.findUnique({ where: { companyId: user.companyId } });
  const shopConfigured = Boolean(process.env.TIKTOK_APP_KEY && process.env.TIKTOK_APP_SECRET && process.env.TIKTOK_SERVICE_ID && process.env.TOKEN_ENCRYPTION_KEY);
  const displayConfigured = tiktokDisplayConfigured();

  return <>
    <div className="page-head"><div><div className="eyebrow">INTEGRAÇÕES</div><h1 className="page-title">TikTok</h1><p className="page-subtitle">Duas integrações separadas: vídeos para métricas e TikTok Shop para produtos/loja.</p></div></div>
    {q.connected && <Notice>TikTok Shop conectado com sucesso.</Notice>}
    {q.synced && <Notice>{q.synced} produto(s) sincronizado(s).</Notice>}
    {q.disconnected && <Notice>Integração desconectada.</Notice>}
    {q.error && <Notice type="error">Não foi possível concluir a operação: {q.error}</Notice>}

    <div className="integration-grid simple-integration-grid">
      <section className="form-card integration-card">
        <div className="integration-logo">▶</div>
        <div><div className="eyebrow">DISPLAY API</div><h2>Visualizações dos vídeos</h2><p className="muted">A estrutura já está pronta para consultar a API oficial e atualizar o campo de views dos conteúdos cadastrados.</p></div>
        <div className="connection-box"><div><small>Status</small><strong>{displayConfigured ? "Pronta para uso" : "Aguardando token"}</strong></div><span className={`badge ${displayConfigured ? "tone-success" : "tone-neutral"}`}>{displayConfigured ? "Configurada" : "Preparada"}</span></div>
        <div className="feature-list compact"><div><b>Sem migration</b><span>Usa os campos que o Fluxtok já possui: link, TikTok ID e visualizações.</span></div><div><b>Atualização manual</b><span>Na tela Conteúdos existe o botão “Atualizar views TikTok”.</span></div><div><b>Limite importante</b><span>A API oficial só retorna vídeos pertencentes à conta TikTok que autorizou o token.</span></div></div>
        <a className="btn btn-soft" href="/contents">Ir para conteúdos</a>
      </section>

      <section className="form-card integration-card">
        <div className="integration-logo">♪</div>
        <div><div className="eyebrow">TIKTOK SHOP</div><h2>Produtos e loja</h2><p className="muted">Integração Seller separada. Você pode ativar quando concluir o cadastro e aprovação no Partner Center.</p></div>
        {!shopConfigured ? <div className="notice notice-warning">As credenciais do TikTok Shop ainda não foram configuradas no servidor.</div> : connection?.status === "CONNECTED" ? <>
          <div className="connection-box"><div><small>Loja conectada</small><strong>{connection.shopName || connection.sellerName || "TikTok Shop"}</strong></div><span className="badge tone-success">Conectada</span></div>
          <div className="button-row"><form action="/api/integrations/tiktok/sync-products" method="post"><button className="btn btn-primary">Sincronizar produtos</button></form><form action="/api/integrations/tiktok/disconnect" method="post"><button className="btn btn-danger-soft">Desconectar</button></form></div>
        </> : <form action="/api/integrations/tiktok/connect" method="post"><button className="btn btn-primary">Conectar TikTok Shop</button></form>}
      </section>
    </div>

    <section className="section"><div className="tip-card"><strong>Como testar as views primeiro</strong><p>Cadastre seu app no TikTok for Developers, obtenha um access token autorizado com o scope <code>video.list</code> e adicione <code>TIKTOK_DISPLAY_ACCESS_TOKEN</code> no Railway. Essa etapa é para teste da conta autorizada; para acompanhar vários creators automaticamente no futuro, cada creator precisará autorizar a aplicação ou você precisará usar uma API oficial apropriada ao caso de uso.</p></div></section>
  </>;
}

import { requireCompanyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Notice } from "@/components/notice";

export default async function TikTokIntegration({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyUser();
  const q = await searchParams;
  const connection = await prisma.tikTokConnection.findUnique({ where: { companyId: user.companyId } });
  const configured = Boolean(process.env.TIKTOK_APP_KEY && process.env.TIKTOK_APP_SECRET && process.env.TIKTOK_SERVICE_ID && process.env.TOKEN_ENCRYPTION_KEY);
  return <>
    <div className="page-head"><div><div className="eyebrow">INTEGRAÇÕES</div><h1 className="page-title">TikTok Shop</h1><p className="page-subtitle">Conecte sua loja pela API oficial para sincronizar produtos automaticamente.</p></div></div>
    {q.connected && <Notice>TikTok Shop conectado com sucesso.</Notice>}
    {q.synced && <Notice>{q.synced} produto(s) sincronizado(s).</Notice>}
    {q.disconnected && <Notice>Integração desconectada.</Notice>}
    {q.error && <Notice type="error">Não foi possível concluir a operação: {q.error}</Notice>}

    <div className="integration-grid">
      <section className="form-card integration-card">
        <div className="integration-logo">♪</div>
        <div><h2>Conexão da loja</h2><p className="muted">OAuth oficial do TikTok Shop. O Fluxtok armazena os tokens criptografados no banco.</p></div>
        {!configured ? <div className="notice notice-warning">O administrador ainda precisa configurar as credenciais do TikTok Shop no servidor.</div> : connection?.status === "CONNECTED" ? <>
          <div className="connection-box"><div><small>Loja conectada</small><strong>{connection.shopName || connection.sellerName || "TikTok Shop"}</strong></div><span className="badge tone-success">Conectada</span></div>
          <div className="info-list"><span><b>Região</b>{connection.sellerBaseRegion || "—"}</span><span><b>Última sincronização</b>{connection.lastSyncAt ? connection.lastSyncAt.toLocaleString("pt-BR") : "Ainda não sincronizado"}</span></div>
          <div className="button-row"><form action="/api/integrations/tiktok/sync-products" method="post"><button className="btn btn-primary">Sincronizar produtos</button></form><form action="/api/integrations/tiktok/disconnect" method="post"><button className="btn btn-danger-soft">Desconectar</button></form></div>
        </> : <form action="/api/integrations/tiktok/connect" method="post"><button className="btn btn-primary btn-lg">Conectar TikTok Shop</button></form>}
      </section>

      <section className="form-card"><div className="form-card-head"><div><h2>O que a V3 já usa</h2><p>Integração pequena e útil, sem transformar o Fluxtok em ERP.</p></div></div>
        <div className="feature-list compact"><div><b>Autorização Seller</b><span>A loja autoriza o Fluxtok sem compartilhar senha.</span></div><div><b>Lojas autorizadas</b><span>Identifica a loja e o shop cipher.</span></div><div><b>Sincronização de produtos</b><span>Importa título, SKU e identificador do produto.</span></div><div><b>Refresh de token</b><span>Renova o acesso quando o token estiver perto de expirar.</span></div></div>
      </section>
    </div>
    <section className="section"><div className="tip-card"><strong>Importante</strong><p>Para conectar lojas reais de clientes, o app precisa ser criado e aprovado no TikTok Shop Partner Center com os scopes necessários. Sem credenciais, o restante do Fluxtok continua funcionando normalmente.</p></div></section>
  </>;
}

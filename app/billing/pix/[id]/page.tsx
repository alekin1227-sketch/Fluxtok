import { notFound } from "next/navigation";
import { requireCompanyIdentity } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Brand } from "@/components/brand";
import { Notice } from "@/components/notice";
import { CopyPixButton } from "@/components/copy-pix-button";

export default async function PixPaymentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCompanyIdentity();
  const { id } = await params;
  const q = await searchParams;
  const payment = await prisma.pixPayment.findFirst({ where: { id, companyId: user.companyId } });
  if (!payment) notFound();

  const approved = payment.status === "approved" || Boolean(payment.approvedAt);
  return <main className="billing-shell">
    <header className="billing-top"><Brand /><a className="btn btn-soft" href="/billing">Voltar</a></header>
    <section className="billing-head"><div className="eyebrow">PAGAMENTO PIX</div><h1>{approved ? "Pagamento confirmado" : "Conclua seu Pix"}</h1><p>R$ {Number(payment.amount).toFixed(2).replace(".", ",")} · {payment.plan === "PRO" ? "Pro" : "Essencial"}</p></section>
    {q.synced && <Notice>Status consultado diretamente no Mercado Pago.</Notice>}
    {q.error === "sync" && <Notice type="error">Não foi possível consultar o pagamento agora. Tente novamente.</Notice>}
    {approved ? <section className="pix-card pix-success"><div className="pix-success-icon">✓</div><h2>Pix aprovado</h2><p>Seu acesso foi liberado por 30 dias. Se você ainda tinha dias válidos, eles foram preservados.</p><a className="btn btn-primary btn-lg" href="/dashboard">Ir para o dashboard</a></section> : <section className="pix-card">
      {payment.qrCodeBase64 && <img className="pix-qr" src={`data:image/png;base64,${payment.qrCodeBase64}`} alt="QR Code Pix" />}
      {payment.qrCode && <><h2>Pix Copia e Cola</h2><textarea className="pix-code" readOnly rows={5} value={payment.qrCode} /><CopyPixButton value={payment.qrCode} /></>}
      {payment.ticketUrl && <a className="btn btn-soft" target="_blank" rel="noreferrer" href={payment.ticketUrl}>Abrir pagamento no Mercado Pago</a>}
      <p className="muted">Depois de pagar, o Mercado Pago envia a confirmação automaticamente. Você também pode conferir manualmente.</p>
      <form action={`/api/billing/pix/${payment.id}/sync`} method="post"><button className="btn btn-soft" type="submit">Já paguei · verificar agora</button></form>
      {payment.expiresAt && <small className="muted">Este código pode expirar em {payment.expiresAt.toLocaleString("pt-BR")}.</small>}
    </section>}
  </main>;
}

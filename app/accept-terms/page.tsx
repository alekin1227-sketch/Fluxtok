import { requireCompanyIdentityBase } from "@/lib/auth";
import { LEGAL_VERSION, hasCurrentRequiredAcceptances } from "@/lib/legal";
import { redirect } from "next/navigation";

export default async function AcceptTermsPage() {
  const user = await requireCompanyIdentityBase();
  if (await hasCurrentRequiredAcceptances(user.id)) redirect("/dashboard");

  return <main className="auth-shell">
    <section className="auth-card legal-gate-card">
      <div className="eyebrow">ATUALIZAÇÃO DE TERMOS</div>
      <h1>Antes de continuar</h1>
      <p className="muted">Para manter o uso do Fluxtok claro e registrado, confirme os termos atuais. Seus dados não são apagados por esta atualização.</p>
      <div className="legal-summary">
        <div><strong>Teste e assinatura</strong><span>O teste padrão é de 7 dias. Cobrança recorrente só começa quando você escolhe e confirma um plano pago.</span></div>
        <div><strong>Dados de creators</strong><span>Sua empresa é responsável por cadastrar e utilizar dados de creators de forma lícita e adequada.</span></div>
        <div><strong>Integrações externas</strong><span>TikTok Shop e Mercado Pago dependem dos próprios serviços, permissões e disponibilidade deles.</span></div>
        <div><strong>Sem promessa de resultado</strong><span>FluxRadar e FluxScore ajudam na organização e decisão, mas não garantem vendas, publicação ou performance.</span></div>
      </div>
      <form action="/api/auth/accept-terms" method="post" className="stack">
        <label className="consent-row"><input type="checkbox" name="terms" value="yes" required/><span>Li e aceito os <a href="/termos" target="_blank"><u>Termos de Uso</u></a> e a <a href="/privacidade" target="_blank"><u>Política de Privacidade</u></a>.</span></label>
        <label className="consent-row"><input type="checkbox" name="trialConsent" value="yes" required/><span>Entendi as regras do teste gratuito e que eventual assinatura paga é recorrente até cancelamento, conforme o plano contratado.</span></label>
        <label className="consent-row"><input type="checkbox" name="dataConsent" value="yes" required/><span>Confirmo que minha empresa é responsável pelos dados de creators e contatos inseridos no Fluxtok.</span></label>
        <button className="btn btn-primary btn-block">Confirmar e continuar</button>
      </form>
      <small className="muted">Versão dos termos: {LEGAL_VERSION}</small>
    </section>
  </main>;
}

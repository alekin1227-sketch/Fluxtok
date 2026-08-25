import { Brand } from "@/components/brand";

export default function TermsPage() {
  return <main className="legal-shell container">
    <header className="billing-top"><Brand /><a className="btn btn-soft" href="/">Voltar</a></header>
    <article className="legal-card">
      <div className="eyebrow">DOCUMENTO BASE</div><h1>Termos de uso</h1>
      <p className="muted">Modelo inicial para lançamento do Fluxtok. Antes da operação comercial definitiva, revise este texto com assessoria jurídica e preencha os dados do responsável pela plataforma.</p>
      <h2>1. Serviço</h2><p>O Fluxtok é uma plataforma para organização de creators, campanhas, amostras, conteúdos e integrações de comércio social. O serviço não substitui as plataformas de terceiros integradas.</p>
      <h2>2. Conta</h2><p>O usuário é responsável por manter seus dados de acesso protegidos e por fornecer informações corretas durante o cadastro.</p>
      <h2>3. Teste e assinatura</h2><p>Novas empresas podem receber 7 dias de teste gratuito. Após o período, o acesso a recursos protegidos pode ser limitado até a contratação de um plano. Os dados não são apagados automaticamente com a expiração do teste.</p>
      <h2>4. Integrações</h2><p>Recursos de TikTok Shop e pagamentos dependem da disponibilidade, autorização e regras dos respectivos provedores. O Fluxtok não é afiliado nem endossado pelo TikTok.</p>
      <h2>5. Uso adequado</h2><p>É proibido utilizar a plataforma para fraude, acesso não autorizado, violação de direitos de terceiros ou outras atividades ilícitas.</p>
      <h2>6. Contato e identificação</h2><p><strong>Preencher antes do lançamento:</strong> responsável/empresa, CNPJ ou CPF quando aplicável, endereço de contato e e-mail de suporte.</p>
    </article>
  </main>;
}

import { Brand } from "@/components/brand";

export default function PrivacyPage() {
  return <main className="legal-shell container">
    <header className="billing-top"><Brand /><a className="btn btn-soft" href="/">Voltar</a></header>
    <article className="legal-card">
      <div className="eyebrow">DOCUMENTO BASE</div><h1>Política de privacidade</h1>
      <p className="muted">Modelo inicial de transparência para a V3. Deve ser revisado e completado antes do lançamento comercial, especialmente para adequação à LGPD.</p>
      <h2>Dados tratados</h2><p>O Fluxtok pode tratar dados de cadastro, informações da empresa, creators cadastrados pelo cliente, registros operacionais, dados técnicos de sessão e dados recebidos por integrações autorizadas.</p>
      <h2>Finalidades</h2><p>Os dados são usados para autenticação, prestação do serviço, segurança, suporte, cobrança, auditoria e execução das integrações solicitadas pelo cliente.</p>
      <h2>Credenciais e tokens</h2><p>Senhas são armazenadas com hash. Tokens sensíveis de integrações devem ser armazenados de forma criptografada e secrets permanecem em variáveis de ambiente do servidor.</p>
      <h2>Compartilhamento</h2><p>Dados podem ser transmitidos aos provedores necessários para funcionalidades ativadas pelo cliente, como hospedagem, TikTok Shop e processador de pagamentos.</p>
      <h2>Retenção e direitos</h2><p>Defina antes do lançamento os prazos de retenção, canal de atendimento ao titular e procedimento para solicitações de acesso, correção e eliminação, conforme a legislação aplicável.</p>
      <h2>Controlador</h2><p><strong>Preencher antes do lançamento:</strong> nome do responsável, documento, contato de privacidade e demais dados exigidos para sua operação.</p>
    </article>
  </main>;
}

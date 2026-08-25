import { Brand } from "@/components/brand";

export default function PrivacyPage() {
  return <main className="legal-shell container">
    <header className="billing-top"><Brand /><a className="btn btn-soft" href="/">Voltar</a></header>
    <article className="legal-card">
      <div className="eyebrow">VERSÃO 25/08/2026</div><h1>Política de privacidade</h1>
      <p className="muted">Base de transparência para o lançamento do Fluxtok. Antes da operação comercial em escala, revise o documento conforme sua estrutura jurídica, fornecedores e fluxos efetivamente utilizados.</p>
      <h2>1. Dados tratados</h2><p>Podemos tratar nome, e-mail, empresa, credenciais protegidas por hash, dados de sessão, configurações, registros de uso, chamados de suporte, informações operacionais cadastradas pelo cliente e dados recebidos por integrações autorizadas.</p>
      <h2>2. Dados de creators cadastrados pelo cliente</h2><p>O cliente pode registrar nomes, perfis públicos, contatos e informações de colaboração de creators. Nessa hipótese, o cliente é responsável pela legitimidade da coleta e do uso desses dados. O Fluxtok atua como ferramenta tecnológica para executar as instruções do cliente.</p>
      <h2>3. Finalidades</h2><p>Os dados são usados para autenticação, prestação do serviço, isolamento multiempresa, suporte, cobrança, prevenção de abuso, auditoria, recuperação de conta, integração com serviços autorizados e melhoria operacional do produto.</p>
      <h2>4. Registro de consentimentos e segurança</h2><p>O Fluxtok registra a versão dos documentos aceitos, data/hora, agente do navegador e um hash do endereço IP para ajudar a demonstrar a confirmação dos termos sem manter o IP bruto para essa finalidade.</p>
      <h2>5. Credenciais e tokens</h2><p>Senhas são armazenadas com hash. Tokens sensíveis de integrações são criptografados quando previsto pela aplicação. Segredos de infraestrutura e pagamento devem permanecer exclusivamente em variáveis de ambiente do servidor.</p>
      <h2>6. Compartilhamento com fornecedores</h2><p>Dados podem ser processados por provedores necessários ao funcionamento do serviço, como hospedagem, banco de dados, e-mail, TikTok Shop e Mercado Pago, sempre de acordo com as funcionalidades utilizadas pelo cliente.</p>
      <h2>7. Transferências internacionais</h2><p>Alguns provedores de infraestrutura podem operar datacenters fora do Brasil. Antes do lançamento definitivo, mantenha atualizada a lista real de fornecedores e as medidas adotadas para transferências internacionais quando aplicável.</p>
      <h2>8. Retenção</h2><p>Dados são mantidos pelo período necessário para prestar o serviço, cumprir obrigações legais, resolver disputas, prevenir fraude e permitir recuperação após expiração ou cancelamento. Defina e publique prazos específicos antes da operação em escala.</p>
      <h2>9. Direitos dos titulares</h2><p>Solicitações relacionadas a acesso, correção, informação, portabilidade ou eliminação devem ser encaminhadas ao canal de privacidade informado abaixo e serão analisadas conforme a legislação aplicável.</p>
      <h2>10. Segurança</h2><p>O Fluxtok utiliza isolamento por empresa no backend, cookies HttpOnly, validações no servidor, rate limiting de login, proteção de secrets e registros de auditoria. Nenhum sistema é totalmente imune a incidentes; em caso de evento relevante serão adotadas as medidas cabíveis.</p>
      <h2>11. Contato do controlador</h2><p><strong>Preencher antes do lançamento:</strong> responsável/empresa, CPF ou CNPJ quando aplicável, e-mail de privacidade, e-mail de suporte e localização do responsável.</p>
    </article>
  </main>;
}

# Fluxtok V4.6

- troca de plano transacional: plano vigente permanece até confirmação do Mercado Pago;
- estado pendente separado (`pendingPlan`, `pendingExternalSubscriptionId`);
- correção do retorno indevido para trial ao trocar de plano;
- proteção contra `NaN` nos preços;
- autorreparo para o bug legado em acesso Pix pago;
- Superadmin mostra trocas pendentes.

# Fluxtok v4.4 — E-mail de pagamento independente

- Checkout de cartão permite informar e-mail de pagamento diferente do e-mail de login.
- Pix permite informar e-mail de pagamento diferente do e-mail de login.
- Se não houver alteração, o e-mail da conta continua como padrão.
- O e-mail de pagamento não altera autenticação nem cadastro do Fluxtok.
- Validação de e-mail no backend com Zod.
- Modo sandbox de Assinaturas continua usando `MERCADOPAGO_TEST_PAYER_EMAIL` para evitar mistura de usuários teste/produção.
- Termos atualizados para explicar a separação entre e-mail de acesso e e-mail de pagamento.
- Nenhuma migration de banco é necessária nesta atualização.

# Fluxtok v4

## Diferencial
- FluxRadar: lista automática de próximas ações no dashboard.
- FluxScore: indicador transparente de consistência por creator.
- checklist de primeiros passos no dashboard para reduzir curva de aprendizado.

## Suporte
- nova aba Suporte para clientes;
- chamados e mensagens armazenados por empresa;
- caixa de entrada no Superadmin;
- resposta do Superadmin dentro do SaaS;
- status do chamado;
- e-mail público de suporte configurável;
- e-mail de notificações configurável;
- envio opcional de notificações por SMTP.

## Superadmin
- nova visão geral com empresas, testes ativos, testes vencendo, assinantes, MRR estimado, chamados e TikTok conectado;
- página de empresas mais visual;
- +1, +3, +7, +14, +30 dias ou quantidade personalizada de trial;
- ativar/desativar conta;
- página de configurações da plataforma.

## Mercado Pago
- planos mantidos em R$49,90 e R$79,90;
- confirmação explícita da recorrência antes do checkout;
- registro do aceite de cobrança;
- botão “Atualizar status agora” para conciliação manual com `/preapproval/{id}`;
- webhook continua consultando o objeto remoto antes de atualizar a assinatura.

## Legal e privacidade
- três confirmações obrigatórias no cadastro;
- aceite de termos/privacidade;
- ciência dos 7 dias grátis e bloqueio após expiração;
- confirmação de responsabilidade sobre dados de creators;
- aceite específico de cobrança recorrente;
- registro de versão, horário, user-agent e hash do IP;
- Termos de Uso e Política de Privacidade ampliados.

## Banco
- migration incremental `20260825040000_fluxtok_v4`;
- novas tabelas: `platform_settings`, `support_tickets`, `support_messages`, `legal_acceptances`;
- nenhuma tabela da operação principal é apagada.

## Segurança operacional do deploy
- `npm run preflight` antes do build;
- bloqueio automático de marcadores de conflito Git;
- bloqueio de `.env` real na raiz e referências conhecidas a localhost de deploy anterior;
- verificação de arquivos essenciais e migration V4 não destrutiva.

## Aceite para contas antigas
- usuários existentes sem aceite da versão jurídica atual passam por `/accept-terms` uma única vez;
- contas criadas manualmente pelo Superadmin também precisam confirmar os termos antes de usar o sistema;
- futura mudança de `LEGAL_VERSION` permite solicitar novo aceite sem recriar contas.

## Configuração de e-mail
- botão de teste de SMTP/e-mail diretamente em Superadmin → Configurações.

## 0.4.3 — Pix Mercado Pago
- Pix avulso de 30 dias nos planos Essencial e Pro.
- QR Code, Copia e Cola e verificação manual.
- Webhook de pagamentos com validação e ativação idempotente.
- Nova tabela `pix_payments`.
- Expiração automática de acesso pago via Pix.
- Proteção contra troca para Pix com assinatura recorrente ativa.
- Termos atualizados para cartão recorrente vs Pix avulso.

## 0.4.5 — Superadmin+ e assinatura sem “trial fantasma”
- período gratuito deixa de aparecer para empresas com assinatura paga ativa;
- ao ativar cartão ou Pix, `trialEndsAt` é encerrado imediatamente;
- Pix pago passa a liberar 30 dias a partir da confirmação, sem somar dias gratuitos restantes;
- renovação Pix antecipada continua preservando somente período pago ainda válido;
- Superadmin ganhou área de Pagamentos com MRR de cartão separado de receita Pix;
- Superadmin ganhou Auditoria com os últimos eventos importantes;
- visão geral ganhou indicadores de Pix, receita de 30 dias, contas desativadas e alertas operacionais;
- Empresas ganhou busca e filtros por status, plano e conta desativada;
- empresas pagas não exibem controles de extensão de teste;
- backend bloqueia tentativa de adicionar trial a assinatura paga ativa;
- Configurações do cliente mostra somente informações coerentes com o estado atual: teste OU plano pago.

## v4.7 — Simple Ops + TikTok Views Ready

- Dashboard simplificado para quatro indicadores principais e FluxRadar como foco.
- Menu principal reduzido; cadastros e ajustes ficam recolhidos.
- Produtos agora podem ser editados, desativados ou excluídos quando não possuem histórico.
- Creators agora podem ser revisados/alterados e removidos quando não possuem histórico; com histórico, são finalizados para preservar relações.
- Conteúdos agora podem ser revisados, alterados e excluídos; ao apagar o único conteúdo de uma amostra, a amostra volta para aguardando conteúdo.
- Integração opcional com TikTok Display API preparada sem migration, reutilizando `contents.tiktokContentId` e `contents.views`.
- Botão para atualizar views do TikTok em lotes de até 20 vídeos.
- Nenhuma alteração em `prisma/schema.prisma` e nenhuma migration nova.

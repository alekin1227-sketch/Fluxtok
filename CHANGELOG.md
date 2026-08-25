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

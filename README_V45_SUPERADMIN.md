# Fluxtok v4.5 — Superadmin+ / Trial cleanup

Atualização incremental para o mesmo repositório.

## O que muda

- Assinou e ficou ACTIVE: o período gratuito deixa de aparecer no cliente e no Superadmin.
- `trialEndsAt` é encerrado na confirmação de cartão/Pix e também em sincronização manual.
- Pix pago começa no momento da confirmação; dias gratuitos restantes não são somados ao período pago.
- Superadmin: Pagamentos, Auditoria, filtros de empresas, métricas de cartão/Pix e alertas operacionais.
- Não há nova migration nem alteração destrutiva no TiDB.

## Atualização

1. Copie os arquivos deste pacote sobre a raiz do Fluxtok atual.
2. GitHub Desktop: Commit to main.
3. Push origin.
4. Railway fará o novo deploy.
5. Teste uma conta TRIALING e uma ACTIVE para confirmar que apenas a primeira mostra informações de teste.

## Banco

Nenhuma migration nova é necessária nesta versão.

# Fluxtok V4.6 — Troca de plano segura

Esta atualização corrige o fluxo de mudança entre Essencial e Pro.

## Regra nova

Abrir um checkout NÃO altera o plano, status ou período já pago.

Exemplo:

`Essencial ACTIVE -> inicia checkout Pro -> continua Essencial ACTIVE -> Mercado Pago confirma -> vira Pro ACTIVE`

Se o cliente abandonar/cancelar o checkout, o Essencial continua ativo.

## Correções

- não volta para 7 dias grátis ao iniciar uma troca;
- o plano atual só muda depois de `authorized` no Mercado Pago;
- preço inválido em variável de ambiente não gera mais `NaN` na tela: usa fallback seguro R$49,90/R$79,90;
- troca pendente fica separada do benefício atual;
- botão para cancelar troca pendente;
- sincronização manual consulta primeiro a troca pendente sem derrubar a assinatura vigente;
- ao trocar entre assinaturas recorrentes, a assinatura anterior só é cancelada depois que a nova é autorizada;
- autorreparo do bug legado para contas com Pix pago vigente que foram indevidamente colocadas em TRIALING por uma tentativa de troca;
- Superadmin mostra quantidade de trocas de plano pendentes e o destino da troca.

## Banco

A migration `20260825210000_safe_plan_changes` apenas adiciona campos opcionais na tabela `subscriptions`. Não remove dados.

O `npm start` aplica a migration automaticamente no Railway.

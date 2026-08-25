# Fluxtok V4.3 — Pix Mercado Pago

Esta versão mantém o cartão recorrente e adiciona **Pix avulso de 30 dias**.

## Como funciona

- Cartão: assinatura mensal automática pelo endpoint de Assinaturas do Mercado Pago.
- Pix: pagamento único por `/v1/payments` com `payment_method_id=pix`.
- Quando o Pix fica `approved`, o Fluxtok libera 30 dias.
- Se a empresa ainda tiver dias válidos de trial/Pix, os 30 dias são somados depois do período já existente.
- Webhooks repetidos não somam 30 dias novamente: a aprovação é idempotente no banco.

## 1. Mercado Pago

Use sua aplicação **real/de produção**.

Confirme que sua conta Mercado Pago possui Pix habilitado/chave Pix cadastrada.

Em **Suas integrações > Fluxtok > Webhooks**, configure a URL de produção:

```text
https://SEU-DOMINIO.up.railway.app/api/webhooks/mercadopago
```

Habilite pelo menos o evento **Pagamentos**. Mantenha os eventos de Assinaturas que já usa para o cartão.

Copie a assinatura secreta do Webhook.

## 2. Railway

Em `Fluxtok > Variables`:

```text
MERCADOPAGO_MODE=production
MERCADOPAGO_ACCESS_TOKEN=<ACCESS TOKEN DE PRODUÇÃO>
MERCADOPAGO_WEBHOOK_SECRET=<ASSINATURA SECRETA DO WEBHOOK>
FLUXTOK_STARTER_PRICE=49.90
FLUXTOK_PRO_PRICE=79.90
```

Pix e cartão usam o mesmo `MERCADOPAGO_ACCESS_TOKEN`.

## 3. Teste real de R$ 1

Se quiser validar primeiro com valor baixo, temporariamente use:

```text
FLUXTOK_STARTER_PRICE=1.00
FLUXTOK_PRO_PRICE=79.90
```

Faça redeploy. No Fluxtok, escolha Essencial > **Pagar com Pix**.

Depois do teste, volte imediatamente para:

```text
FLUXTOK_STARTER_PRICE=49.90
FLUXTOK_PRO_PRICE=79.90
```

Faça outro redeploy.

A cobrança Pix já criada por R$ 1 não muda quando a variável é restaurada.

## 4. Webhook e fallback

Quando o Mercado Pago confirmar o pagamento, o Webhook muda o Pix para `approved` e ativa a empresa.

Se o Webhook demorar ou ainda não estiver configurado, a página do Pix possui o botão **Já paguei · verificar agora**, que consulta diretamente a API do Mercado Pago.

## 5. Segurança

- `X-Idempotency-Key` único em toda criação Pix.
- Acesso só é liberado após consultar o pagamento oficial no Mercado Pago.
- Valor, método (`pix`), ID externo e referência local são conferidos.
- Webhooks repetidos não duplicam o período pago.
- CPF/CNPJ enviado para criar o Pix não é salvo; o banco guarda apenas evidências do aceite (versão, hash de IP, user-agent e data/hora).
- Access Token e segredo de Webhook ficam somente no Railway.

## 6. Banco

A migration `20260825170000_fluxtok_v43_pix` cria apenas a tabela `pix_payments` e relações com `companies` e `users`.

O `npm start` atual do Fluxtok executa `prisma migrate deploy` automaticamente no Railway. Não apague nem recrie seu TiDB.

## 7. Atenção para assinatura de cartão já ativa

O Fluxtok bloqueia a geração de Pix quando a empresa já possui assinatura recorrente ativa no cartão. Isso evita cobrança dupla. Cancele a assinatura recorrente antes de trocar o cliente para Pix.


## E-mail de pagamento diferente do login

A V4.4 permite que o cliente informe um e-mail de pagamento diferente do e-mail usado para entrar no Fluxtok. O campo aparece no checkout de Cartão e Pix.

- se o cliente mantiver o e-mail sugerido, o sistema usa o e-mail da conta Fluxtok;
- se trocar o campo, o Mercado Pago recebe o novo e-mail como e-mail do pagador;
- o e-mail de login do Fluxtok não é alterado;
- no modo de teste de Assinaturas, `MERCADOPAGO_TEST_PAYER_EMAIL` continua prevalecendo para manter comprador e vendedor no mesmo ambiente de teste.

Em produção, não existe exigência do Fluxtok de que o e-mail do pagamento seja igual ao e-mail de cadastro. O e-mail informado deve ser válido e usado legitimamente pelo pagador.

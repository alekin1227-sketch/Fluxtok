# Mercado Pago Assinaturas — Fluxtok

A V3 cria assinaturas recorrentes pela API `/preapproval`.

## Variáveis

- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `FLUXTOK_STARTER_PRICE=49.90`
- `FLUXTOK_PRO_PRICE=79.90`

## Webhook

Cadastre no painel do Mercado Pago:

`https://SEU-DOMINIO/api/webhooks/mercadopago`

Ative eventos de assinaturas/preapproval relevantes. A rota valida `x-signature` com HMAC quando a chave de webhook está configurada e consulta a assinatura diretamente na API antes de atualizar a empresa.

## Teste grátis

O teste de 7 dias é controlado pelo próprio Fluxtok. O usuário pode criar a conta sem cartão. Ao assinar, o checkout é redirecionado para o Mercado Pago e o Fluxtok não armazena o cartão.

## Cancelamento

O administrador da empresa pode cancelar uma assinatura ativa pela tela **Plano e assinatura**. O backend envia a atualização ao recurso `preapproval` no Mercado Pago e mantém os dados da empresa no Fluxtok.

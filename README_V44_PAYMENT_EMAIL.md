# Fluxtok V4.4 — Payment Email

Atualização incremental para o mesmo repositório do Fluxtok.

## O que muda

O comprador pode usar no Mercado Pago um e-mail diferente do e-mail de cadastro/login do Fluxtok. Isso vale para Cartão e Pix.

O campo vem preenchido com o e-mail da conta por conveniência, mas pode ser alterado antes do pagamento. A troca não modifica o login do usuário.

## Instalação

1. Extraia este ZIP.
2. Copie tudo desta pasta para a raiz do repositório Fluxtok atual.
3. Aceite substituir os arquivos existentes.
4. GitHub Desktop: `Commit to main`.
5. `Push origin`.
6. Railway fará o novo deploy.

Não há migration nova nesta V4.4. O TiDB não precisa ser alterado.

## Produção

Use:

```text
MERCADOPAGO_MODE=production
MERCADOPAGO_ACCESS_TOKEN=<TOKEN DE PRODUCAO>
MERCADOPAGO_WEBHOOK_SECRET=<SEGREDO DO WEBHOOK>
FLUXTOK_STARTER_PRICE=49.90
FLUXTOK_PRO_PRICE=79.90
```

Para um teste real controlado, você pode reduzir temporariamente apenas um preço e restaurá-lo logo depois do teste.

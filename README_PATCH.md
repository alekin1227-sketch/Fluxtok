# Fluxtok V4.2 — Mercado Pago SiteFix

Patch incremental para o mesmo repositório. Não altera banco nem migrations.

## Erro corrigido/diagnosticado

`Payer is associated with a different site`

Esse erro é do Mercado Pago e indica que o pagador e o vendedor estão associados a sites/países diferentes (por exemplo, MLB Brasil vs MLA Argentina).

A V4.1 usava `test@testuser.com` como fallback. Para Assinaturas isso pode apontar para um usuário de teste de outro site. A V4.2 remove esse fallback e exige o e-mail EXATO do Comprador de teste configurado em `MERCADOPAGO_TEST_PAYER_EMAIL`.

## Fluxo correto de teste de Assinaturas (status pending)

1. Na sua aplicação/conta principal, crie duas contas de teste: Vendedor e Comprador.
2. As duas devem ser criadas com país Brasil (site MLB).
3. Abra janela anônima e entre com a conta Vendedor de teste.
4. Logado como Vendedor de teste, abra Mercado Pago Developers e crie uma nova aplicação de teste para o Fluxtok.
5. Nessa aplicação criada dentro do Vendedor de teste, abra Credenciais de PRODUÇÃO e copie o Access Token.
6. No Railway, use esse token em `MERCADOPAGO_ACCESS_TOKEN`.
7. Configure `MERCADOPAGO_TEST_PAYER_EMAIL` com o e-mail EXATO da conta Comprador de teste Brasil.
8. Mantenha `MERCADOPAGO_MODE=test`.
9. Faça redeploy.
10. Em outra janela anônima, entre no checkout usando a conta Comprador de teste e cartão de teste.

## Railway

```text
MERCADOPAGO_MODE=test
MERCADOPAGO_ACCESS_TOKEN=<TOKEN DE PRODUÇÃO DA APLICAÇÃO DO VENDEDOR DE TESTE>
MERCADOPAGO_TEST_PAYER_EMAIL=<EMAIL EXATO DO COMPRADOR DE TESTE BRASIL>
FLUXTOK_STARTER_PRICE=49.90
FLUXTOK_PRO_PRICE=79.90
```

Não use o Access Token real da sua conta principal neste teste. Não use `test@testuser.com` como valor genérico.

## metadataBase

O patch também define `metadataBase` a partir de `APP_URL`, eliminando o aviso do Next.js em produção quando `APP_URL` está configurado corretamente no Railway.

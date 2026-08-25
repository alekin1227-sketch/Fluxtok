# TikTok Shop API — Fluxtok

A V3 possui integração de backend com a API oficial TikTok Shop.

## O que já está implementado

- Seller OAuth;
- validação de `state`;
- troca do auth code por access/refresh token;
- tokens criptografados no banco;
- Get Authorized Shops;
- assinatura HMAC-SHA256 das chamadas Open API;
- refresh de access token;
- Search Products versão 202502;
- importação/atualização de produtos no Fluxtok.

## Partner Center

Crie um app adequado para atender sellers. Para um SaaS que atende múltiplos lojistas, normalmente isso significa um app público/ISV, sujeito à análise e aos scopes liberados pelo TikTok Shop.

Você precisará do App Key, App Secret e Service ID.

Configure Redirect URL:

`https://SEU-DOMINIO/api/integrations/tiktok/callback`

Scopes mínimos para a sincronização atual incluem acesso básico de produtos da loja (`seller.product.basic`) e os scopes de autorização necessários para o seu app.

## Variáveis

`TIKTOK_APP_KEY`

`TIKTOK_APP_SECRET`

`TIKTOK_SERVICE_ID`

`TIKTOK_MARKET=ROW` (use `US` para autorização de seller dos EUA)

`TOKEN_ENCRYPTION_KEY`

## Limitação importante

O código está funcional, mas nenhuma integração com loja real funciona até o seu aplicativo receber credenciais e permissões válidas do TikTok Shop Partner Center. Não use scraping como substituto.

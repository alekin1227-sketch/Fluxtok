# Fluxtok v4.7 — TikTok Display API (views)

Esta integração é opcional e NÃO altera o banco de dados.

## O que ela faz

O Fluxtok usa a API oficial TikTok Display API para consultar vídeos pelo ID e atualizar o campo `views` já existente em `contents`.

Endpoint preparado:

`POST https://open.tiktokapis.com/v2/video/query/`

Campos solicitados:

`id,title,view_count,like_count,comment_count,share_count,share_url`

Nesta versão o Fluxtok persiste apenas `view_count`, porque o schema atual já possui `contents.views` e a exigência da v4.7 é não criar migration.

## Importante

A Display API usa o scope `video.list` e o endpoint `video/query` só retorna vídeos que pertencem ao usuário TikTok que autorizou o access token.

Portanto:

- serve para testar a integração oficial com uma conta autorizada;
- não é uma API pública para consultar views de qualquer creator;
- para vários creators, cada creator precisará autorizar o Fluxtok em uma versão futura ou será necessário outro produto oficial do TikTok adequado ao caso de uso;
- a Research API não deve ser tratada como uma API comercial aberta para esse SaaS.

## Railway

Adicione:

```text
TIKTOK_DISPLAY_ACCESS_TOKEN=SEU_ACCESS_TOKEN_AUTORIZADO
```

Não grave o token no GitHub.

Depois faça redeploy e abra:

`Conteúdos → Atualizar views TikTok`

O Fluxtok extrai automaticamente o ID de URLs no formato:

`https://www.tiktok.com/@usuario/video/1234567890123456789`

O endpoint oficial aceita até 20 IDs por requisição. O Fluxtok já divide os vídeos em lotes de 20.

## Futuro

Quando for implementar OAuth por creator, será necessária persistência separada de tokens/refresh tokens e scopes por creator. Isso exigirá uma migration futura e não faz parte da v4.7.

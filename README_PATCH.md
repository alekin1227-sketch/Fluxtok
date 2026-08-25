# Fluxtok v4.7 — UPDATE ONLY

Copie tudo desta pasta para a raiz do Fluxtok v4.6 e aceite substituir arquivos.

Depois faça Commit + Push no mesmo repositório. Railway fará o deploy.

## Banco

Nenhuma migration nova. `prisma/schema.prisma` não foi alterado.

## Novidades

- dashboard e menu mais simples;
- editar/excluir/desativar produtos;
- editar/excluir/finalizar creators;
- revisar/excluir conteúdos;
- preparação da TikTok Display API para atualizar views usando os campos existentes.

## TikTok views (opcional)

Depois de cadastrar/aprovar a aplicação no TikTok for Developers, configure no Railway:

`TIKTOK_DISPLAY_ACCESS_TOKEN=...`

O token deve ter autorização para o scope `video.list`.

Atenção: a Display API retorna vídeos pertencentes à conta que autorizou o token; não consulta métricas de creators arbitrários sem autorização.

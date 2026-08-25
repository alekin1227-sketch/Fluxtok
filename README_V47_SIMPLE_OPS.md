# Fluxtok v4.7 — Simple Ops

Atualização focada em simplicidade de uso e revisão dos dados existentes.

## O que muda

- Início com menos informação: 4 métricas + FluxRadar.
- Menu com 5 áreas principais; opções administrativas ficam em “Cadastros e ajustes”.
- Edição/exclusão segura de produtos.
- Edição/finalização segura de creators.
- Edição/exclusão de conteúdos.
- Preparação da TikTok Display API para atualizar views sem alterar o banco.

## Banco de dados

Nenhuma migration foi adicionada.

A v4.7 reutiliza campos já existentes:

- `products.active`
- `creators.status`
- `contents.tiktokContentId`
- `contents.views`

## Compatibilidade

A atualização foi feita por cima da v4.6 e preserva Mercado Pago, Pix, Superadmin, suporte, TikTok Shop e dados atuais.

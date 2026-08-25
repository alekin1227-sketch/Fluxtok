# Fluxtok v4.4.1 — Build Fix

Correção incremental para o erro TypeScript em `lib/pix.ts`:

`Property 'toISOString' does not exist on type 'never'`.

## Como aplicar

1. Extraia este ZIP.
2. Copie a pasta `lib` para a raiz do repositório Fluxtok atual.
3. Aceite substituir `lib/pix.ts`.
4. No GitHub Desktop, faça commit e push.
5. O Railway fará novo deploy.

Sugestão de commit:

`Fix Pix period end TypeScript build`

## O que mudou

O resultado da transação Prisma agora retorna explicitamente `activated` e `periodEnd`, em vez de alterar variáveis externas dentro do callback. Isso permite que o TypeScript reconheça corretamente `periodEnd` como `Date | null`.

Nenhuma migration nova. Nenhuma alteração no TiDB. Nenhuma alteração de preço ou credenciais.

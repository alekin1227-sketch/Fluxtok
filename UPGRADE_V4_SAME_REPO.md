# Atualizar Fluxtok V3 → V4 no MESMO repositório

Você não precisa criar outro GitHub, outro Railway ou outro TiDB.

## Antes de atualizar

1. No GitHub Desktop, confirme que o repositório atual está em `main` e sem alterações pendentes.
2. Faça `Fetch origin` e depois `Pull origin`, se aparecer.
3. Se quiser uma segurança extra, crie uma cópia da pasta atual no Windows antes de sobrescrever.
4. Não apague seu `.env` local e não envie secrets ao GitHub.

## Aplicar o pacote UPDATE ONLY

1. Extraia `Fluxtok-v4-UPDATE-ONLY.zip`.
2. Abra a pasta extraída.
3. Copie **todo o conteúdo de dentro dela** para a pasta do seu repositório Fluxtok atual.
4. Quando o Windows perguntar, escolha **Substituir os arquivos no destino**.
5. Não apague arquivos que não estejam no pacote; a atualização foi preparada como overlay.

## GitHub Desktop

Depois de copiar:

1. Abra GitHub Desktop.
2. Confira a lista de alterações.
3. Garanta que `.env` não aparece.
4. Summary sugerido: `Fluxtok v4 - FluxRadar, suporte e superadmin`.
5. Clique `Commit to main`.
6. Clique `Push origin`.

O Railway fará novo deploy se o deploy automático estiver ligado.

## Banco

O `npm start` do Fluxtok já executa `prisma migrate deploy` antes de iniciar o Next.js. A migration V4 cria somente tabelas novas e preserva os dados existentes.

No log do Railway, procure algo como:

```text
Applying migration `20260825040000_fluxtok_v4`
All migrations have been successfully applied
```

## Depois do deploy

Teste nesta ordem:

1. `/login`
2. `/dashboard` e FluxRadar
3. creator existente e FluxScore
4. `/support` e criação de chamado
5. `/superadmin`
6. `/superadmin/empresas` e extensão de trial
7. `/superadmin/suporte`
8. `/superadmin/configuracoes`
9. cadastro novo em `/register`
10. billing e checkbox de recorrência

## Se o Railway falhar

Não apague o banco. Copie o erro do Deploy Log. O problema mais importante é corrigir o código/configuração sem recriar o TiDB.

## Aceite obrigatório após a atualização

Usuários antigos que ainda não possuem um aceite da versão jurídica atual serão direcionados uma única vez para `/accept-terms`. Depois da confirmação, seguem normalmente para o dashboard. Isso permite atualizar os termos sem apagar contas nem exigir novo cadastro.

## Verificação automática

Antes de fazer o commit, se você tiver Node instalado, pode executar `npm run preflight`. No Railway o mesmo preflight já roda automaticamente dentro do `npm run build` e interrompe o deploy caso encontre conflitos Git ou arquivos inseguros conhecidos.

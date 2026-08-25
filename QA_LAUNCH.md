# Fluxtok V4 — QA antes de liberar os 7 dias

## O que o build verifica automaticamente

`npm run build` começa executando `npm run preflight`.

O preflight verifica:
- ausência de `<<<<<<<`, `=======`, `>>>>>>>` deixados por conflitos Git;
- ausência de `localhost:10000` no projeto;
- ausência de `.env` real na raiz;
- ausência de secrets óbvios gravados no código;
- presença da migration V4 e arquivos essenciais.

Depois, com as dependências instaladas, o Railway executa `prisma generate` e `next build`, que fazem validação do Prisma e checagem TypeScript/Next.js.

## Smoke test pós-deploy

Execute nesta ordem:

1. Abra `/register` e crie uma conta nova.
2. Confirme os 3 aceites obrigatórios.
3. Verifique onboarding e teste de 7 dias.
4. Cadastre 1 creator, 1 produto e 1 amostra.
5. Marque a amostra como recebida e confira o prazo.
6. Force uma data próxima/atrasada e confira o FluxRadar.
7. Registre um conteúdo e confira o FluxScore do creator.
8. Abra `/support`, crie um chamado e responda pelo `/superadmin/suporte`.
9. Em `/superadmin/configuracoes`, salve e-mail público e e-mail de notificações.
10. Em `/superadmin/empresas`, adicione dias de trial (+1, +3, +7, +14, +30 e valor personalizado).
11. Crie uma empresa manual pelo Superadmin, entre nela e confirme que `/accept-terms` aparece antes do uso.
12. Abra `/billing`, confirme que os planos exibem R$ 49,90 e R$ 79,90 e exigem aceite recorrente.
13. Com Mercado Pago de teste configurado, abra checkout, conclua e use “Atualizar status agora”.
14. Teste cancelamento de assinatura.
15. Em uma segunda empresa, confirme que não é possível enxergar creators, amostras, chamados ou conteúdos da primeira.

## Antes de clientes reais

- configurar SMTP real;
- configurar credenciais Mercado Pago de produção somente após os testes;
- revisar Termos e Política de Privacidade com os dados reais do responsável pelo Fluxtok;
- conferir `APP_URL` HTTPS;
- manter TiDB com TLS;
- manter `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`, Access Token do Mercado Pago e senha SMTP somente nas Variables do Railway;
- fazer backup do banco antes de mudanças estruturais futuras.

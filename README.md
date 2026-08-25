# Fluxtok v4 — FluxRadar

SaaS multiempresa para sellers que operam com creators, amostras, campanhas e conteúdos de social commerce.

A V4 é uma atualização **do mesmo repositório e do mesmo banco da V3**. Não exige criar outro projeto no GitHub. A migration `20260825040000_fluxtok_v4` adiciona apenas novas tabelas de suporte, configurações globais e registros legais.

## Diferencial principal

### FluxRadar

O dashboard não mostra apenas números. Ele monta automaticamente uma lista curta de **próximas ações**, priorizando:

- conteúdo atrasado;
- prazo próximo;
- amostra em transporte sem rastreio;
- operação em dia quando não há urgências.

### FluxScore

Cada creator passa a ter um indicador operacional de 0 a 100 calculado de forma transparente com:

- taxa de publicação;
- cumprimento de prazo;
- sinal de vendas registradas.

O FluxScore é um auxílio operacional, não uma promessa de performance e não depende de IA externa.

## Novidades V4

- FluxRadar no dashboard;
- FluxScore no histórico do creator;
- onboarding mais simples;
- central de suporte dentro do SaaS;
- cliente abre chamado e acompanha respostas;
- Superadmin responde pelo próprio painel;
- e-mail público de suporte configurável pelo Superadmin;
- e-mail de notificações configurável pelo Superadmin;
- notificações de nova conta, novo chamado e assinatura ativa quando SMTP está configurado;
- Superadmin com dashboard de empresas, testes, MRR estimado, suporte e TikTok conectado;
- extensão de trial com +1, +3, +7, +14, +30 ou quantidade personalizada;
- planos Essencial R$ 49,90 e Pro R$ 79,90;
- confirmação explícita de cobrança recorrente antes do Mercado Pago;
- botão de sincronização manual do status do Mercado Pago;
- registro de aceite dos Termos, Privacidade, regras do teste e responsabilidade por dados;
- versão do documento, data/hora, user-agent e hash do IP registrados no banco;
- páginas legais ampliadas para revisão antes do lançamento.

## Fluxo do cliente

`Landing → Criar conta → aceitar termos → 7 dias grátis → onboarding → dashboard → FluxRadar → operação → plano → Mercado Pago`

Ao terminar o teste, os dados permanecem salvos. O acesso operacional é limitado até assinatura ou extensão de trial pelo Superadmin.

## Stack

- Next.js 15 / App Router
- React 19
- TypeScript
- Node.js 22 LTS
- Prisma 6
- MySQL / TiDB compatível com MySQL
- CSS próprio

## Comandos

```bash
npm run dev
npm run build
npm start
npm run typecheck
npm run prisma:deploy
```

`npm start` executa as migrations pendentes, o bootstrap opcional do Superadmin e inicia o Next.js.

## Segurança

- bcrypt para senhas;
- sessão opaca em cookie HttpOnly / SameSite;
- `companyId` derivado da sessão no backend;
- validações Zod no servidor;
- rate limit persistido no login;
- redirects centralizados por `APP_URL`;
- tokens TikTok criptografados em AES-256-GCM;
- secrets apenas em variáveis de ambiente;
- assinatura de webhook Mercado Pago quando configurada;
- registro de aceites legais;
- histórico de auditoria;
- suporte isolado por empresa.

Nunca envie `.env`, `TIKTOK_APP_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY` ou senha SMTP ao GitHub.

## Atualizar o mesmo repositório

Leia `UPGRADE_V4_SAME_REPO.md`.

## Railway + TiDB

Leia `DEPLOY_RAILWAY.md`.

## Mercado Pago

Leia `SETUP_MERCADOPAGO.md`.

## E-mail e suporte

Leia `SETUP_EMAIL_SUPORTE.md`.

## TikTok Shop

A integração da V3 continua disponível. Leia `SETUP_TIKTOK.md`.

## Jurídico

Leia `LEGAL_LAUNCH_CHECKLIST.md`. Os textos incluídos são uma base de produto e transparência; não substituem revisão jurídica do responsável pelo Fluxtok.

## Aceite legal versionado

A V4 também protege o fluxo de atualização: contas criadas antes desta versão e contas criadas manualmente pelo Superadmin são direcionadas para `/accept-terms` até aceitarem a versão atual dos Termos, Privacidade, regras do teste e responsabilidade sobre os dados cadastrados. Quando a versão jurídica for alterada futuramente, basta atualizar `LEGAL_VERSION` para exigir novo aceite.

## Preflight antes de cada deploy

O build agora começa com:

```bash
npm run preflight
```

O preflight bloqueia o deploy se encontrar marcador de conflito Git, referência a `localhost:10000`, `.env` real na raiz, secrets óbvios gravados no código ou arquivos essenciais da V4 ausentes. Isso foi adicionado especialmente para impedir a repetição dos conflitos de merge encontrados em versões anteriores.

## Checklist de lançamento

Leia `QA_LAUNCH.md` antes de convidar os primeiros clientes.

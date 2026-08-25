# Fluxtok v3

SaaS multiempresa para lojas que operam com creators, amostras, campanhas e conteúdos de social commerce.

A V3 mantém o foco da V2 em telas objetivas, mas adiciona a camada comercial do SaaS:

- cadastro público da própria empresa;
- 7 dias grátis automáticos, sem cartão;
- assinatura recorrente e cancelamento via Mercado Pago (quando configurado);
- TikTok Shop oficial por OAuth Seller;
- sincronização real de produtos pela TikTok Shop Open API;
- campanhas;
- equipe com acessos separados;
- painel Superadmin;
- páginas-base de Termos de Uso e Privacidade para revisão antes do lançamento;
- compatível com Render/TiDB e Hostinger/MySQL.

## Stack

- Next.js 15 / App Router
- React 19
- TypeScript
- Node.js 22 LTS
- Prisma 6
- MySQL / TiDB compatível com MySQL
- CSS próprio, sem UI paga

## Fluxo do cliente

`Landing → Criar conta → empresa + admin → 7 dias grátis → onboarding → dashboard → conectar TikTok Shop → escolher plano → Mercado Pago`

Ao acabar o teste, os dados permanecem no banco. O acesso operacional é direcionado para a tela de assinatura.

## Instalação local

1. Copie `.env.example` para `.env`.
2. Configure `DATABASE_URL`, `SESSION_SECRET` e `TOKEN_ENCRYPTION_KEY`.
3. Instale as dependências com `npm install`.
4. Rode `npm run prisma:deploy` em um banco novo ou já migrado.
5. Rode `npm run dev`.

## Comandos

```bash
npm run dev
npm run build
npm start
npm run typecheck
npm run prisma:deploy
```

O `npm start` executa as migrations pendentes, faz o bootstrap opcional do superadmin e inicia o Next.js.

## Segurança

- senha com bcrypt;
- sessão opaca em cookie HttpOnly/SameSite;
- `companyId` vem da sessão do backend;
- validações Zod no servidor;
- rate limit de login persistido;
- redirects centralizados por `APP_URL`;
- tokens do TikTok criptografados em AES-256-GCM usando `TOKEN_ENCRYPTION_KEY`;
- webhook do Mercado Pago com validação HMAC quando `MERCADOPAGO_WEBHOOK_SECRET` está definido;
- secrets somente em variáveis de ambiente.

Nunca publique `.env`, `TIKTOK_APP_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`, `SESSION_SECRET` ou `TOKEN_ENCRYPTION_KEY`.

## TikTok Shop

A integração implementada usa o fluxo oficial Seller OAuth e três partes reais da plataforma:

1. autorização do seller;
2. obtenção das lojas autorizadas;
3. busca/sincronização de produtos (`/product/202502/products/search`).

Você precisa criar seu app no TikTok Shop Partner Center e conseguir os scopes necessários. Configure como Redirect URL:

`https://SEU-DOMINIO/api/integrations/tiktok/callback`

Veja `SETUP_TIKTOK.md`.

## Mercado Pago

A V3 possui checkout de assinatura recorrente usando `/preapproval`, cancelamento de assinatura e webhook para atualização do status.

Configure o webhook:

`https://SEU-DOMINIO/api/webhooks/mercadopago`

Veja `SETUP_MERCADOPAGO.md`.

## Hospedagem

- Render: `DEPLOY_RENDER.md`
- Hostinger: `DEPLOY_HOSTINGER.md`
- GitHub Desktop: `GITHUB_DESKTOP.md`

## Branding

Os arquivos gerados para a identidade Fluxtok ficam em `public/brand/`.

A marca foi criada com linguagem própria e não usa o logo oficial do TikTok. Inclua o aviso de não afiliação na landing e nos termos.

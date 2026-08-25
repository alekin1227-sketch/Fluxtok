# Fluxtok v4 — Hostinger + MySQL

A aplicação foi preparada para Next.js/Node.js e MySQL sem depender do Render.

## 1. Banco

No hPanel crie um banco MySQL, usuário e senha. Guarde nome, usuário e host fornecidos pela Hostinger.

Monte `DATABASE_URL` no formato indicado pelo painel, normalmente semelhante a:

`mysql://USUARIO:SENHA@HOST:3306/BANCO`

Se a senha possuir caracteres reservados de URL, faça URL encoding.

## 2. Aplicação

Crie uma aplicação Node.js/Next.js no hPanel e conecte o repositório privado do GitHub. Use Node.js 22 quando disponível.

Build:

`npm install --include=dev && npm run build`

Start:

`npm start`

## 3. Variáveis

Obrigatórias:

- `DATABASE_URL`
- `APP_URL=https://seudominio.com.br`
- `SESSION_SECRET` com 32+ caracteres
- `TOKEN_ENCRYPTION_KEY` com 64 caracteres hexadecimais
- `NODE_ENV=production`

Opcional Superadmin:

- `SUPERADMIN_NAME=Fluxtok Admin`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`

TikTok:

- `TIKTOK_APP_KEY`
- `TIKTOK_APP_SECRET`
- `TIKTOK_SERVICE_ID`
- `TIKTOK_MARKET=ROW`

Mercado Pago:

- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `FLUXTOK_STARTER_PRICE`
- `FLUXTOK_PRO_PRICE`

## 4. SSL e domínio

Ative o SSL no domínio e somente depois configure `APP_URL` com `https://`. O callback do TikTok e o webhook do Mercado Pago também devem usar HTTPS.

## 5. Primeiro start

`npm start` aplica migrations automaticamente antes de iniciar. Consulte os logs para confirmar que as migrations foram aplicadas.

## 6. Backup

Ative os backups disponibilizados no plano da Hostinger. Antes de migrations maiores, faça um backup adicional do MySQL.

## 7. Migração do CreatorTrack v2

A migration `20260824150000_fluxtok_v3` adiciona as tabelas/colunas da V3 e cria registros de assinatura para empresas antigas. Faça backup antes de apontar a V3 para um banco existente.


## V4

A migration V4 adiciona FluxRadar (sem tabela própria), suporte interno, configurações globais e registro de aceites legais. Mantenha o mesmo banco e execute `prisma migrate deploy`.

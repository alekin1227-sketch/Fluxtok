# Fluxtok v3 — Render + TiDB

## Web Service

- Runtime: Node
- Node: 22
- Build Command: `npm install --include=dev && npm run build`
- Start Command: `npm start`

## Variáveis mínimas

- `DATABASE_URL`
- `APP_URL=https://SEU-SERVICO.onrender.com`
- `SESSION_SECRET`
- `TOKEN_ENCRYPTION_KEY`
- `NODE_ENV=production`

Para TiDB Cloud, use a string fornecida pelo painel com TLS, por exemplo:

`mysql://USER:PASSWORD@HOST:4000/fluxtok?sslaccept=strict`

## Superadmin opcional

- `SUPERADMIN_NAME`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`

## TikTok opcional

- `TIKTOK_APP_KEY`
- `TIKTOK_APP_SECRET`
- `TIKTOK_SERVICE_ID`
- `TIKTOK_MARKET=ROW`

Callback: `https://SEU-SERVICO.onrender.com/api/integrations/tiktok/callback`

## Mercado Pago opcional

- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `FLUXTOK_STARTER_PRICE=49.90`
- `FLUXTOK_PRO_PRICE=79.90`

Webhook: `https://SEU-SERVICO.onrender.com/api/webhooks/mercadopago`

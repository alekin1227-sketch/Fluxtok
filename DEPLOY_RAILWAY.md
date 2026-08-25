# Fluxtok v4 — Railway + TiDB

## Configuração do serviço

- Runtime: Node.js
- Node: 22.x (definido no `package.json`)
- Build Command: `npm install --include=dev && npm run build`
- Start Command: `npm start`

## Variáveis mínimas

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:4000/fluxtok?sslaccept=strict
APP_URL=https://SEU-DOMINIO.up.railway.app
SESSION_SECRET=32+ caracteres aleatórios
TOKEN_ENCRYPTION_KEY=64 caracteres hexadecimais
NODE_ENV=production
```

## Superadmin

```text
SUPERADMIN_NAME=Fluxtok Admin
SUPERADMIN_EMAIL=seu-email
SUPERADMIN_PASSWORD=senha forte
```

O bootstrap cria o Superadmin somente quando necessário.

## Mercado Pago

```text
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_WEBHOOK_SECRET=...
FLUXTOK_STARTER_PRICE=49.90
FLUXTOK_PRO_PRICE=79.90
```

## SMTP opcional

```text
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=Fluxtok <no-reply@seudominio.com>
```

O e-mail público de suporte e o e-mail que recebe notificações são cadastrados depois em:

`Superadmin → Configurações`

## HTTPS

Em `Settings → Networking → Public Networking`, gere um domínio Railway. O `APP_URL` deve ser exatamente a URL HTTPS gerada, sem `localhost`.

## TiDB

Use o endpoint público com TLS e `?sslaccept=strict`. Durante teste, a regra pública do TiDB pode ser necessária porque Railway Trial/Hobby não oferece IP de saída estático em todos os planos. Use senha forte e TLS e restrinja a rede quando sua infraestrutura permitir.

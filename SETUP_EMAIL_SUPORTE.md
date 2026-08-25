# E-mail + Suporte — Fluxtok v4

O suporte funciona mesmo sem SMTP: clientes abrem chamados e o Superadmin responde dentro do SaaS.

SMTP adiciona notificações por e-mail.

## 1. Configure SMTP no Railway

Em `Fluxtok → Variables`, adicione:

```text
SMTP_HOST=smtp.seuprovedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario-do-smtp
SMTP_PASS=senha-ou-token-do-smtp
SMTP_FROM=Fluxtok <no-reply@seudominio.com>
```

Se usar porta 465, normalmente `SMTP_SECURE=true`.

Nunca salve a senha SMTP no GitHub.

## 2. Configure os e-mails pelo Superadmin

Abra:

`Superadmin → Configurações`

Preencha:

- **Nome exibido no suporte**: ex. `Equipe Fluxtok`;
- **E-mail público de suporte**: endereço que o cliente pode visualizar;
- **E-mail que recebe notificações**: seu e-mail pessoal ou operacional.

Esses valores ficam no banco e podem ser alterados sem deploy. Depois de salvar, use **Enviar e-mail de teste** para validar SMTP + destinatário antes de abrir o sistema aos clientes.

## 3. O que gera notificação

Com SMTP ativo, o e-mail de notificações recebe aviso quando:

- uma nova conta é criada;
- um cliente abre/responde chamado;
- uma assinatura é ativada pelo webhook do Mercado Pago.

Quando o Superadmin responde um chamado, o cliente recebe aviso no e-mail da conta e a mensagem continua registrada dentro do Fluxtok.

## Gmail

Se usar Gmail/Google Workspace, prefira senha de app ou credencial SMTP adequada à conta, com 2FA quando exigido. Não use sua senha normal da conta no código.

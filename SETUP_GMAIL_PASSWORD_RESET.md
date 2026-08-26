# Fluxtok V4.8 — Gmail para redefinição de senha

A V4.8 já envia o e-mail de redefinição automaticamente quando o SMTP está configurado.

## 1. Prepare uma conta Gmail

Use de preferência uma conta criada para o Fluxtok, por exemplo `fluxtok.suporte@gmail.com`.

Ative a **Verificação em duas etapas** na Conta Google. Depois crie uma **Senha de app** para o Fluxtok.

> Não use a senha normal do Gmail no Railway. Use a senha de app de 16 caracteres.

## 2. Railway → Variables

Adicione:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=seuemail@gmail.com
SMTP_PASS=SUA_SENHA_DE_APP
SMTP_FROM="Fluxtok <seuemail@gmail.com>"
```

Não coloque `SMTP_PASS` no GitHub.

## 3. APP_URL

Confirme que a URL pública do Fluxtok está correta:

```env
APP_URL=https://seu-dominio.up.railway.app
```

O link enviado no e-mail usa `APP_URL`.

## 4. Teste pelo Superadmin

Entre em:

**Superadmin → Configurações**

Cadastre um e-mail de notificação e use **Enviar e-mail de teste**.

## 5. Teste a redefinição real

1. Saia da conta.
2. Abra `/forgot-password`.
3. Informe o e-mail de uma conta existente.
4. O Fluxtok cria um link de uso único, válido por 30 minutos.
5. Abra o e-mail e redefina a senha.
6. Ao concluir, as sessões antigas são encerradas e outro e-mail confirma a alteração.

## Segurança aplicada

- token aleatório não é salvo em texto puro no banco;
- somente o hash do token é persistido;
- link expira em 30 minutos;
- token é de uso único;
- pedidos de redefinição têm limite por IP/e-mail;
- uma nova solicitação invalida links anteriores ainda não usados;
- após redefinir, sessões antigas são encerradas;
- resposta de "esqueci a senha" não revela se o e-mail existe;
- SMTP usa TLS 1.2+.

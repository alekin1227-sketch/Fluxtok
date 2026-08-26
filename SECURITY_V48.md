# Segurança — Fluxtok V4.8

Esta versão reforça a aplicação, mas nenhum sistema conectado à internet pode prometer risco zero.

## Proteções existentes/reforçadas

- senhas com bcrypt;
- sessão por token aleatório, armazenado no banco somente como hash;
- cookie HTTP-only, Secure em produção e SameSite=Lax;
- isolamento multi-tenant por `companyId` nas rotas da aplicação;
- validação de origem em operações mutáveis;
- limitação de tentativas de login;
- limitação de pedidos de redefinição de senha;
- tokens de redefinição de uso único e 30 minutos de validade;
- sessões antigas encerradas após troca de senha;
- verificação de assinatura do webhook Mercado Pago;
- secrets somente por variável de ambiente;
- cabeçalhos anti-clickjacking/sniffing;
- HSTS em produção;
- TLS 1.2+ no SMTP.

## Recomendações para produção

1. Nunca coloque `.env`, Access Token, Senha de app Gmail ou `SESSION_SECRET` no GitHub.
2. Use `SESSION_SECRET` e `TOKEN_ENCRYPTION_KEY` fortes e diferentes.
3. Ative 2FA no GitHub, Railway, TiDB, Mercado Pago e Gmail.
4. Use um Gmail exclusivo do Fluxtok enquanto não tiver domínio próprio.
5. Depois, migre o remetente para um e-mail no domínio da plataforma com SPF/DKIM/DMARC.
6. Faça backup e teste de restauração do banco.
7. Revise dependências periodicamente; não use `npm audit fix --force` diretamente em produção.
8. Restrinja permissões das integrações ao mínimo necessário.

# Fluxtok V4.8 — Annual + Gmail + Security

Atualização incremental sobre a V4.7.

## O que entrou

### Assinatura anual

Além da assinatura mensal, cada plano agora pode ser contratado no ciclo **anual**.

Por padrão:

- Essencial: R$ 49,90/mês
- Pro: R$ 79,90/mês
- desconto anual padrão: 10%

Com 10% de desconto, o sistema calcula automaticamente:

- Essencial anual: R$ 538,92 a cada 12 meses
- Pro anual: R$ 862,92 a cada 12 meses

Você pode alterar o desconto ou fixar os preços anuais pelas Variables sem mudar código.

```env
FLUXTOK_ANNUAL_DISCOUNT_PERCENT=10
# FLUXTOK_STARTER_ANNUAL_PRICE=538.92
# FLUXTOK_PRO_ANNUAL_PRICE=862.92
```

A cobrança anual é uma cobrança integral a cada 12 meses. Não é parcelamento em 12 vezes.

### Troca segura

Iniciar uma troca mensal → anual, anual → mensal, Essencial → Pro ou Pro → Essencial não substitui o plano atual antes da confirmação do Mercado Pago.

O plano atual só muda após o novo `preapproval` ficar `authorized`.

### Gmail / redefinição de senha

Já existe fluxo completo:

- Esqueci minha senha
- e-mail automático
- link de uso único
- expiração em 30 minutos
- confirmação de nova senha
- encerramento das sessões antigas
- e-mail avisando que a senha foi alterada

Veja `SETUP_GMAIL_PASSWORD_RESET.md`.

### Segurança

- CSRF mais rígido em produção;
- rate limit também no pedido de redefinição;
- tokens antigos de redefinição são invalidados;
- reset é consumido de forma atômica;
- headers adicionais de segurança;
- HSTS em produção;
- cookies de sessão HTTP-only/secure e prioridade alta;
- SMTP com TLS 1.2+;
- secrets continuam somente em Variables;
- respostas de recuperação de senha não revelam existência de conta.

## Banco de dados

**Nenhuma migration nova.**

A periodicidade é armazenada usando os campos já existentes de `provider` / `pendingProvider`:

- `mercadopago` → mensal legado
- `mercadopago_monthly` → mensal novo
- `mercadopago_annual` → anual
- `mercadopago_pix` → Pix avulso

Isso mantém compatibilidade com contas antigas.

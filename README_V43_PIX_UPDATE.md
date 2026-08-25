# Fluxtok V4.3 — UPDATE ONLY

Atualização incremental para o mesmo repositório atual.

## O que entra

- Pix real Mercado Pago em Essencial e Pro;
- QR Code e Pix Copia e Cola;
- botão de verificação manual;
- Webhook de pagamentos;
- liberação de 30 dias por Pix aprovado;
- renovação Pix soma 30 dias sem perder dias ainda válidos;
- proteção contra Webhook duplicado;
- bloqueio de Pix quando existe cartão recorrente ativo;
- registro de aceite do Pix sem armazenar CPF/CNPJ;
- regra de expiração do acesso Pix;
- Termos atualizados para distinguir cartão recorrente e Pix avulso.

## Instalação

1. Extraia o ZIP.
2. Abra a pasta `Fluxtok-v4.3-Pix-UPDATE-ONLY`.
3. Copie **todo o conteúdo de dentro dela** para a raiz do seu repositório Fluxtok atual.
4. Confirme substituição dos arquivos existentes.
5. GitHub Desktop > `Commit to main` > `Push origin`.
6. Railway fará o novo deploy.
7. O start aplica a migration automaticamente no TiDB.

Commit sugerido:

```text
Fluxtok V4.3 - Pix Mercado Pago
```

Leia `SETUP_PIX_MERCADOPAGO.md` antes do teste real.

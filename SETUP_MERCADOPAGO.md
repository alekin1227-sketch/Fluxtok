# Mercado Pago Assinaturas — Fluxtok v4

O Fluxtok usa a API oficial de **Assinaturas** do Mercado Pago. A assinatura é criada pelo endpoint `POST /preapproval`, e o status pode ser atualizado por webhook ou pelo botão **Atualizar status agora**.

Planos padrão:

- Essencial: **R$ 49,90/mês**
- Pro: **R$ 79,90/mês**

O teste gratuito de 7 dias é controlado pelo Fluxtok e não exige cartão.

## 1. Crie sua aplicação no Mercado Pago

Acesse:

`https://www.mercadopago.com.br/developers/panel/app`

Entre em **Suas integrações** e crie uma aplicação para o Fluxtok.

O Mercado Pago mantém credenciais de **teste** e de **produção**. Para receber cobranças reais, ative as credenciais de produção no painel da aplicação.

Na ativação de produção, o Mercado Pago pode solicitar informações do negócio, site, segmento e aceite da Declaração de Privacidade e Termos e Condições.

Documentação oficial de credenciais:

`https://www.mercadopago.com.br/developers/pt/docs/credentials`

## 2. Qual credencial o Fluxtok usa

A integração atual usa o **Access Token** no backend.

Você NÃO precisa colocar o Access Token no frontend e NÃO deve enviá-lo ao GitHub.

No Railway:

`Fluxtok → Variables`

adicione:

```text
MERCADOPAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN
FLUXTOK_STARTER_PRICE=49.90
FLUXTOK_PRO_PRICE=79.90
```

A Public Key não é necessária no fluxo atual porque o Fluxtok redireciona o cliente ao checkout de assinatura do Mercado Pago e não captura cartão diretamente.

## 3. Checkout usado pelo Fluxtok

O backend cria uma assinatura em:

`POST https://api.mercadopago.com/preapproval`

com:

- descrição do plano;
- `external_reference` igual ao ID da empresa no Fluxtok;
- e-mail do administrador;
- cobrança mensal;
- valor do plano;
- moeda BRL;
- URL de retorno para o Fluxtok.

Referência oficial:

`https://www.mercadopago.com.br/developers/pt/reference/online-payments/subscriptions/create-preapproval/post`

Antes do redirecionamento, o Fluxtok exige que o administrador marque a confirmação de cobrança recorrente e registra esse aceite no banco.

## 4. Webhook

A URL do Fluxtok é:

```text
https://SEU-DOMINIO/api/webhooks/mercadopago
```

No painel da sua aplicação Mercado Pago, procure a área de **Webhooks / Notificações** e configure a URL HTTPS.

Para Assinaturas, os tópicos relevantes descritos atualmente pelo Mercado Pago incluem:

- `subscription_preapproval` — criação/atualização da assinatura;
- `payments` — pagamentos relacionados às assinaturas;
- `subscription_authorized_payment` — quando aplicável ao fluxo de pagamentos autorizados.

Documentação atual de notificações:

`https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications/webhooks`

A forma exata de habilitar notificações de Assinaturas pode variar conforme o fluxo e a interface disponível na sua conta. Se o painel não expuser o tópico esperado, mantenha a integração funcionando pelo botão **Atualizar status agora** e siga a configuração de notificações indicada na documentação atual da sua aplicação.

## 5. Assinatura secreta do webhook

Quando o painel fornecer uma **assinatura secreta**, copie-a e salve no Railway:

```text
MERCADOPAGO_WEBHOOK_SECRET=SUA_ASSINATURA_SECRETA
```

O Fluxtok valida `x-signature` e `x-request-id` antes de processar o webhook.

Em produção, não deixe essa variável vazia se você pretende usar o webhook.

## 6. Teste antes de produção

Primeiro utilize as credenciais de teste da sua aplicação Mercado Pago e valide:

1. abrir `/billing`;
2. marcar o aceite de recorrência;
3. clicar em **Assinar Essencial** ou **Assinar Pro**;
4. ser redirecionado para o Mercado Pago;
5. concluir o fluxo de teste;
6. retornar ao Fluxtok;
7. clicar em **Atualizar status agora**;
8. confirmar que a assinatura mudou para `ACTIVE` quando o Mercado Pago retornar `authorized`.

Depois configure/valide o webhook.

## 7. Produção

Quando o teste estiver estável:

1. ative credenciais de produção;
2. troque `MERCADOPAGO_ACCESS_TOKEN` no Railway pelo token de produção;
3. configure o webhook HTTPS de produção;
4. defina `MERCADOPAGO_WEBHOOK_SECRET`;
5. faça um pagamento real de baixo risco/controlado para validar o fluxo completo;
6. confirme o status no Superadmin e na conta cliente.

## 8. Cancelamento

O administrador da empresa pode cancelar a assinatura no Fluxtok. O backend envia `PUT /preapproval/{id}` para alterar o status no Mercado Pago.

Referência oficial de gerenciamento:

`https://www.mercadopago.com.br/developers/pt/docs/subscriptions/subscription-management`

## 9. Segurança

- Access Token somente no backend;
- nunca publicar secrets no GitHub;
- usar HTTPS;
- não armazenar número completo do cartão;
- validar webhook;
- consultar o objeto da assinatura diretamente no Mercado Pago antes de atualizar o status local;
- registrar o aceite da cobrança recorrente.

## 10. “Licença” / autorização para usar o Mercado Pago

Não existe uma chave de licença do Fluxtok para o Mercado Pago. Você precisa ter uma conta Mercado Pago elegível, criar a aplicação em **Suas integrações**, aceitar os termos aplicáveis e ativar as credenciais de produção. Tarifas e condições comerciais do Mercado Pago são definidas pelo próprio provedor e podem mudar.

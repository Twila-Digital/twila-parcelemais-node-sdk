<p align="center">
  <img src="https://raw.githubusercontent.com/Twila-Digital/twila-parcelemais-node-sdk/production/assets/logo-light.svg" alt="Parcele+" width="180" style="max-width: 100%;">
</p>

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/Twila-Digital/twila-parcelemais-node-sdk"></a>
  <a href="https://github.com/Twila-Digital/twila-parcelemais-node-sdk/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Twila-Digital/twila-parcelemais-node-sdk/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/Twila-Digital/twila-parcelemais-node-sdk/actions/workflows/quality.yml"><img alt="Quality" src="https://github.com/Twila-Digital/twila-parcelemais-node-sdk/actions/workflows/quality.yml/badge.svg"></a>
  <a href="https://github.com/Twila-Digital/twila-parcelemais-node-sdk/security/code-scanning"><img alt="Security" src="https://github.com/Twila-Digital/twila-parcelemais-node-sdk/actions/workflows/security.yml/badge.svg"></a>
  <a href="https://codecov.io/gh/Twila-Digital/twila-parcelemais-node-sdk"><img alt="Coverage" src="https://codecov.io/gh/Twila-Digital/twila-parcelemais-node-sdk/branch/production/graph/badge.svg"></a>
  <img alt="Node" src="https://img.shields.io/badge/Node.js-14%2B-539E43">
</p>

# @twila/parcelemais

SDK oficial em Node.js/TypeScript para a API do [Parcele+](https://www.cartaosimples.com.br) — crédito direto ao consumidor (CDC) e parcelamento no momento da compra.

> Uso restrito a server-side. O `clientSecret` nunca deve ser embarcado em um app mobile, SPA ou qualquer código que rode no navegador/dispositivo do usuário final.

## Compatibilidade

| Runtime | Versões aceitas |
| --- | --- |
| Node.js | 14 ou superior (suíte completa em CI no Node 22/24; smoke test do pacote publicado em Node 14 e 18) |

Publica **CommonJS** (`require`) e **ES Modules** (`import`) no mesmo pacote, com tipos TypeScript inclusos — funciona em projetos legados e modernos sem configuração extra.

## Instalação

```bash
npm install @twila/parcelemais
```

## Quick start

```typescript
import { ParceleMaisClient, ParceleMaisEnvironment } from '@twila/parcelemais';

const client = new ParceleMaisClient({
  clientId: '<seu-client-id>',
  clientSecret: '<seu-client-secret>',
  environment: ParceleMaisEnvironment.Staging,
});
```

Equivalente em CommonJS:

```javascript
const { ParceleMaisClient, ParceleMaisEnvironment } = require('@twila/parcelemais');
```

`ParceleMaisClient` é thread-safe (single-threaded, mas seguro para chamadas concorrentes) e deve ser reaproveitado como singleton na sua aplicação — ele mantém o cache do token de acesso e o estado do circuit breaker.

### Simulando parcelas

```typescript
const parcelas = await client.simulations.simulateInstallments({ requestedAmount: 1500.0 });

for (const parcela of parcelas)
  console.log(`${parcela.term}x de ${parcela.installmentAmount} (total ${parcela.totalAmount})`);
```

### Criando um pedido

```typescript
import { OrderStatus } from '@twila/parcelemais';

const pedidoId = await client.orders.create({
  cpf: '12345678901',
  phoneNumber: '+5511999998888',
  establishmentDocument: '12345678000195',
  requestedAmount: 1500.0,
  name: 'Maria Souza',
  email: 'maria.souza@exemplo.com.br',
  dateOfBirth: '1990-05-20T00:00:00-03:00',
  address: {
    street: 'Av. Paulista',
    number: '1578',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01311000',
  },
});
```

`create` retorna só o `id` do pedido — a API não devolve o pedido completo na criação; use `client.orders.get(pedidoId)` se precisar dos dados completos logo em seguida.

## Clientes por recurso

| Cliente | Métodos |
| --- | --- |
| `client.orders` | `create`, `get`, `list`, `startCdcSale`, `importInvoice` |
| `client.simulations` | `simulateInstallments`, `simulateValues` |
| `client.customers` | `get`, `list` |
| `client.webhooks` | `create`, `list`, `update`, `delete` |

## Paginação

`orders.list(...)` e `customers.list(...)` retornam um `PagedResult<T>` — sem auto-paginação; você controla explicitamente o avanço de página:

```typescript
const page = await client.orders.list({ page: 1, pageSize: 20 });

for (const order of page.items) console.log(order.id);

if (page.hasNext) {
  const next = await client.orders.list({ page: 2, pageSize: 20 });
}
```

## Tratamento de erros

| Erro | Quando |
| --- | --- |
| `ParceleMaisConfigurationError` | Configuração do `ParceleMaisClient` inválida (ex: `clientId`/`clientSecret` ausentes) |
| `ParceleMaisAuthenticationError` | Falha ao gerar/renovar o token de acesso |
| `ParceleMaisValidationError` | `400` — erro de validação, com `fieldErrors` por campo |
| `ParceleMaisRateLimitError` | `429` |
| `ParceleMaisTimeoutError` | Timeout de rede, timeout total, ou circuit breaker aberto |
| `ParceleMaisApiError` | Qualquer outro erro de API (`404`, `409`, `5xx`) |
| `ParceleMaisWebhookSignatureError` | Assinatura de webhook inválida ou expirada |

```typescript
import { ParceleMaisApiError } from '@twila/parcelemais';

try {
  await client.orders.get(orderId);
} catch (error) {
  if (error instanceof ParceleMaisApiError) {
    console.log(`${error.statusCode} ${error.errorCode}: ${error.message}`);
  }
}
```

## Validando webhooks

```typescript
import { parseWebhookEvent } from '@twila/parcelemais';

const evento = parseWebhookEvent(rawBody, signatureHeader, signingSecret);
```

Verifica a assinatura HMAC-SHA256 do cabeçalho e a janela de replay (5 minutos) antes de expor o evento. Lança `ParceleMaisWebhookSignatureError` se a assinatura for inválida ou o evento estiver fora da janela.

## Samples

- `samples/sample-cjs` — CommonJS (`require`), Node puro
- `samples/sample-esm` — ES Modules (`import`), Node puro

## Qualidade, segurança e cobertura

- **Build** (`ci.yml`) — `tsc --noEmit` + build dual CJS/ESM via `tsup` (alvo `node14`, com downlevel automático de sintaxe não suportada).
- **Test** (`ci.yml`) — suíte completa (vitest) em Node 22/24, que é o mínimo que o próprio vitest 5 exige (`^22.12.0 || ^24.0.0`) — não roda em Node 14/18. Job separado (`legacy-smoke`) valida o pacote já compilado (`dist/`) rodando de verdade em Node 14 e 18, sem depender do vitest.
- **Quality** (`quality.yml`) — análise estática via Codacy CLI, resultados publicados na aba **Security → Code scanning** do repositório.
- **Security** (`security.yml`) — [CodeQL](https://codeql.github.com/) para JavaScript/TypeScript, rodando a cada PR/push e semanalmente.
- **Coverage** — cobertura de testes coletada via `@vitest/coverage-v8` e publicada no [Codecov](https://codecov.io/gh/Twila-Digital/twila-parcelemais-node-sdk).

## Documentação completa

[documentacao.parcelemais.com.br](https://documentacao.parcelemais.com.br) — referência de todos os endpoints, autenticação, webhooks e mais.

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Código de conduta

Este projeto segue o [Código de Conduta](CODE_OF_CONDUCT.md).

## Licença

[MIT](LICENSE)

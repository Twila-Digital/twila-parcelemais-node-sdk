import { randomUUID } from 'node:crypto';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ParceleMaisClient } from '../../src';

const BASE_URL = 'http://localhost/integration';
const TOKEN_RESPONSE = { token_de_acesso: 'token-de-teste', expira_em_segundos: 3600, tipo_de_token: 'Bearer' };

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function newClient(): ParceleMaisClient {
  return new ParceleMaisClient({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    // Sem "/" final de propósito — regressão do bug de resolução de URI relativa (RFC 3986 §5.3).
    baseUrl: BASE_URL,
    resilience: { totalTimeoutMs: 5000, attemptTimeoutMs: 2000, retryBaseDelayMs: 10 },
  });
}

function stubTokenEndpoint(): void {
  server.use(http.post(`${BASE_URL}/v1/authentication/accesstoken`, () => HttpResponse.json(TOKEN_RESPONSE)));
}

function orderJson(orderId: string): Record<string, unknown> {
  return {
    id: orderId,
    numero: 123,
    status: { valor: 9, descricao: 'Comprado' },
    documentoCliente: '12345678901',
    razaoSocialEstabelecimento: 'Loja Exemplo',
    documentoEstabelecimento: '12345678000195',
    criadoEm: '2026-01-01T10:00:00-03:00',
  };
}

describe('OrdersClient (MSW)', () => {
  it('resolves a baseUrl without a trailing slash correctly', async () => {
    stubTokenEndpoint();
    const orderId = randomUUID();

    server.use(http.get(`${BASE_URL}/v1/order/${orderId}`, () => HttpResponse.json(orderJson(orderId))));

    const client = newClient();
    const order = await client.orders.get(orderId);

    expect(order.id).toBe(orderId);
  });

  it('retries on a transient failure then succeeds', async () => {
    stubTokenEndpoint();
    const orderId = randomUUID();
    let attempts = 0;

    server.use(
      http.get(`${BASE_URL}/v1/order/${orderId}`, () => {
        attempts += 1;
        if (attempts === 1) return new HttpResponse(null, { status: 503 });
        return HttpResponse.json(orderJson(orderId));
      }),
    );

    const client = newClient();
    const order = await client.orders.get(orderId);

    expect(order.id).toBe(orderId);
    expect(attempts).toBe(2);
  });

  it('refreshes the token once on 401 then succeeds', async () => {
    const orderId = randomUUID();
    let tokenCalls = 0;
    let orderCalls = 0;

    server.use(
      http.post(`${BASE_URL}/v1/authentication/accesstoken`, () => {
        tokenCalls += 1;
        return HttpResponse.json(TOKEN_RESPONSE);
      }),
      http.get(`${BASE_URL}/v1/order/${orderId}`, () => {
        orderCalls += 1;
        if (orderCalls === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json(orderJson(orderId));
      }),
    );

    const client = newClient();
    const order = await client.orders.get(orderId);

    expect(order.id).toBe(orderId);
    expect(orderCalls).toBe(2);
    expect(tokenCalls).toBe(2);
  });

  it('sends the same idempotency key across retries on create', async () => {
    stubTokenEndpoint();
    const orderId = randomUUID();
    let attempts = 0;
    const idempotencyKeys: (string | null)[] = [];

    server.use(
      http.post(`${BASE_URL}/v1/order`, ({ request }) => {
        attempts += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key'));
        if (attempts === 1) return new HttpResponse(null, { status: 503 });
        return HttpResponse.json({ pedidoId: orderId });
      }),
    );

    const client = newClient();
    const createdId = await client.orders.create({
      cpf: '12345678901',
      phoneNumber: '+5511999998888',
      establishmentDocument: '12345678000195',
      requestedAmount: 1500,
      name: 'Maria Souza',
      email: 'maria@exemplo.com.br',
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

    expect(createdId).toBe(orderId);
    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toBeTruthy();
    expect(idempotencyKeys[0]).toBe(idempotencyKeys[1]);
  });
});

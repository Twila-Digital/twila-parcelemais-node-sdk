import { randomUUID } from 'node:crypto';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ParceleMaisApiError, ParceleMaisClient, WebHookType } from '../../src';

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
    baseUrl: BASE_URL,
    resilience: { totalTimeoutMs: 5000, attemptTimeoutMs: 2000, retryBaseDelayMs: 10 },
  });
}

function stubTokenEndpoint(): void {
  server.use(http.post(`${BASE_URL}/v1/authentication/accesstoken`, () => HttpResponse.json(TOKEN_RESPONSE)));
}

function auditJson(id: string, tipo = 3): Record<string, unknown> {
  return {
    id,
    tipo,
    requisicao: '{"id_pedido":"abc","enum_status":9,"status":"Comprado"}',
    resposta: '{"ok":true}',
    statusCode: 200,
    dataCriacao: '2026-09-01T10:00:00-03:00',
  };
}

function pagedJson(itens: Record<string, unknown>[], pagina: Record<string, unknown>): Record<string, unknown> {
  return { itens, pagina };
}

const EMPTY_PAGE = { tem_proximo: false, tem_anterior: false, numero: 1, tamanho: 10, total: 0 };

describe('WebhooksClient.listAudit (MSW)', () => {
  it('builds the query string from all filters', async () => {
    stubTokenEndpoint();
    const orderId = randomUUID();
    let url: URL | undefined;

    server.use(
      http.get(`${BASE_URL}/v1/webhooks/auditoria`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(pagedJson([], EMPTY_PAGE));
      }),
    );

    await newClient().webhooks.listAudit({
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: '2026-09-30T23:59:59-03:00',
      orderId,
      orderNumber: 123,
      statusCode: 500,
      page: 2,
      pageSize: 25,
    });

    expect(url?.searchParams.get('dataInicio')).toBe('2026-09-01T00:00:00.000Z');
    expect(url?.searchParams.get('dataFim')).toBe('2026-09-30T23:59:59-03:00');
    expect(url?.searchParams.get('pedidoId')).toBe(orderId);
    expect(url?.searchParams.get('numeroPedido')).toBe('123');
    expect(url?.searchParams.get('statusCode')).toBe('500');
    expect(url?.searchParams.get('pagina')).toBe('2');
    expect(url?.searchParams.get('tamanhoPagina')).toBe('25');
  });

  it('omits undefined filters and applies default paging', async () => {
    stubTokenEndpoint();
    let url: URL | undefined;

    server.use(
      http.get(`${BASE_URL}/v1/webhooks/auditoria`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(pagedJson([], EMPTY_PAGE));
      }),
    );

    await newClient().webhooks.listAudit();

    expect([...(url?.searchParams.keys() ?? [])]).toEqual(['pagina', 'tamanhoPagina']);
    expect(url?.searchParams.get('pagina')).toBe('1');
    expect(url?.searchParams.get('tamanhoPagina')).toBe('10');
  });

  it('maps the items and the paging envelope', async () => {
    stubTokenEndpoint();
    const firstId = randomUUID();
    const secondId = randomUUID();

    server.use(
      http.get(`${BASE_URL}/v1/webhooks/auditoria`, () =>
        HttpResponse.json(
          pagedJson([auditJson(firstId), auditJson(secondId, 99)], {
            tem_proximo: true,
            tem_anterior: true,
            numero: 2,
            tamanho: 2,
            total: 7,
          }),
        ),
      ),
    );

    const page = await newClient().webhooks.listAudit({ page: 2, pageSize: 2 });

    expect(page.hasNext).toBe(true);
    expect(page.hasPrevious).toBe(true);
    expect(page.pageNumber).toBe(2);
    expect(page.pageSize).toBe(2);
    expect(page.totalCount).toBe(7);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]).toEqual({
      id: firstId,
      type: WebHookType.Order,
      request: '{"id_pedido":"abc","enum_status":9,"status":"Comprado"}',
      response: '{"ok":true}',
      statusCode: 200,
      createdAt: '2026-09-01T10:00:00-03:00',
    });
    expect(page.items[1]?.id).toBe(secondId);
    expect(page.items[1]?.type).toBe(WebHookType.Unknown);
  });

  it('maps an error response through the error pipeline', async () => {
    stubTokenEndpoint();

    server.use(
      http.get(`${BASE_URL}/v1/webhooks/auditoria`, () =>
        HttpResponse.json({ tipo: 'WebHook.NotFound', detalhe: 'Não encontrado.' }, { status: 404 }),
      ),
    );

    const error = await newClient()
      .webhooks.listAudit()
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ParceleMaisApiError);
    expect((error as ParceleMaisApiError).statusCode).toBe(404);
  });
});

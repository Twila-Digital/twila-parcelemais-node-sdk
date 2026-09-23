import { randomUUID } from 'node:crypto';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  BankAccountType,
  DisbursementModel,
  ParceleMaisApiError,
  ParceleMaisClient,
  type CreateEstablishmentRequest,
  type EstablishmentAddress,
} from '../../src';

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

function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

const address: EstablishmentAddress = {
  street: 'Rua Exemplo',
  number: '100',
  district: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310100',
};

function createRequest(withAddress = true): CreateEstablishmentRequest {
  return {
    document: '12345678000199',
    legalName: 'Loja Centro LTDA',
    tradeName: 'Loja Centro',
    disbursementModel: DisbursementModel.EstablishmentChain,
    owner: { name: 'Maria Souza', email: 'maria@loja.com.br', phone: '+5511999998888' },
    bankAccount: {
      bankNumber: '341',
      agencyNumber: '1234',
      accountNumber: '56789',
      accountDigit: '0',
      accountType: BankAccountType.Current,
    },
    address: withAddress ? address : undefined,
  };
}

function establishmentJson(establishmentId: string): Record<string, unknown> {
  return {
    estabelecimentoId: establishmentId,
    documento: '12345678000199',
    razaoSocial: 'Loja Centro LTDA',
    nomeFantasia: 'Loja Centro',
    ativa: true,
    modeloDesembolso: 1,
    responsavel: { nome: 'Maria Souza', email: 'maria@loja.com.br', celular: '+5511999998888' },
    contaBancaria: {
      banco: '341',
      agencia: '1234',
      digitoAgencia: '',
      conta: '56789',
      digitoConta: '0',
      tipoConta: 1,
      nomeTitular: null,
      documentoTitular: null,
    },
    endereco: {
      rua: 'Rua Exemplo',
      numero: '100',
      complemento: null,
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310100',
      pais: 'Brasil',
    },
  };
}

describe('EstablishmentsClient (MSW)', () => {
  it('sends the wire body on create and returns the id', async () => {
    stubTokenEndpoint();
    const establishmentId = randomUUID();
    let body: Record<string, unknown> | undefined;

    server.use(
      http.post(`${BASE_URL}/v1/establishment`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ estabelecimentoId: establishmentId });
      }),
    );

    const result = await newClient().establishments.create(createRequest());

    expect(result.establishmentId).toBe(establishmentId);
    expect(body?.documento).toBe('12345678000199');
    expect(body?.razaoSocial).toBe('Loja Centro LTDA');
    expect(body?.modeloDesembolso).toBe(1);
    expect(asRecord(body?.responsavel).celular).toBe('+5511999998888');
    expect(asRecord(body?.contaBancaria).tipoConta).toBe(1);
    expect(asRecord(body?.endereco).cep).toBe('01310100');
  });

  it('omits the address when none is provided', async () => {
    stubTokenEndpoint();
    let body: Record<string, unknown> | undefined;

    server.use(
      http.post(`${BASE_URL}/v1/establishment`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ estabelecimentoId: randomUUID() });
      }),
    );

    await newClient().establishments.create(createRequest(false));

    expect(body).not.toHaveProperty('endereco');
  });

  it('maps the establishment on get', async () => {
    stubTokenEndpoint();
    const establishmentId = randomUUID();

    server.use(
      http.get(`${BASE_URL}/v1/establishment/${establishmentId}`, () =>
        HttpResponse.json(establishmentJson(establishmentId)),
      ),
    );

    const establishment = await newClient().establishments.get(establishmentId);

    expect(establishment.tradeName).toBe('Loja Centro');
    expect(establishment.isActive).toBe(true);
    expect(establishment.disbursementModel).toBe(DisbursementModel.EstablishmentChain);
    expect(establishment.owner.phone).toBe('+5511999998888');
    expect(establishment.bankAccount?.accountType).toBe(BankAccountType.Current);
    expect(establishment.address?.city).toBe('São Paulo');
  });

  it('handles an establishment without bank account or address', async () => {
    stubTokenEndpoint();
    const establishmentId = randomUUID();

    server.use(
      http.get(`${BASE_URL}/v1/establishment/${establishmentId}`, () =>
        HttpResponse.json({
          ...establishmentJson(establishmentId),
          ativa: false,
          modeloDesembolso: null,
          contaBancaria: null,
          endereco: null,
        }),
      ),
    );

    const establishment = await newClient().establishments.get(establishmentId);

    expect(establishment.isActive).toBe(false);
    expect(establishment.disbursementModel).toBeUndefined();
    expect(establishment.bankAccount).toBeUndefined();
    expect(establishment.address).toBeUndefined();
  });

  it('builds the query string from the list filters', async () => {
    stubTokenEndpoint();
    let url: URL | undefined;

    server.use(
      http.get(`${BASE_URL}/v1/establishment/list`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json([establishmentJson(randomUUID())]);
      }),
    );

    const establishments = await newClient().establishments.list({ tradeName: 'Centro', isActive: true });

    expect(establishments).toHaveLength(1);
    expect(url?.searchParams.get('nomeFantasia')).toBe('Centro');
    expect(url?.searchParams.get('ativa')).toBe('true');
  });

  it('sends no query string when no filter is given', async () => {
    stubTokenEndpoint();
    let url: URL | undefined;

    server.use(
      http.get(`${BASE_URL}/v1/establishment/list`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );

    await expect(newClient().establishments.list()).resolves.toEqual([]);
    expect(url?.search).toBe('');
  });

  it('sends ativa=false when filtering inactive establishments', async () => {
    stubTokenEndpoint();
    let url: URL | undefined;

    server.use(
      http.get(`${BASE_URL}/v1/establishment/list`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );

    await newClient().establishments.list({ isActive: false });

    expect(url?.searchParams.get('ativa')).toBe('false');
  });

  it('sends only the editable fields on update', async () => {
    stubTokenEndpoint();
    const establishmentId = randomUUID();
    let body: Record<string, unknown> | undefined;

    server.use(
      http.put(`${BASE_URL}/v1/establishment/${establishmentId}`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return new HttpResponse(null, { status: 200 });
      }),
    );

    await newClient().establishments.update(establishmentId, { tradeName: 'Loja Centro Matriz' });

    expect(body?.nomeFantasia).toBe('Loja Centro Matriz');
    expect(body).not.toHaveProperty('contaBancaria');
  });

  it('uses the dedicated endpoint to replace the bank account', async () => {
    stubTokenEndpoint();
    const establishmentId = randomUUID();
    let body: Record<string, unknown> | undefined;

    server.use(
      http.put(`${BASE_URL}/v1/establishment/${establishmentId}/bank-account`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return new HttpResponse(null, { status: 200 });
      }),
    );

    await newClient().establishments.updateBankAccount(establishmentId, {
      bankNumber: '237',
      agencyNumber: '4321',
      accountNumber: '98765',
      accountDigit: '1',
      accountType: BankAccountType.Savings,
    });

    expect(body?.banco).toBe('237');
    expect(body?.tipoConta).toBe(2);
  });

  it('sends ativa true on activate and false on deactivate', async () => {
    stubTokenEndpoint();
    const establishmentId = randomUUID();
    const bodies: Record<string, unknown>[] = [];

    server.use(
      http.put(`${BASE_URL}/v1/establishment/${establishmentId}/status`, async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const client = newClient();
    await client.establishments.deactivate(establishmentId);
    await client.establishments.activate(establishmentId);

    expect(bodies).toEqual([{ ativa: false }, { ativa: true }]);
  });

  it('maps a 409 on create to ParceleMaisApiError', async () => {
    stubTokenEndpoint();

    server.use(
      http.post(`${BASE_URL}/v1/establishment`, () =>
        HttpResponse.json({ tipo: 'Establishment.DocumentAlreadyAdded', detalhe: 'Documento já cadastrado.' }, { status: 409 }),
      ),
    );

    await expect(newClient().establishments.create(createRequest())).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('maps a 404 on get to ParceleMaisApiError', async () => {
    stubTokenEndpoint();
    const establishmentId = randomUUID();

    server.use(
      http.get(`${BASE_URL}/v1/establishment/${establishmentId}`, () =>
        HttpResponse.json({ tipo: 'Establishment.EstablishmentNotFound', detalhe: 'Estabelecimento não encontrado.' }, { status: 404 }),
      ),
    );

    const error = await newClient()
      .establishments.get(establishmentId)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ParceleMaisApiError);
    expect((error as ParceleMaisApiError).statusCode).toBe(404);
  });
});

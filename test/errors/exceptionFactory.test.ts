import { describe, expect, it } from 'vitest';
import { exceptionFromResponse } from '../../src/errors/exceptionFactory';
import { ParceleMaisApiError } from '../../src/errors/ParceleMaisApiError';
import { ParceleMaisAuthenticationError } from '../../src/errors/ParceleMaisAuthenticationError';
import { ParceleMaisRateLimitError } from '../../src/errors/ParceleMaisRateLimitError';
import { ParceleMaisValidationError } from '../../src/errors/ParceleMaisValidationError';
import type { ApiResponse } from '../../src/internal/http/apiResponse';

function responseOf(statusCode: number, body: unknown, headers: Record<string, string> = {}): ApiResponse {
  return { statusCode, body, headers };
}

describe('exceptionFromResponse', () => {
  it('maps 401 to ParceleMaisAuthenticationError', () => {
    const error = exceptionFromResponse(responseOf(401, { detalhe: 'credenciais inválidas' }));
    expect(error).toBeInstanceOf(ParceleMaisAuthenticationError);
    expect(error.message).toBe('credenciais inválidas');
  });

  it('maps 400 with field errors to ParceleMaisValidationError', () => {
    const error = exceptionFromResponse(
      responseOf(400, { detalhe: 'dados inválidos', erros: { cpf: ['obrigatório'] } }),
    );
    expect(error).toBeInstanceOf(ParceleMaisValidationError);
    expect((error as ParceleMaisApiError).fieldErrors).toEqual({ cpf: ['obrigatório'] });
  });

  it('maps 400 without field errors to a generic ParceleMaisApiError', () => {
    const error = exceptionFromResponse(responseOf(400, { detalhe: 'requisição malformada' }));
    expect(error).toBeInstanceOf(ParceleMaisApiError);
    expect(error).not.toBeInstanceOf(ParceleMaisValidationError);
  });

  it('maps 429 to ParceleMaisRateLimitError with retryAfterMs', () => {
    const error = exceptionFromResponse(responseOf(429, { detalhe: 'limite excedido' }, { 'retry-after': '30' }));
    expect(error).toBeInstanceOf(ParceleMaisRateLimitError);
    expect((error as ParceleMaisRateLimitError).retryAfterMs).toBe(30_000);
  });

  it('tolerates an empty or invalid body', () => {
    const error = exceptionFromResponse(responseOf(500, 'não é json'));
    expect(error).toBeInstanceOf(ParceleMaisApiError);
    expect((error as ParceleMaisApiError).statusCode).toBe(500);
  });
});

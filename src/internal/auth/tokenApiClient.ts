import axios, { type AxiosInstance } from 'axios';
import { ParceleMaisAuthenticationError } from '../../errors/ParceleMaisAuthenticationError';
import { exceptionFromResponse } from '../../errors/exceptionFactory';
import type { ApiResponse } from '../http/apiResponse';
import type { GenerateAccessTokenRequestWire, GenerateAccessTokenResponseWire } from '../generated/auth';

export interface TokenApiClient {
  generate(clientId: string, clientSecret: string): Promise<GenerateAccessTokenResponseWire>;
}

export class TokenApiClientImpl implements TokenApiClient {
  private readonly http: AxiosInstance;

  constructor(baseUrl: string, timeoutMs: number) {
    this.http = axios.create({ baseURL: baseUrl, timeout: timeoutMs, validateStatus: () => true });
  }

  async generate(clientId: string, clientSecret: string): Promise<GenerateAccessTokenResponseWire> {
    const body: GenerateAccessTokenRequestWire = { clientId, clientSecret };

    let raw;
    try {
      raw = await this.http.post('v1/authentication/accesstoken', body);
    } catch (error) {
      throw new ParceleMaisAuthenticationError('Falha de rede ao gerar o token de acesso.', error);
    }

    const response: ApiResponse = { statusCode: raw.status, body: raw.data, headers: raw.headers as Record<string, string> };

    if (response.statusCode < 200 || response.statusCode >= 300) throw exceptionFromResponse(response);

    const result = raw.data as GenerateAccessTokenResponseWire | undefined;
    if (!result || !result.token_de_acesso)
      throw new ParceleMaisAuthenticationError('A API do Parcele+ retornou uma resposta vazia ao gerar o token de acesso.');

    return result;
  }
}

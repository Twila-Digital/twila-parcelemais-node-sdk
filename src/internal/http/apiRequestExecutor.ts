import axios, { type AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import type { AccessTokenProvider } from '../auth/accessTokenProvider';
import { requiresIdempotencyKey, isRetrySafe } from '../idempotency/idempotencyClassifier';
import { ResiliencePipeline } from '../resilience/resiliencePipeline';
import type { ParceleMaisResilienceOptions } from '../../config/resilienceOptions';
import { exceptionFromResponse } from '../../errors/exceptionFactory';
import type { ApiResponse } from './apiResponse';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class ApiRequestExecutor {
  private readonly http: AxiosInstance;
  private readonly resilience: ResiliencePipeline;

  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: AccessTokenProvider,
    private readonly resilienceOptions: ParceleMaisResilienceOptions,
  ) {
    this.http = axios.create({ validateStatus: () => true });
    this.resilience = new ResiliencePipeline(resilienceOptions);
  }

  get(path: string): Promise<ApiResponse> {
    return this.send('GET', path, undefined, this.resilienceOptions.attemptTimeoutMs);
  }

  post(path: string, body: unknown, attemptTimeoutMs?: number): Promise<ApiResponse> {
    return this.send('POST', path, body, attemptTimeoutMs ?? this.resilienceOptions.attemptTimeoutMs);
  }

  put(path: string, body: unknown): Promise<ApiResponse> {
    return this.send('PUT', path, body, this.resilienceOptions.attemptTimeoutMs);
  }

  delete(path: string): Promise<ApiResponse> {
    return this.send('DELETE', path, undefined, this.resilienceOptions.attemptTimeoutMs);
  }

  static ensureSuccess(response: ApiResponse): void {
    if (response.statusCode < 200 || response.statusCode >= 300) throw exceptionFromResponse(response);
  }

  private async send(method: HttpMethod, path: string, body: unknown, attemptTimeoutMs: number): Promise<ApiResponse> {
    const idempotencyKey =
      !this.resilienceOptions.disableAutomaticIdempotencyKey && requiresIdempotencyKey(method, path)
        ? randomUUID()
        : undefined;

    const retrySafe = isRetrySafe(method, path, idempotencyKey !== undefined);

    return this.resilience.execute(retrySafe, () => this.sendWithAuth(method, path, body, idempotencyKey, attemptTimeoutMs));
  }

  private async sendWithAuth(
    method: HttpMethod,
    path: string,
    body: unknown,
    idempotencyKey: string | undefined,
    attemptTimeoutMs: number,
  ): Promise<ApiResponse> {
    const token = await this.tokenProvider.getToken();
    const response = await this.sendOnce(method, path, body, idempotencyKey, attemptTimeoutMs, token);

    if (response.statusCode !== 401) return response;

    this.tokenProvider.invalidate();
    const newToken = await this.tokenProvider.getToken();
    const retried = await this.sendOnce(method, path, body, idempotencyKey, attemptTimeoutMs, newToken);

    if (retried.statusCode !== 401) return retried;

    throw exceptionFromResponse(retried);
  }

  private async sendOnce(
    method: HttpMethod,
    path: string,
    body: unknown,
    idempotencyKey: string | undefined,
    attemptTimeoutMs: number,
    token: string,
  ): Promise<ApiResponse> {
    const url = new URL(path, this.baseUrl).toString();

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    const raw = await this.http.request({
      url,
      method,
      data: body,
      headers,
      timeout: attemptTimeoutMs,
    });

    return { statusCode: raw.status, body: raw.data, headers: raw.headers as Record<string, string> };
  }
}

import axios from 'axios';
import type { ApiResponse } from '../http/apiResponse';
import type { ParceleMaisResilienceOptions } from '../../config/resilienceOptions';

const TRANSIENT_STATUS_CODES = new Set([408, 429, 502, 503, 504]);

export function isTransientResponse(response: ApiResponse, options: ParceleMaisResilienceOptions): boolean {
  if (TRANSIENT_STATUS_CODES.has(response.statusCode)) return true;

  return response.statusCode === 500 && options.retryOn500;
}

export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error);
}

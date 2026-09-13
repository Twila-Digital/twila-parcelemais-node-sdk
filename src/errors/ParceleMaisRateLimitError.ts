import { ParceleMaisApiError } from './ParceleMaisApiError';
import type { ProblemDetails } from './problemDetails';

export class ParceleMaisRateLimitError extends ParceleMaisApiError {
  readonly retryAfterMs?: number;

  constructor(message: string, problemDetails: ProblemDetails, retryAfterMs?: number) {
    super(message, 429, problemDetails);
    this.retryAfterMs = retryAfterMs;
  }
}

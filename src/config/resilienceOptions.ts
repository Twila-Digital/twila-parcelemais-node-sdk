export interface ParceleMaisResilienceOptions {
  totalTimeoutMs: number;
  attemptTimeoutMs: number;
  invoiceUploadAttemptTimeoutMs: number;
  maxRetryAttempts: number;
  retryBaseDelayMs: number;
  circuitBreakerFailureRatio: number;
  circuitBreakerSamplingDurationMs: number;
  circuitBreakerMinimumThroughput: number;
  circuitBreakerBreakDurationMs: number;
  retryOn500: boolean;
  disableAutomaticIdempotencyKey: boolean;
}

export const DEFAULT_RESILIENCE_OPTIONS: ParceleMaisResilienceOptions = {
  totalTimeoutMs: 30_000,
  attemptTimeoutMs: 10_000,
  invoiceUploadAttemptTimeoutMs: 60_000,
  maxRetryAttempts: 3,
  retryBaseDelayMs: 500,
  circuitBreakerFailureRatio: 0.5,
  circuitBreakerSamplingDurationMs: 30_000,
  circuitBreakerMinimumThroughput: 10,
  circuitBreakerBreakDurationMs: 15_000,
  retryOn500: false,
  disableAutomaticIdempotencyKey: false,
};

export function resolveResilienceOptions(
  overrides?: Partial<ParceleMaisResilienceOptions>,
): ParceleMaisResilienceOptions {
  return { ...DEFAULT_RESILIENCE_OPTIONS, ...overrides };
}

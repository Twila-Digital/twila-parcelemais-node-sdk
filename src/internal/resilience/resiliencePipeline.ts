import {
  DelegateBackoff,
  SamplingBreaker,
  TimeoutStrategy,
  circuitBreaker,
  handleWhen,
  isBrokenCircuitError,
  isTaskCancelledError,
  retry,
  timeout,
  wrap,
  type CircuitBreakerPolicy,
  type IRetryBackoffContext,
} from 'cockatiel';
import type { ParceleMaisResilienceOptions } from '../../config/resilienceOptions';
import { ParceleMaisTimeoutError } from '../../errors/ParceleMaisTimeoutError';
import type { ApiResponse } from '../http/apiResponse';
import { isNetworkError, isTransientResponse } from './transientFailureClassifier';

export class ResiliencePipeline {
  private readonly circuitBreakerPolicy: CircuitBreakerPolicy;

  constructor(private readonly options: ParceleMaisResilienceOptions) {
    const minimumRps = Math.max(1, options.circuitBreakerMinimumThroughput / (options.circuitBreakerSamplingDurationMs / 1000));

    const breakerBasePolicy = handleWhen(isNetworkError).orWhenResult((result) =>
      isTransientResponse(result as ApiResponse, options),
    );

    this.circuitBreakerPolicy = circuitBreaker(breakerBasePolicy, {
      halfOpenAfter: options.circuitBreakerBreakDurationMs,
      breaker: new SamplingBreaker({
        threshold: options.circuitBreakerFailureRatio,
        duration: options.circuitBreakerSamplingDurationMs,
        minimumRps,
      }),
    });
  }

  async execute(retrySafe: boolean, attempt: () => Promise<ApiResponse>): Promise<ApiResponse> {
    const retryPolicy = this.buildRetryPolicy(retrySafe);
    const totalTimeoutPolicy = timeout(this.options.totalTimeoutMs, TimeoutStrategy.Aggressive);
    const pipeline = wrap(totalTimeoutPolicy, retryPolicy, this.circuitBreakerPolicy);

    try {
      return await pipeline.execute(() => attempt());
    } catch (error) {
      if (isBrokenCircuitError(error))
        throw new ParceleMaisTimeoutError(
          'O circuit breaker está aberto — chamadas recentes falharam de forma consistente.',
          error,
        );

      if (isTaskCancelledError(error))
        throw new ParceleMaisTimeoutError('A requisição excedeu o tempo limite configurado.', error);

      throw error;
    }
  }

  private buildRetryPolicy(retrySafe: boolean) {
    const basePolicy = handleWhen(isNetworkError).orWhenResult(
      (result) => retrySafe && isTransientResponse(result as ApiResponse, this.options),
    );

    const baseDelayMs = this.options.retryBaseDelayMs;

    const backoff = new DelegateBackoff<IRetryBackoffContext<ApiResponse | unknown>>((context) => {
      const { result } = context;

      if ('value' in result) {
        const retryAfterMs = retryAfterFromResponse(result.value as ApiResponse);
        if (retryAfterMs !== undefined) return retryAfterMs;
      }

      const exponential = baseDelayMs * 2 ** Math.max(0, context.attempt - 1);
      const jitterFactor = 0.5 + Math.random();
      return Math.round(exponential * jitterFactor);
    });

    return retry(basePolicy, { maxAttempts: Math.max(0, this.options.maxRetryAttempts - 1), backoff });
  }
}

function retryAfterFromResponse(response: ApiResponse): number | undefined {
  const retryAfter = response.headers?.['retry-after'];
  if (!retryAfter) return undefined;

  const seconds = Number(retryAfter);
  return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

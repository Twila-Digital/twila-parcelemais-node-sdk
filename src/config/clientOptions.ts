import { ParceleMaisConfigurationError } from '../errors/ParceleMaisConfigurationError';
import { ParceleMaisEnvironment, environmentBaseUrl } from './environment';
import { DEFAULT_RESILIENCE_OPTIONS, resolveResilienceOptions, type ParceleMaisResilienceOptions } from './resilienceOptions';

export interface ParceleMaisClientOptions {
  clientId: string;
  clientSecret: string;
  environment?: ParceleMaisEnvironment;
  baseUrl?: string;
  resilience?: Partial<ParceleMaisResilienceOptions>;
}

export interface ResolvedParceleMaisClientOptions {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  resilience: ParceleMaisResilienceOptions;
}

export function resolveClientOptions(options: ParceleMaisClientOptions): ResolvedParceleMaisClientOptions {
  validate(options);

  const resilience = resolveResilienceOptions(options.resilience);
  const baseUrl = resolveBaseUrl(options);

  return { clientId: options.clientId, clientSecret: options.clientSecret, baseUrl, resilience };
}

function resolveBaseUrl(options: ParceleMaisClientOptions): string {
  const raw = options.baseUrl ?? environmentBaseUrl(options.environment ?? ParceleMaisEnvironment.Production);
  return raw.endsWith('/') ? raw : `${raw}/`;
}

function validate(options: ParceleMaisClientOptions): void {
  if (isBlank(options.clientId)) throw new ParceleMaisConfigurationError('clientId é obrigatório.');
  if (isBlank(options.clientSecret)) throw new ParceleMaisConfigurationError('clientSecret é obrigatório.');

  if (options.baseUrl !== undefined) {
    try {
      new URL(options.baseUrl);
    } catch {
      throw new ParceleMaisConfigurationError('baseUrl, quando informada, deve ser uma URL absoluta válida.');
    }
  }

  const resilience = { ...DEFAULT_RESILIENCE_OPTIONS, ...options.resilience };

  if (resilience.maxRetryAttempts < 1)
    throw new ParceleMaisConfigurationError('resilience.maxRetryAttempts deve ser maior ou igual a 1.');

  if (resilience.totalTimeoutMs <= 0) throw new ParceleMaisConfigurationError('resilience.totalTimeoutMs deve ser maior que zero.');

  if (resilience.attemptTimeoutMs <= 0)
    throw new ParceleMaisConfigurationError('resilience.attemptTimeoutMs deve ser maior que zero.');

  if (resilience.attemptTimeoutMs > resilience.totalTimeoutMs)
    throw new ParceleMaisConfigurationError('resilience.attemptTimeoutMs não pode ser maior que resilience.totalTimeoutMs.');

  if (resilience.circuitBreakerFailureRatio <= 0 || resilience.circuitBreakerFailureRatio > 1)
    throw new ParceleMaisConfigurationError(
      'resilience.circuitBreakerFailureRatio deve estar entre 0 (exclusivo) e 1 (inclusivo).',
    );

  if (resilience.circuitBreakerMinimumThroughput < 2)
    throw new ParceleMaisConfigurationError('resilience.circuitBreakerMinimumThroughput deve ser maior ou igual a 2.');
}

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

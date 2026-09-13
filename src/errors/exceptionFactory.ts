import type { ApiResponse } from '../internal/http/apiResponse';
import { ParceleMaisApiError } from './ParceleMaisApiError';
import { ParceleMaisAuthenticationError } from './ParceleMaisAuthenticationError';
import { ParceleMaisRateLimitError } from './ParceleMaisRateLimitError';
import { ParceleMaisValidationError } from './ParceleMaisValidationError';
import type { ParceleMaisError } from './ParceleMaisError';
import { parseProblemDetails } from './problemDetails';

export function exceptionFromResponse(response: ApiResponse): ParceleMaisError {
  const problemDetails = parseProblemDetails(response.body);
  const message = problemDetails.detail ?? problemDetails.title ?? `A API do Parcele+ retornou ${response.statusCode}.`;

  if (response.statusCode === 401) return new ParceleMaisAuthenticationError(message);

  if (response.statusCode === 400 && problemDetails.errors && Object.keys(problemDetails.errors).length > 0)
    return new ParceleMaisValidationError(message, problemDetails);

  if (response.statusCode === 429) return new ParceleMaisRateLimitError(message, problemDetails, retryAfterMs(response));

  return new ParceleMaisApiError(message, response.statusCode, problemDetails);
}

function retryAfterMs(response: ApiResponse): number | undefined {
  const retryAfter = response.headers['retry-after'];
  if (!retryAfter) return undefined;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return seconds * 1000;

  const date = new Date(retryAfter);
  if (Number.isNaN(date.getTime())) return undefined;

  return Math.max(0, date.getTime() - Date.now());
}

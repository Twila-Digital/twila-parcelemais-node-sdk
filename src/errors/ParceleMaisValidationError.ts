import { ParceleMaisApiError } from './ParceleMaisApiError';
import type { ProblemDetails } from './problemDetails';

export class ParceleMaisValidationError extends ParceleMaisApiError {
  constructor(message: string, problemDetails: ProblemDetails) {
    super(message, 400, problemDetails);
  }
}

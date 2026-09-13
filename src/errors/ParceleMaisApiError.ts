import { ParceleMaisError } from './ParceleMaisError';
import type { ProblemDetails } from './problemDetails';

export class ParceleMaisApiError extends ParceleMaisError {
  readonly statusCode: number;
  readonly problemDetails: ProblemDetails;

  constructor(message: string, statusCode: number, problemDetails: ProblemDetails) {
    super(message);
    this.statusCode = statusCode;
    this.problemDetails = problemDetails;
  }

  get errorCode(): string | undefined {
    return this.problemDetails.type;
  }

  get fieldErrors(): Record<string, string[]> | undefined {
    return this.problemDetails.errors;
  }

  get correlationId(): string | undefined {
    return this.problemDetails.correlationId;
  }
}

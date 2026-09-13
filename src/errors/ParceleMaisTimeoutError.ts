import { ParceleMaisError } from './ParceleMaisError';

export class ParceleMaisTimeoutError extends ParceleMaisError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

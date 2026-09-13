import { ParceleMaisError } from './ParceleMaisError';

export class ParceleMaisAuthenticationError extends ParceleMaisError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

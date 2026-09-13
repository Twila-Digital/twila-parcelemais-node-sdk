import { ParceleMaisError } from './ParceleMaisError';

export class ParceleMaisConfigurationError extends ParceleMaisError {
  constructor(message: string) {
    super(message);
  }
}

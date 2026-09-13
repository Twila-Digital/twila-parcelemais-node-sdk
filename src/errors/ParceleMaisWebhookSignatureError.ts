import { ParceleMaisError } from './ParceleMaisError';

export class ParceleMaisWebhookSignatureError extends ParceleMaisError {
  constructor(message: string) {
    super(message);
  }
}

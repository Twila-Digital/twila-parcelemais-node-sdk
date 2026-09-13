import { describe, expect, it } from 'vitest';
import { ParceleMaisClient } from '../../src';
import { ParceleMaisConfigurationError } from '../../src/errors';

describe('ParceleMaisClient configuration', () => {
  it('requires clientId', () => {
    expect(() => new ParceleMaisClient({ clientId: '', clientSecret: 'secret' })).toThrow(ParceleMaisConfigurationError);
  });

  it('requires clientSecret', () => {
    expect(() => new ParceleMaisClient({ clientId: 'id', clientSecret: '' })).toThrow(ParceleMaisConfigurationError);
  });

  it('rejects an invalid baseUrl', () => {
    expect(() => new ParceleMaisClient({ clientId: 'id', clientSecret: 'secret', baseUrl: 'not-a-url' })).toThrow(
      ParceleMaisConfigurationError,
    );
  });

  it('rejects attemptTimeoutMs greater than totalTimeoutMs', () => {
    expect(
      () =>
        new ParceleMaisClient({
          clientId: 'id',
          clientSecret: 'secret',
          resilience: { totalTimeoutMs: 1000, attemptTimeoutMs: 2000 },
        }),
    ).toThrow(ParceleMaisConfigurationError);
  });

  it('rejects maxRetryAttempts below 1', () => {
    expect(
      () => new ParceleMaisClient({ clientId: 'id', clientSecret: 'secret', resilience: { maxRetryAttempts: 0 } }),
    ).toThrow(ParceleMaisConfigurationError);
  });

  it('builds successfully with valid configuration', () => {
    const client = new ParceleMaisClient({ clientId: 'id', clientSecret: 'secret' });
    expect(client.orders).toBeDefined();
    expect(client.simulations).toBeDefined();
    expect(client.customers).toBeDefined();
    expect(client.webhooks).toBeDefined();
  });
});

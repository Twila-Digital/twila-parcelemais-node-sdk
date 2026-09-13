import { describe, expect, it } from 'vitest';
import { isRetrySafe, requiresIdempotencyKey } from '../../src/internal/idempotency/idempotencyClassifier';

describe('idempotencyClassifier', () => {
  it('GET is always retry-safe', () => {
    expect(isRetrySafe('GET', 'v1/order/paged', false)).toBe(true);
  });

  it('POST to v1/order requires an idempotency key', () => {
    expect(requiresIdempotencyKey('POST', 'v1/order')).toBe(true);
  });

  it('GET to simulate-installments does not require an idempotency key', () => {
    expect(requiresIdempotencyKey('GET', 'v1/order/simulate-installments')).toBe(false);
  });

  it('POST to v1/order is retry-safe only when an idempotency key is present', () => {
    expect(isRetrySafe('POST', 'v1/order', true)).toBe(true);
    expect(isRetrySafe('POST', 'v1/order', false)).toBe(false);
  });

  it('PUT and DELETE on webhooks are retry-safe', () => {
    expect(isRetrySafe('PUT', 'v1/webhooks/3', false)).toBe(true);
    expect(isRetrySafe('DELETE', 'v1/webhooks/3', false)).toBe(true);
  });

  it('PUT on order is not retry-safe', () => {
    expect(isRetrySafe('PUT', 'v1/order/123', false)).toBe(false);
  });
});

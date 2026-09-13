import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ParceleMaisWebhookSignatureError } from '../../src/errors/ParceleMaisWebhookSignatureError';
import { OrderStatus } from '../../src/orders/types';
import { computeWebhookSignature, parseWebhookEvent } from '../../src/webhooks/webhookEvent';

const SIGNING_SECRET = 'segredo-de-teste';

function payload(): string {
  return JSON.stringify({ id_pedido: randomUUID(), enum_status: 9, status: 'Comprado' });
}

describe('parseWebhookEvent', () => {
  it('parses without signature verification', () => {
    const raw = payload();
    const event = parseWebhookEvent(raw);

    expect(event.status).toBe(OrderStatus.Purchased);
    expect(event.statusRaw).toBe(9);
    expect(event.statusName).toBe('Comprado');
  });

  it('falls back to Unknown for an unrecognized status', () => {
    const raw = JSON.stringify({ id_pedido: randomUUID(), enum_status: 9999, status: 'Algo novo' });
    const event = parseWebhookEvent(raw);

    expect(event.status).toBe(OrderStatus.Unknown);
    expect(event.statusRaw).toBe(9999);
  });

  it('accepts a valid signature', () => {
    const raw = payload();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = computeWebhookSignature(SIGNING_SECRET, timestamp, raw);
    const header = `t=${timestamp},v1=${signature}`;

    const event = parseWebhookEvent(raw, header, SIGNING_SECRET);
    expect(event.status).toBe(OrderStatus.Purchased);
  });

  it('rejects an invalid signature', () => {
    const raw = payload();
    const timestamp = Math.floor(Date.now() / 1000);
    const header = `t=${timestamp},v1=${'0'.repeat(64)}`;

    expect(() => parseWebhookEvent(raw, header, SIGNING_SECRET)).toThrow(ParceleMaisWebhookSignatureError);
  });

  it('rejects a tampered payload', () => {
    const raw = payload();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = computeWebhookSignature(SIGNING_SECRET, timestamp, raw);
    const header = `t=${timestamp},v1=${signature}`;

    const tampered = raw.replace('Comprado', 'Cancelado');

    expect(() => parseWebhookEvent(tampered, header, SIGNING_SECRET)).toThrow(ParceleMaisWebhookSignatureError);
  });

  it('rejects an expired timestamp', () => {
    const raw = payload();
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const signature = computeWebhookSignature(SIGNING_SECRET, oldTimestamp, raw);
    const header = `t=${oldTimestamp},v1=${signature}`;

    expect(() => parseWebhookEvent(raw, header, SIGNING_SECRET)).toThrow(ParceleMaisWebhookSignatureError);
  });

  it('rejects a malformed signature header', () => {
    expect(() => parseWebhookEvent(payload(), 'não é um header válido', SIGNING_SECRET)).toThrow(
      ParceleMaisWebhookSignatureError,
    );
  });
});

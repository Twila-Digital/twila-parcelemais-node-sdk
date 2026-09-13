import { createHmac, timingSafeEqual } from 'node:crypto';
import { ParceleMaisWebhookSignatureError } from '../errors/ParceleMaisWebhookSignatureError';
import type { OrderWebhookEventWire } from '../internal/generated/webhook';
import { orderStatusFromWireValue } from '../orders/types';
import type { OrderWebhookEvent } from './types';

const REPLAY_TOLERANCE_MS = 5 * 60 * 1000;
const HMAC_ALGORITHM = 'sha256';

export function parseWebhookEvent(rawJson: string, signatureHeader?: string, signingSecret?: string): OrderWebhookEvent {
  if (signatureHeader !== undefined && signingSecret !== undefined) verifySignature(rawJson, signatureHeader, signingSecret);

  let wire: OrderWebhookEventWire;
  try {
    wire = JSON.parse(rawJson) as OrderWebhookEventWire;
  } catch {
    throw new ParceleMaisWebhookSignatureError('O corpo do webhook está vazio ou não é um JSON válido.');
  }

  if (!wire || typeof wire !== 'object')
    throw new ParceleMaisWebhookSignatureError('O corpo do webhook está vazio ou não é um JSON válido.');

  return {
    orderId: wire.id_pedido,
    status: orderStatusFromWireValue(wire.enum_status),
    statusRaw: wire.enum_status,
    statusName: wire.status,
  };
}

export function computeWebhookSignature(signingSecret: string, timestampSeconds: number, payload: string): string {
  const signedContent = `${timestampSeconds}.${payload}`;
  return createHmac(HMAC_ALGORITHM, signingSecret).update(signedContent, 'utf8').digest('hex');
}

function verifySignature(rawJson: string, signatureHeader: string, signingSecret: string): void {
  const { timestamp, signature } = parseSignatureHeader(signatureHeader);
  const computed = computeWebhookSignature(signingSecret, timestamp, rawJson);

  const computedBuffer = Buffer.from(computed, 'utf8');
  const expectedBuffer = Buffer.from(signature, 'utf8');

  const signaturesMatch =
    computedBuffer.length === expectedBuffer.length && timingSafeEqual(computedBuffer, expectedBuffer);

  if (!signaturesMatch) throw new ParceleMaisWebhookSignatureError('A assinatura do webhook não confere.');

  const eventTimeMs = timestamp * 1000;
  if (Math.abs(Date.now() - eventTimeMs) > REPLAY_TOLERANCE_MS)
    throw new ParceleMaisWebhookSignatureError('O timestamp do webhook está fora da janela de tolerância — possível replay.');
}

function parseSignatureHeader(signatureHeader: string): { timestamp: number; signature: string } {
  let timestamp: number | undefined;
  let signature: string | undefined;

  for (const part of signatureHeader.split(',')) {
    const [key, ...rest] = part.split('=');
    const value = rest.join('=').trim();

    if (key?.trim() === 't') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) timestamp = parsed;
    } else if (key?.trim() === 'v1') {
      signature = value.toLowerCase();
    }
  }

  if (timestamp === undefined || signature === undefined)
    throw new ParceleMaisWebhookSignatureError(`Cabeçalho de assinatura malformado: '${signatureHeader}'.`);

  return { timestamp, signature };
}

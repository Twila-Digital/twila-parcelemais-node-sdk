// Smoke test sem framework de teste (vitest exige Node >=22.12).
import assert from 'node:assert';
import {
  ParceleMaisClient,
  ParceleMaisEnvironment,
  ParceleMaisConfigurationError,
  OrderStatus,
  parseWebhookEvent,
  computeWebhookSignature,
} from '../dist/index.mjs';

function assertThrows(fn, expectedType, label) {
  try {
    fn();
    throw new Error(`esperava que '${label}' lançasse ${expectedType.name}, mas não lançou nada`);
  } catch (error) {
    assert.ok(error instanceof expectedType, `'${label}' lançou ${error.constructor.name}, esperava ${expectedType.name}`);
  }
}

const client = new ParceleMaisClient({
  clientId: 'client-id',
  clientSecret: 'client-secret',
  environment: ParceleMaisEnvironment.Staging,
});

assert.strictEqual(typeof client.orders.create, 'function');
assert.strictEqual(typeof client.simulations.simulateInstallments, 'function');
assert.strictEqual(typeof client.customers.get, 'function');
assert.strictEqual(typeof client.webhooks.create, 'function');

assertThrows(() => new ParceleMaisClient({ clientId: '', clientSecret: 'x' }), ParceleMaisConfigurationError, 'clientId vazio');

assert.strictEqual(OrderStatus.Purchased, 9);

const secret = 'segredo-de-teste';
const payload = JSON.stringify({ id_pedido: 'abc-123', enum_status: 9, status: 'Comprado' });
const timestamp = Math.floor(Date.now() / 1000);
const signature = computeWebhookSignature(secret, timestamp, payload);
const event = parseWebhookEvent(payload, `t=${timestamp},v1=${signature}`, secret);

assert.strictEqual(event.orderId, 'abc-123');
assert.strictEqual(event.status, OrderStatus.Purchased);

console.log(`OK — @twila/parcelemais (dist/index.mjs) funcionando em Node ${process.version}`);

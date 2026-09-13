const MUTABLE_PATHS_REQUIRING_IDEMPOTENCY_KEY = [
  'v1/order/start-cdc-sale',
  'v1/order/invoice',
  'v1/order',
  'v1/webhooks',
];

export function requiresIdempotencyKey(method: string, path: string): boolean {
  if (method.toUpperCase() !== 'POST') return false;

  return MUTABLE_PATHS_REQUIRING_IDEMPOTENCY_KEY.some((mutablePath) => path.endsWith(mutablePath));
}

export function isRetrySafe(method: string, path: string, hasIdempotencyKey: boolean): boolean {
  const upperMethod = method.toUpperCase();

  if (upperMethod === 'GET' || upperMethod === 'HEAD' || upperMethod === 'OPTIONS') return true;

  if (upperMethod === 'PUT' || upperMethod === 'DELETE') return path.includes('v1/webhooks/');

  if (upperMethod !== 'POST') return false;

  return requiresIdempotencyKey(method, path) && hasIdempotencyKey;
}

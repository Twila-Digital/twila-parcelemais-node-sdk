const SWAGGER_URL = 'https://api.staging.parcelemais.com.br/integration/swagger/v1/swagger.json';

let cached: Record<string, unknown> | undefined;

export async function fetchStagingSchema(): Promise<Record<string, unknown>> {
  if (cached) return cached;

  const response = await fetch(SWAGGER_URL, { signal: AbortSignal.timeout(30_000) });

  if (!response.ok) throw new Error(`Falha ao buscar o swagger.json de staging: HTTP ${response.status}`);

  cached = (await response.json()) as Record<string, unknown>;
  return cached;
}

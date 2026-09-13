import { describe, expect, it } from 'vitest';
import { fetchStagingSchema } from './openApiSchemaFixture';

const EXPECTED_PATHS = [
  '/v1/authentication/accesstoken',
  '/v1/order',
  '/v1/order/{id}',
  '/v1/order/paged',
  '/v1/order/start-cdc-sale',
  '/v1/order/invoice',
  '/v1/order/simulate-installments',
  '/v1/order/simulate-values',
  '/v1/customer/{id}',
  '/v1/customer/paged',
  '/v1/webhooks',
  '/v1/webhooks/{type}',
];

function normalize(templatePath: string): string {
  return templatePath.replace(/\{[^}]+}/g, '');
}

function simpleTypeName(schemaKey: string): string {
  const lastDot = schemaKey.lastIndexOf('.');
  return lastDot >= 0 ? schemaKey.slice(lastDot + 1) : schemaKey;
}

describe('wire contract against staging', () => {
  it.each(EXPECTED_PATHS)('endpoint %s exists in the staging schema', async (expectedPath) => {
    const schema = await fetchStagingSchema();
    const paths = Object.keys((schema.paths as Record<string, unknown>) ?? {});

    const matches = paths.some((realPath) => normalize(realPath).endsWith(normalize(expectedPath)));

    expect(matches, `Endpoint '${expectedPath}' não encontrado no swagger.json de staging — o SDK e o backend divergiram.`).toBe(
      true,
    );
  });

  it('order response schema has the fields OrderWire expects', async () => {
    const schema = await fetchStagingSchema();
    const schemas = ((schema.components as Record<string, unknown> | undefined)?.schemas ?? {}) as Record<
      string,
      { properties?: Record<string, unknown> }
    >;

    const orderSchemaEntry = Object.entries(schemas).find(([key]) => simpleTypeName(key) === 'OrderIntegrationResponse');

    expect(orderSchemaEntry, 'Não encontrei o schema OrderIntegrationResponse no swagger.json de staging.').toBeDefined();

    const properties = orderSchemaEntry?.[1].properties ?? {};

    for (const expectedField of ['id', 'numero', 'status', 'documentoCliente', 'criadoEm']) {
      expect(
        expectedField in properties,
        `Campo '${expectedField}' esperado pelo OrderWire não existe (mais) no schema de staging.`,
      ).toBe(true);
    }
  });
});

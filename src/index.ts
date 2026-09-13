import { AccessTokenProviderImpl, type AccessTokenProvider } from './internal/auth/accessTokenProvider';
import { TokenApiClientImpl } from './internal/auth/tokenApiClient';
import { ApiRequestExecutor } from './internal/http/apiRequestExecutor';
import { resolveClientOptions, type ParceleMaisClientOptions } from './config/clientOptions';
import { CustomersClientImpl, type CustomersClient } from './customers/customersClient';
import { OrdersClientImpl, type OrdersClient } from './orders/ordersClient';
import { SimulationsClientImpl, type SimulationsClient } from './simulations/simulationsClient';
import { WebhooksClientImpl, type WebhooksClient } from './webhooks/webhooksClient';

export class ParceleMaisClient {
  readonly orders: OrdersClient;
  readonly simulations: SimulationsClient;
  readonly customers: CustomersClient;
  readonly webhooks: WebhooksClient;

  constructor(options: ParceleMaisClientOptions) {
    const resolved = resolveClientOptions(options);

    const tokenApiClient = new TokenApiClientImpl(resolved.baseUrl, resolved.resilience.attemptTimeoutMs);
    const tokenProvider: AccessTokenProvider = new AccessTokenProviderImpl(
      tokenApiClient,
      resolved.clientId,
      resolved.clientSecret,
    );

    const executor = new ApiRequestExecutor(resolved.baseUrl, tokenProvider, resolved.resilience);

    this.orders = new OrdersClientImpl(executor, resolved.resilience.invoiceUploadAttemptTimeoutMs);
    this.simulations = new SimulationsClientImpl(executor);
    this.customers = new CustomersClientImpl(executor);
    this.webhooks = new WebhooksClientImpl(executor);
  }
}

export { ParceleMaisEnvironment } from './config/environment';
export type { ParceleMaisClientOptions } from './config/clientOptions';
export type { ParceleMaisResilienceOptions } from './config/resilienceOptions';
export type { PagedResult } from './pagedResult';

export * from './errors';

export type { OrdersClient } from './orders/ordersClient';
export {
  OrderStatus,
  orderStatusFromWireValue,
  invoiceFileFromBuffer,
  type Address as OrderAddress,
  type CreateOrderRequest,
  type Order,
  type ListOrdersRequest,
  type CheckoutLink,
  type InvoiceFile,
} from './orders/types';

export type { SimulationsClient } from './simulations/simulationsClient';
export {
  CalculationValueType,
  calculationValueTypeFromWireValue,
  type SimulateInstallmentsRequest,
  type SimulateValuesRequest,
  type InstallmentSimulation,
  type ValuesSimulation,
} from './simulations/types';

export type { CustomersClient } from './customers/customersClient';
export {
  type Address as CustomerAddress,
  type Customer,
  type ListCustomersRequest,
} from './customers/types';

export type { WebhooksClient } from './webhooks/webhooksClient';
export {
  WebHookType,
  webHookTypeFromWireValue,
  WebHookAuthenticationType,
  webHookAuthenticationTypeFromWireValue,
  type Webhook,
  type CreateWebhookRequest,
  type CreateWebhookResult,
  type UpdateWebhookRequest,
  type OrderWebhookEvent,
} from './webhooks/types';
export { parseWebhookEvent, computeWebhookSignature } from './webhooks/webhookEvent';

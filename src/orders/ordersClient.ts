import { ApiRequestExecutor } from '../internal/http/apiRequestExecutor';
import { QueryStringBuilder } from '../internal/http/queryString';
import type { IdentifierResponseWire, LinkPaymentResponseWire, OrderWire, StartCdcSaleRequestWire } from '../internal/generated/order';
import type { PagedResultWire } from '../internal/generated/paged';
import { createOrderRequestToWire, orderToPublic, toIsoString } from '../internal/mapping/orderMapper';
import type { PagedResult } from '../pagedResult';
import type { CheckoutLink, CreateOrderRequest, InvoiceFile, ListOrdersRequest, Order } from './types';

export interface OrdersClient {
  create(request: CreateOrderRequest): Promise<string>;
  get(orderId: string): Promise<Order>;
  list(request?: ListOrdersRequest): Promise<PagedResult<Order>>;
  startCdcSale(orderId: string): Promise<CheckoutLink>;
  importInvoice(orderId: string, file: InvoiceFile): Promise<void>;
}

export class OrdersClientImpl implements OrdersClient {
  constructor(
    private readonly executor: ApiRequestExecutor,
    private readonly invoiceUploadAttemptTimeoutMs: number,
  ) {}

  async create(request: CreateOrderRequest): Promise<string> {
    const wireRequest = createOrderRequestToWire(request);
    const response = await this.executor.post('v1/order', wireRequest);
    ApiRequestExecutor.ensureSuccess(response);

    return (response.body as IdentifierResponseWire).pedidoId;
  }

  async get(orderId: string): Promise<Order> {
    const response = await this.executor.get(`v1/order/${orderId}`);
    ApiRequestExecutor.ensureSuccess(response);

    return orderToPublic(response.body as OrderWire);
  }

  async list(request: ListOrdersRequest = {}): Promise<PagedResult<Order>> {
    const path = new QueryStringBuilder()
      .add('status', request.status)
      .add('documentoCliente', request.customerDocument)
      .add('dataInicio', request.startDate !== undefined ? toIsoString(request.startDate) : undefined)
      .add('dataFim', request.endDate !== undefined ? toIsoString(request.endDate) : undefined)
      .add('numero', request.number)
      .add('documentoLoja', request.establishmentDocument)
      .add('descricao', request.description)
      .add('pagina', request.page ?? 1)
      .add('tamanhoPagina', request.pageSize ?? 10)
      .build('v1/order/paged');

    const response = await this.executor.get(path);
    ApiRequestExecutor.ensureSuccess(response);

    const wire = response.body as PagedResultWire<OrderWire>;
    return {
      items: wire.itens.map(orderToPublic),
      hasNext: wire.pagina.tem_proximo,
      hasPrevious: wire.pagina.tem_anterior,
      pageNumber: wire.pagina.numero,
      pageSize: wire.pagina.tamanho,
      totalCount: wire.pagina.total,
    };
  }

  async startCdcSale(orderId: string): Promise<CheckoutLink> {
    const wireRequest: StartCdcSaleRequestWire = { pedidoId: orderId };
    const response = await this.executor.post('v1/order/start-cdc-sale', wireRequest);
    ApiRequestExecutor.ensureSuccess(response);

    return { url: (response.body as LinkPaymentResponseWire).linkPagamento };
  }

  async importInvoice(orderId: string, file: InvoiceFile): Promise<void> {
    const wireRequest = { pedidoId: orderId, arquivoBase64: file.base64Content, nomeArquivo: file.fileName };
    const response = await this.executor.post('v1/order/invoice', wireRequest, this.invoiceUploadAttemptTimeoutMs);
    ApiRequestExecutor.ensureSuccess(response);
  }
}

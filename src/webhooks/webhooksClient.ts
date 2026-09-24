import { ApiRequestExecutor } from '../internal/http/apiRequestExecutor';
import { QueryStringBuilder } from '../internal/http/queryString';
import type { CreateWebHookResponseWire, WebHookAuditWire, WebHookWire } from '../internal/generated/webhook';
import type { PagedResultWire } from '../internal/generated/paged';
import { toIsoString } from '../internal/mapping/orderMapper';
import {
  createWebhookRequestToWire,
  updateWebhookRequestToWire,
  webhookAuditToPublic,
  webhookToPublic,
} from '../internal/mapping/webHookMapper';
import type { PagedResult } from '../pagedResult';
import type {
  CreateWebhookRequest,
  CreateWebhookResult,
  ListWebhookAuditRequest,
  UpdateWebhookRequest,
  WebHookType,
  Webhook,
  WebhookAudit,
} from './types';

export interface WebhooksClient {
  create(request: CreateWebhookRequest): Promise<CreateWebhookResult>;
  list(): Promise<Webhook[]>;
  update(type: WebHookType, request: UpdateWebhookRequest): Promise<void>;
  delete(type: WebHookType): Promise<void>;
  listAudit(request?: ListWebhookAuditRequest): Promise<PagedResult<WebhookAudit>>;
}

export class WebhooksClientImpl implements WebhooksClient {
  constructor(private readonly executor: ApiRequestExecutor) {}

  async create(request: CreateWebhookRequest): Promise<CreateWebhookResult> {
    const wireRequest = createWebhookRequestToWire(request);
    const response = await this.executor.post('v1/webhooks', wireRequest);
    ApiRequestExecutor.ensureSuccess(response);

    return { signingSecret: (response.body as CreateWebHookResponseWire).chaveAssinatura };
  }

  async list(): Promise<Webhook[]> {
    const response = await this.executor.get('v1/webhooks');
    ApiRequestExecutor.ensureSuccess(response);

    return (response.body as WebHookWire[]).map(webhookToPublic);
  }

  async update(type: WebHookType, request: UpdateWebhookRequest): Promise<void> {
    const wireRequest = updateWebhookRequestToWire(request);
    const response = await this.executor.put(`v1/webhooks/${type}`, wireRequest);
    ApiRequestExecutor.ensureSuccess(response);
  }

  async delete(type: WebHookType): Promise<void> {
    const response = await this.executor.delete(`v1/webhooks/${type}`);
    ApiRequestExecutor.ensureSuccess(response);
  }

  async listAudit(request: ListWebhookAuditRequest = {}): Promise<PagedResult<WebhookAudit>> {
    const path = new QueryStringBuilder()
      .add('dataInicio', request.startDate !== undefined ? toIsoString(request.startDate) : undefined)
      .add('dataFim', request.endDate !== undefined ? toIsoString(request.endDate) : undefined)
      .add('pedidoId', request.orderId)
      .add('numeroPedido', request.orderNumber)
      .add('statusCode', request.statusCode)
      .add('pagina', request.page ?? 1)
      .add('tamanhoPagina', request.pageSize ?? 10)
      .build('v1/webhooks/auditoria');

    const response = await this.executor.get(path);
    ApiRequestExecutor.ensureSuccess(response);

    const wire = response.body as PagedResultWire<WebHookAuditWire>;
    return {
      items: wire.itens.map(webhookAuditToPublic),
      hasNext: wire.pagina.tem_proximo,
      hasPrevious: wire.pagina.tem_anterior,
      pageNumber: wire.pagina.numero,
      pageSize: wire.pagina.tamanho,
      totalCount: wire.pagina.total,
    };
  }
}

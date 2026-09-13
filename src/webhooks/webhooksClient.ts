import { ApiRequestExecutor } from '../internal/http/apiRequestExecutor';
import type { CreateWebHookResponseWire, WebHookWire } from '../internal/generated/webhook';
import { createWebhookRequestToWire, updateWebhookRequestToWire, webhookToPublic } from '../internal/mapping/webHookMapper';
import type { CreateWebhookRequest, CreateWebhookResult, UpdateWebhookRequest, WebHookType, Webhook } from './types';

export interface WebhooksClient {
  create(request: CreateWebhookRequest): Promise<CreateWebhookResult>;
  list(): Promise<Webhook[]>;
  update(type: WebHookType, request: UpdateWebhookRequest): Promise<void>;
  delete(type: WebHookType): Promise<void>;
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
}

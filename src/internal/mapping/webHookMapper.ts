import type { CreateWebHookRequestWire, UpdateWebHookRequestWire, WebHookAuditWire, WebHookWire } from '../generated/webhook';
import type { CreateWebhookRequest, UpdateWebhookRequest, Webhook, WebhookAudit } from '../../webhooks/types';
import { webHookAuthenticationTypeFromWireValue, webHookTypeFromWireValue } from '../../webhooks/types';

export function webhookToPublic(wire: WebHookWire): Webhook {
  return {
    type: webHookTypeFromWireValue(wire.tipo),
    url: wire.url,
    authenticationType: webHookAuthenticationTypeFromWireValue(wire.tipoAutenticacao),
  };
}

export function webhookAuditToPublic(wire: WebHookAuditWire): WebhookAudit {
  return {
    id: wire.id,
    type: webHookTypeFromWireValue(wire.tipo),
    request: wire.requisicao,
    response: wire.resposta,
    statusCode: wire.statusCode,
    createdAt: wire.dataCriacao,
  };
}

export function createWebhookRequestToWire(request: CreateWebhookRequest): CreateWebHookRequestWire {
  return { tipo: request.type, url: request.url, tipoAutenticacao: request.authenticationType, credencial: request.credential };
}

export function updateWebhookRequestToWire(request: UpdateWebhookRequest): UpdateWebHookRequestWire {
  return { url: request.url, tipoAutenticacao: request.authenticationType, credencial: request.credential };
}

import { enumFromWireValue } from '../internal/util/enumMapping';
import type { OrderStatus } from '../orders/types';

export enum WebHookType {
  Customer = 1,
  Simulation = 2,
  Order = 3,
  Unknown = -1,
}

export function webHookTypeFromWireValue(value: number): WebHookType {
  return enumFromWireValue(WebHookType, value, WebHookType.Unknown);
}

export enum WebHookAuthenticationType {
  None = 1,
  Basic = 2,
  Jwt = 3,
  Unknown = -1,
}

export function webHookAuthenticationTypeFromWireValue(value: number): WebHookAuthenticationType {
  return enumFromWireValue(WebHookAuthenticationType, value, WebHookAuthenticationType.Unknown);
}

export interface Webhook {
  type: WebHookType;
  url: string;
  authenticationType: WebHookAuthenticationType;
}

export interface CreateWebhookRequest {
  type: WebHookType;
  url: string;
  authenticationType: WebHookAuthenticationType;
  credential?: string;
}

export interface CreateWebhookResult {
  signingSecret: string;
}

export interface UpdateWebhookRequest {
  url: string;
  authenticationType: WebHookAuthenticationType;
  credential?: string;
}

export interface OrderWebhookEvent {
  orderId: string;
  status: OrderStatus;
  statusRaw: number;
  statusName: string;
}

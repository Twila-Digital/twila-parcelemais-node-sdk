export interface CreateWebHookRequestWire {
  tipo: number;
  url: string;
  tipoAutenticacao: number;
  credencial?: string;
}

export interface CreateWebHookResponseWire {
  chaveAssinatura: string;
}

export interface OrderWebhookEventWire {
  id_pedido: string;
  enum_status: number;
  status: string;
}

export interface UpdateWebHookRequestWire {
  url: string;
  tipoAutenticacao: number;
  credencial?: string;
}

export interface WebHookWire {
  tipo: number;
  url: string;
  tipoAutenticacao: number;
}

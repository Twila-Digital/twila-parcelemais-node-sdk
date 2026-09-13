export interface AddressWire {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  complemento?: string;
}

export interface CreateOrderRequestWire {
  cpf: string;
  celular: string;
  documentoEstabelecimento: string;
  valorSolicitado: number;
  nome: string;
  email: string;
  dataDeNascimento: string;
  endereco: AddressWire;
}

export interface IdentifierResponseWire {
  pedidoId: string;
}

export interface ImportOrderInvoiceRequestWire {
  pedidoId: string;
  arquivoBase64: string;
  nomeArquivo: string;
}

export interface LinkPaymentResponseWire {
  linkPagamento?: string;
}

export interface OrderStatusWire {
  valor: number;
  descricao: string;
}

export interface OrderWire {
  id: string;
  numero: number;
  status: OrderStatusWire;
  documentoCliente: string;
  razaoSocialEstabelecimento: string;
  documentoEstabelecimento: string;
  criadoEm: string;
  total?: number;
  nomeCliente?: string;
  prazo?: number;
  descricao?: string;
  valorAprovado?: number;
  desembolsado?: boolean;
  desembolsadoEm?: string;
  valorSolicitado?: number;
}

export interface StartCdcSaleRequestWire {
  pedidoId: string;
}

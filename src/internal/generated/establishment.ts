export interface EstablishmentOwnerWire {
  nome: string;
  email: string;
  celular: string;
}

export interface EstablishmentBankAccountWire {
  banco: string;
  agencia: string;
  digitoAgencia: string;
  conta: string;
  digitoConta: string;
  tipoConta: number;
  nomeTitular?: string;
  documentoTitular?: string;
}

export interface EstablishmentAddressWire {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pais?: string;
}

export interface EstablishmentWire {
  estabelecimentoId: string;
  documento: string;
  razaoSocial: string;
  nomeFantasia: string;
  ativa: boolean;
  modeloDesembolso?: number | null;
  responsavel: EstablishmentOwnerWire;
  contaBancaria?: EstablishmentBankAccountWire | null;
  endereco?: EstablishmentAddressWire | null;
}

export interface CreateEstablishmentRequestWire {
  documento: string;
  razaoSocial: string;
  nomeFantasia: string;
  modeloDesembolso: number;
  responsavel: EstablishmentOwnerWire;
  contaBancaria: EstablishmentBankAccountWire;
  endereco: EstablishmentAddressWire;
}

export interface CreateEstablishmentResponseWire {
  estabelecimentoId: string;
}

export interface UpdateEstablishmentRequestWire {
  nomeFantasia: string;
  modeloDesembolso?: number;
  endereco?: EstablishmentAddressWire;
}

export interface UpdateEstablishmentStatusRequestWire {
  ativa: boolean;
}

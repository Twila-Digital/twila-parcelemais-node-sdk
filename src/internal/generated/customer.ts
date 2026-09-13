export interface CustomerAddressWire {
  rua?: string;
  cidade?: string;
  estado?: string;
  bairro?: string;
  cep?: string;
  pais?: string;
  numero?: string;
  complemento?: string;
}

export interface CustomerWire {
  id: string;
  nome: string;
  documento: string;
  dataDeNascimento: string;
  endereco?: CustomerAddressWire;
  email?: string;
  celular?: string;
}

export interface GenerateAccessTokenRequestWire {
  clientId: string;
  clientSecret: string;
}

export interface GenerateAccessTokenResponseWire {
  token_de_acesso: string;
  expira_em_segundos: number;
  tipo_de_token: string;
}

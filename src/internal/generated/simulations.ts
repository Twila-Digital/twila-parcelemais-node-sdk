export interface SimulateInstallmentWire {
  valorTotalDebito: number;
  prazo: number;
  valorParcela: number;
}

export interface EstablishmentSimulationValuesWire {
  valorVenda: number;
  valorDesembolso: number;
}

export interface CustomerSimulationValuesWire {
  valorParcela: number;
}

export interface SimulationValuesWire {
  valoresEstabelecimento: EstablishmentSimulationValuesWire;
  valoresCliente: CustomerSimulationValuesWire;
}

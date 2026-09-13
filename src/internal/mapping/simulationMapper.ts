import type { SimulateInstallmentWire, SimulationValuesWire } from '../generated/simulations';
import type { InstallmentSimulation, ValuesSimulation } from '../../simulations/types';

export function installmentSimulationToPublic(wire: SimulateInstallmentWire): InstallmentSimulation {
  return { totalAmount: wire.valorTotalDebito, term: wire.prazo, installmentAmount: wire.valorParcela };
}

export function valuesSimulationToPublic(wire: SimulationValuesWire): ValuesSimulation {
  return {
    saleAmount: wire.valoresEstabelecimento.valorVenda,
    disbursementAmount: wire.valoresEstabelecimento.valorDesembolso,
    installmentAmount: wire.valoresCliente.valorParcela,
  };
}

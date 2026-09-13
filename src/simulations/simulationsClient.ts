import { ApiRequestExecutor } from '../internal/http/apiRequestExecutor';
import { QueryStringBuilder } from '../internal/http/queryString';
import type { SimulateInstallmentWire, SimulationValuesWire } from '../internal/generated/simulations';
import { installmentSimulationToPublic, valuesSimulationToPublic } from '../internal/mapping/simulationMapper';
import { CalculationValueType, type InstallmentSimulation, type SimulateInstallmentsRequest, type SimulateValuesRequest, type ValuesSimulation } from './types';

export interface SimulationsClient {
  simulateInstallments(request: SimulateInstallmentsRequest): Promise<InstallmentSimulation[]>;
  simulateValues(request: SimulateValuesRequest): Promise<ValuesSimulation>;
}

export class SimulationsClientImpl implements SimulationsClient {
  constructor(private readonly executor: ApiRequestExecutor) {}

  async simulateInstallments(request: SimulateInstallmentsRequest): Promise<InstallmentSimulation[]> {
    const path = new QueryStringBuilder()
      .add('valorSolicitado', request.requestedAmount)
      .add('tipoValorCalculo', request.calculationValueType ?? CalculationValueType.GrossAmount)
      .build('v1/order/simulate-installments');

    const response = await this.executor.get(path);
    ApiRequestExecutor.ensureSuccess(response);

    return (response.body as SimulateInstallmentWire[]).map(installmentSimulationToPublic);
  }

  async simulateValues(request: SimulateValuesRequest): Promise<ValuesSimulation> {
    const path = new QueryStringBuilder()
      .add('valor', request.amount)
      .add('prazo', request.term)
      .add('modeloJuros', 1)
      .add('tipoValorCalculo', request.calculationValueType ?? CalculationValueType.GrossAmount)
      .build('v1/order/simulate-values');

    const response = await this.executor.get(path);
    ApiRequestExecutor.ensureSuccess(response);

    return valuesSimulationToPublic(response.body as SimulationValuesWire);
  }
}

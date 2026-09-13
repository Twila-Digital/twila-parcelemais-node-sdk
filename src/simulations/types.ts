import { enumFromWireValue } from '../internal/util/enumMapping';

export enum CalculationValueType {
  GrossAmount = 1,
  LiquidAmount = 2,
  Unknown = -1,
}

export function calculationValueTypeFromWireValue(value: number): CalculationValueType {
  return enumFromWireValue(CalculationValueType, value, CalculationValueType.Unknown);
}

export interface SimulateInstallmentsRequest {
  requestedAmount: number;
  calculationValueType?: CalculationValueType;
}

export interface SimulateValuesRequest {
  amount: number;
  term: number;
  calculationValueType?: CalculationValueType;
}

export interface InstallmentSimulation {
  totalAmount: number;
  term: number;
  installmentAmount: number;
}

export interface ValuesSimulation {
  saleAmount: number;
  disbursementAmount: number;
  installmentAmount: number;
}

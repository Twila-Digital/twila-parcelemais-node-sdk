import { enumFromWireValue } from '../internal/util/enumMapping';

export enum DisbursementModel {
  EstablishmentChain = 1,
  Establishment = 2,
  External = 3,
  Unknown = -1,
}

export function disbursementModelFromWireValue(value: number): DisbursementModel {
  return enumFromWireValue(DisbursementModel, value, DisbursementModel.Unknown);
}

export enum BankAccountType {
  Current = 1,
  Savings = 2,
  Payment = 3,
  Unknown = -1,
}

export function bankAccountTypeFromWireValue(value: number): BankAccountType {
  return enumFromWireValue(BankAccountType, value, BankAccountType.Unknown);
}

export interface EstablishmentOwner {
  name: string;
  email: string;
  phone: string;
}

export interface EstablishmentBankAccount {
  bankNumber: string;
  agencyNumber: string;
  agencyDigit?: string;
  accountNumber: string;
  accountDigit: string;
  accountType: BankAccountType;
  holderName?: string;
  holderDocument?: string;
}

export interface EstablishmentAddress {
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface Establishment {
  establishmentId: string;
  document: string;
  legalName: string;
  tradeName: string;
  isActive: boolean;
  disbursementModel?: DisbursementModel;
  owner: EstablishmentOwner;
  bankAccount?: EstablishmentBankAccount;
  address?: EstablishmentAddress;
}

export interface CreateEstablishmentRequest {
  document: string;
  legalName: string;
  tradeName: string;
  disbursementModel: DisbursementModel;
  owner: EstablishmentOwner;
  bankAccount: EstablishmentBankAccount;
  address?: EstablishmentAddress;
}

export interface CreateEstablishmentResult {
  establishmentId: string;
}

export interface UpdateEstablishmentRequest {
  tradeName: string;
  disbursementModel?: DisbursementModel;
  address?: EstablishmentAddress;
}

export interface ListEstablishmentsRequest {
  tradeName?: string;
  isActive?: boolean;
}

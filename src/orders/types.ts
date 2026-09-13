import { enumFromWireValue } from '../internal/util/enumMapping';

export enum OrderStatus {
  Undefined = 0,
  Analysing = 1,
  Approved = 2,
  UnavailableBalance = 3,
  AnalysisExpired = 4,
  PendingPayment = 5,
  BiometryRefused = 6,
  BiometryApproved = 7,
  PaymentRefused = 8,
  Purchased = 9,
  Unauthorized = 10,
  PendingAuthorization = 11,
  AwaitingRegistration = 12,
  SaleNotStarted = 13,
  Canceled = 14,
  Billing = 15,
  Completed = 16,
  Frozen = 17,
  PendingPaymentConfirmation = 18,
  Disbursed = 19,
  Unknown = -1,
}

export function orderStatusFromWireValue(value: number): OrderStatus {
  return enumFromWireValue(OrderStatus, value, OrderStatus.Unknown);
}

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  complement?: string;
}

export interface CreateOrderRequest {
  cpf: string;
  phoneNumber: string;
  establishmentDocument: string;
  requestedAmount: number;
  name: string;
  email: string;
  dateOfBirth: string | Date;
  address: Address;
}

export interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  statusDescription: string;
  customerDocument: string;
  establishmentLegalName: string;
  establishmentDocument: string;
  createdAt: string;
  total?: number;
  customerName?: string;
  term?: number;
  description?: string;
  approvedAmount?: number;
  disbursed?: boolean;
  disbursedAt?: string;
  requestedAmount?: number;
}

export interface ListOrdersRequest {
  status?: OrderStatus;
  customerDocument?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  number?: number;
  establishmentDocument?: string;
  description?: string;
  page?: number;
  pageSize?: number;
}

export interface CheckoutLink {
  url?: string;
}

export interface InvoiceFile {
  fileName: string;
  base64Content: string;
}

export function invoiceFileFromBuffer(content: Buffer | Uint8Array, fileName: string): InvoiceFile {
  return { fileName, base64Content: Buffer.from(content).toString('base64') };
}

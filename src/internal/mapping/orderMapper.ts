import type { AddressWire, CreateOrderRequestWire, OrderWire } from '../generated/order';
import type { Address, CreateOrderRequest, Order } from '../../orders/types';
import { orderStatusFromWireValue } from '../../orders/types';

export function orderToPublic(wire: OrderWire): Order {
  return {
    id: wire.id,
    number: wire.numero,
    status: orderStatusFromWireValue(wire.status.valor),
    statusDescription: wire.status.descricao,
    customerDocument: wire.documentoCliente,
    establishmentLegalName: wire.razaoSocialEstabelecimento,
    establishmentDocument: wire.documentoEstabelecimento,
    createdAt: wire.criadoEm,
    total: wire.total,
    customerName: wire.nomeCliente,
    term: wire.prazo,
    description: wire.descricao,
    approvedAmount: wire.valorAprovado,
    disbursed: wire.desembolsado,
    disbursedAt: wire.desembolsadoEm,
    requestedAmount: wire.valorSolicitado,
  };
}

export function addressToWire(address: Address): AddressWire {
  return {
    logradouro: address.street,
    numero: address.number,
    bairro: address.neighborhood,
    cidade: address.city,
    estado: address.state,
    cep: address.postalCode,
    complemento: address.complement,
  };
}

export function createOrderRequestToWire(request: CreateOrderRequest): CreateOrderRequestWire {
  return {
    cpf: request.cpf,
    celular: request.phoneNumber,
    documentoEstabelecimento: request.establishmentDocument,
    valorSolicitado: request.requestedAmount,
    nome: request.name,
    email: request.email,
    dataDeNascimento: toIsoString(request.dateOfBirth),
    endereco: addressToWire(request.address),
  };
}

export function toIsoString(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString();
}

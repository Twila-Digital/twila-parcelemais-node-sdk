import type { CustomerAddressWire, CustomerWire } from '../generated/customer';
import type { Address, Customer } from '../../customers/types';

export function customerToPublic(wire: CustomerWire): Customer {
  return {
    id: wire.id,
    name: wire.nome,
    document: wire.documento,
    dateOfBirth: wire.dataDeNascimento,
    address: wire.endereco ? customerAddressToPublic(wire.endereco) : undefined,
    email: wire.email,
    phoneNumber: wire.celular,
  };
}

export function customerAddressToPublic(wire: CustomerAddressWire): Address {
  return {
    street: wire.rua,
    number: wire.numero,
    neighborhood: wire.bairro,
    city: wire.cidade,
    state: wire.estado,
    postalCode: wire.cep,
    country: wire.pais,
    complement: wire.complemento,
  };
}

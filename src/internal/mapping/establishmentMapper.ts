import type {
  CreateEstablishmentRequestWire,
  EstablishmentAddressWire,
  EstablishmentBankAccountWire,
  EstablishmentWire,
  UpdateEstablishmentRequestWire,
} from '../generated/establishment';
import type {
  CreateEstablishmentRequest,
  Establishment,
  EstablishmentAddress,
  EstablishmentBankAccount,
  UpdateEstablishmentRequest,
} from '../../establishments/types';
import { bankAccountTypeFromWireValue, disbursementModelFromWireValue } from '../../establishments/types';

export function bankAccountToWire(bankAccount: EstablishmentBankAccount): EstablishmentBankAccountWire {
  return {
    banco: bankAccount.bankNumber,
    agencia: bankAccount.agencyNumber,
    digitoAgencia: bankAccount.agencyDigit ?? '',
    conta: bankAccount.accountNumber,
    digitoConta: bankAccount.accountDigit,
    tipoConta: bankAccount.accountType,
    nomeTitular: bankAccount.holderName,
    documentoTitular: bankAccount.holderDocument,
  };
}

export function addressToWire(address: EstablishmentAddress): EstablishmentAddressWire {
  return {
    rua: address.street,
    numero: address.number,
    complemento: address.complement,
    bairro: address.district,
    cidade: address.city,
    estado: address.state,
    cep: address.zipCode,
    pais: address.country,
  };
}

export function createEstablishmentRequestToWire(request: CreateEstablishmentRequest): CreateEstablishmentRequestWire {
  return {
    documento: request.document,
    razaoSocial: request.legalName,
    nomeFantasia: request.tradeName,
    modeloDesembolso: request.disbursementModel,
    responsavel: { nome: request.owner.name, email: request.owner.email, celular: request.owner.phone },
    contaBancaria: bankAccountToWire(request.bankAccount),
    endereco: addressToWire(request.address),
  };
}

export function updateEstablishmentRequestToWire(request: UpdateEstablishmentRequest): UpdateEstablishmentRequestWire {
  return {
    nomeFantasia: request.tradeName,
    modeloDesembolso: request.disbursementModel,
    endereco: request.address ? addressToWire(request.address) : undefined,
  };
}

export function establishmentToPublic(wire: EstablishmentWire): Establishment {
  return {
    establishmentId: wire.estabelecimentoId,
    document: wire.documento,
    legalName: wire.razaoSocial,
    tradeName: wire.nomeFantasia,
    isActive: wire.ativa,
    disbursementModel:
      wire.modeloDesembolso === undefined || wire.modeloDesembolso === null
        ? undefined
        : disbursementModelFromWireValue(wire.modeloDesembolso),
    owner: {
      name: wire.responsavel.nome,
      email: wire.responsavel.email,
      phone: wire.responsavel.celular,
    },
    bankAccount: wire.contaBancaria
      ? {
          bankNumber: wire.contaBancaria.banco,
          agencyNumber: wire.contaBancaria.agencia,
          agencyDigit: wire.contaBancaria.digitoAgencia,
          accountNumber: wire.contaBancaria.conta,
          accountDigit: wire.contaBancaria.digitoConta,
          accountType: bankAccountTypeFromWireValue(wire.contaBancaria.tipoConta),
          holderName: wire.contaBancaria.nomeTitular,
          holderDocument: wire.contaBancaria.documentoTitular,
        }
      : undefined,
    address: wire.endereco
      ? {
          street: wire.endereco.rua,
          number: wire.endereco.numero,
          complement: wire.endereco.complemento,
          district: wire.endereco.bairro,
          city: wire.endereco.cidade,
          state: wire.endereco.estado,
          zipCode: wire.endereco.cep,
          country: wire.endereco.pais,
        }
      : undefined,
  };
}

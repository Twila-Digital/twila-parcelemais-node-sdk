import { ApiRequestExecutor } from '../internal/http/apiRequestExecutor';
import { QueryStringBuilder } from '../internal/http/queryString';
import type { CreateEstablishmentResponseWire, EstablishmentWire } from '../internal/generated/establishment';
import {
  bankAccountToWire,
  createEstablishmentRequestToWire,
  establishmentToPublic,
  updateEstablishmentRequestToWire,
} from '../internal/mapping/establishmentMapper';
import type {
  CreateEstablishmentRequest,
  CreateEstablishmentResult,
  Establishment,
  EstablishmentBankAccount,
  ListEstablishmentsRequest,
  UpdateEstablishmentRequest,
} from './types';

export interface EstablishmentsClient {
  create(request: CreateEstablishmentRequest): Promise<CreateEstablishmentResult>;
  get(establishmentId: string): Promise<Establishment>;
  list(request?: ListEstablishmentsRequest): Promise<Establishment[]>;
  update(establishmentId: string, request: UpdateEstablishmentRequest): Promise<void>;
  updateBankAccount(establishmentId: string, bankAccount: EstablishmentBankAccount): Promise<void>;
  activate(establishmentId: string): Promise<void>;
  deactivate(establishmentId: string): Promise<void>;
}

export class EstablishmentsClientImpl implements EstablishmentsClient {
  constructor(private readonly executor: ApiRequestExecutor) {}

  async create(request: CreateEstablishmentRequest): Promise<CreateEstablishmentResult> {
    const wireRequest = createEstablishmentRequestToWire(request);
    const response = await this.executor.post('v1/establishment', wireRequest);
    ApiRequestExecutor.ensureSuccess(response);

    return { establishmentId: (response.body as CreateEstablishmentResponseWire).estabelecimentoId };
  }

  async get(establishmentId: string): Promise<Establishment> {
    const response = await this.executor.get(`v1/establishment/${establishmentId}`);
    ApiRequestExecutor.ensureSuccess(response);

    return establishmentToPublic(response.body as EstablishmentWire);
  }

  async list(request: ListEstablishmentsRequest = {}): Promise<Establishment[]> {
    const path = new QueryStringBuilder()
      .add('nomeFantasia', request.tradeName)
      .add('ativa', request.isActive === undefined ? undefined : String(request.isActive))
      .build('v1/establishment/list');

    const response = await this.executor.get(path);
    ApiRequestExecutor.ensureSuccess(response);

    return (response.body as EstablishmentWire[]).map(establishmentToPublic);
  }

  async update(establishmentId: string, request: UpdateEstablishmentRequest): Promise<void> {
    const wireRequest = updateEstablishmentRequestToWire(request);
    const response = await this.executor.put(`v1/establishment/${establishmentId}`, wireRequest);
    ApiRequestExecutor.ensureSuccess(response);
  }

  async updateBankAccount(establishmentId: string, bankAccount: EstablishmentBankAccount): Promise<void> {
    const response = await this.executor.put(`v1/establishment/${establishmentId}/bank-account`, bankAccountToWire(bankAccount));
    ApiRequestExecutor.ensureSuccess(response);
  }

  async activate(establishmentId: string): Promise<void> {
    await this.setActive(establishmentId, true);
  }

  async deactivate(establishmentId: string): Promise<void> {
    await this.setActive(establishmentId, false);
  }

  private async setActive(establishmentId: string, isActive: boolean): Promise<void> {
    const response = await this.executor.put(`v1/establishment/${establishmentId}/status`, { ativa: isActive });
    ApiRequestExecutor.ensureSuccess(response);
  }
}

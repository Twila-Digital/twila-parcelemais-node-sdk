import { ApiRequestExecutor } from '../internal/http/apiRequestExecutor';
import { QueryStringBuilder } from '../internal/http/queryString';
import type { CustomerWire } from '../internal/generated/customer';
import type { PagedResultWire } from '../internal/generated/paged';
import { customerToPublic } from '../internal/mapping/customerMapper';
import type { PagedResult } from '../pagedResult';
import type { Customer, ListCustomersRequest } from './types';

export interface CustomersClient {
  get(customerId: string): Promise<Customer>;
  list(request?: ListCustomersRequest): Promise<PagedResult<Customer>>;
}

export class CustomersClientImpl implements CustomersClient {
  constructor(private readonly executor: ApiRequestExecutor) {}

  async get(customerId: string): Promise<Customer> {
    const response = await this.executor.get(`v1/customer/${customerId}`);
    ApiRequestExecutor.ensureSuccess(response);

    return customerToPublic(response.body as CustomerWire);
  }

  async list(request: ListCustomersRequest = {}): Promise<PagedResult<Customer>> {
    const path = new QueryStringBuilder()
      .add('nome', request.name)
      .add('documento', request.document)
      .add('pagina', request.page ?? 1)
      .add('tamanhoPagina', request.pageSize ?? 10)
      .build('v1/customer/paged');

    const response = await this.executor.get(path);
    ApiRequestExecutor.ensureSuccess(response);

    const wire = response.body as PagedResultWire<CustomerWire>;
    return {
      items: wire.itens.map(customerToPublic),
      hasNext: wire.pagina.tem_proximo,
      hasPrevious: wire.pagina.tem_anterior,
      pageNumber: wire.pagina.numero,
      pageSize: wire.pagina.tamanho,
      totalCount: wire.pagina.total,
    };
  }
}

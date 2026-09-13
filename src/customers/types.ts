export interface Address {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  complement?: string;
}

export interface Customer {
  id: string;
  name: string;
  document: string;
  dateOfBirth: string;
  address?: Address;
  email?: string;
  phoneNumber?: string;
}

export interface ListCustomersRequest {
  name?: string;
  document?: string;
  page?: number;
  pageSize?: number;
}

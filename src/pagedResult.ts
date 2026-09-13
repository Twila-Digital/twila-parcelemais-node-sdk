export interface PagedResult<T> {
  items: T[];
  hasNext: boolean;
  hasPrevious: boolean;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

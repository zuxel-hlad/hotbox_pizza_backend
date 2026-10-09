export interface PagedData<T> {
  totalPages: number;
  totalElements: number;
  pageSize: number;
  pageNumber: number;
  nextPage: boolean;
  prevPage: boolean;
  content: T;
}

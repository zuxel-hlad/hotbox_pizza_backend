import { PagedData } from '@common/types/paged-data.interface';

export const toPagedData = <T>(content: T, totalElements: number, page: number, pageSize: number): PagedData<T> => {
  const totalPages = Math.ceil(totalElements / pageSize);

  return {
    totalPages,
    totalElements,
    pageSize,
    pageNumber: page,
    nextPage: page < totalPages,
    prevPage: page > 1,
    content,
  };
};

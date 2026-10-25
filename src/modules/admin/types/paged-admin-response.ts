import { PagedData } from '@common/types/paged-data.interface';
import { AdminResponse } from '@modules/admin/types/admin-response';

export interface PagedAdminResponse extends PagedData<AdminResponse[]> {}

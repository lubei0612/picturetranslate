import { api } from '@/shared/api';
import type { HistoryItem, HistoryFilters } from '../types';
import type { PaginatedResponse } from '@/shared/types';

export interface HistoryListParams extends HistoryFilters {
  page?: number;
  pageSize?: number;
}

export const historyApi = {
  list: async (params?: HistoryListParams): Promise<PaginatedResponse<HistoryItem>> => {
    return api.get<PaginatedResponse<HistoryItem>>('/history', { params });
  },

  get: async (id: string): Promise<HistoryItem> => {
    return api.get<HistoryItem>(`/history/${id}`);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/history/${id}`);
  },

  deleteMany: async (ids: string[]): Promise<void> => {
    return api.post('/history/batch-delete', { ids });
  },
};

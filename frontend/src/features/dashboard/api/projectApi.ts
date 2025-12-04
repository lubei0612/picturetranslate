import { api } from '@/shared/api';
import type { Project, PaginatedResponse } from '@/shared/types';

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export const projectApi = {
  list: async (params?: ProjectListParams): Promise<PaginatedResponse<Project>> => {
    return api.get<PaginatedResponse<Project>>('/projects', { params });
  },

  get: async (id: string): Promise<Project> => {
    return api.get<Project>(`/projects/${id}`);
  },

  create: async (data: FormData): Promise<Project> => {
    return api.post<Project>('/translate', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  createFromUrl: async (url: string, sourceLang: string, targetLang: string): Promise<Project> => {
    return api.post<Project>('/translate/url', { url, sourceLang, targetLang });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/projects/${id}`);
  },

  retry: async (id: string): Promise<Project> => {
    return api.post<Project>(`/projects/${id}/retry`);
  },
};

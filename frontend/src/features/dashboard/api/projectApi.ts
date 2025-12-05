import { api } from '@/shared/api';
import type { Project, PaginatedResponse } from '@/shared/types';

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface JobCreateResponse {
  job_id: string;
  images_count: number;
  status: string;
  sse_url: string;
}

export interface TranslationRecord {
  id: string;
  job_id: string;
  source_lang: string;
  target_lang: string;
  status: string;
  created_at: string;
  original_url: string | null;
  result_url: string | null;
  is_demo: boolean;
}

export const projectApi = {
  list: async (params?: ProjectListParams): Promise<PaginatedResponse<Project>> => {
    return api.get<PaginatedResponse<Project>>('/history', { params });
  },

  get: async (id: string): Promise<TranslationRecord> => {
    return api.get<TranslationRecord>(`/history/${id}`);
  },

  create: async (file: File, sourceLang: string, targetLang: string): Promise<JobCreateResponse> => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);
    
    return api.post<JobCreateResponse>('/jobs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  createFromUrl: async (imageUrl: string, sourceLang: string, targetLang: string): Promise<JobCreateResponse> => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('无法下载图片');
    }
    const blob = await response.blob();
    const filename = imageUrl.split('/').pop() || 'image.jpg';
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('files', file);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);
    
    return api.post<JobCreateResponse>('/jobs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/history/${id}`);
  },

  subscribeJob: (jobId: string, onEvent: (event: string, data: unknown) => void): EventSource => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const eventSource = new EventSource(`${baseUrl}/jobs/${jobId}/sse`);
    
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent('message', data);
      } catch {
        onEvent('message', e.data);
      }
    };
    
    eventSource.addEventListener('progress', (e: MessageEvent) => {
      try {
        onEvent('progress', JSON.parse(e.data));
      } catch {
        onEvent('progress', e.data);
      }
    });
    
    eventSource.addEventListener('complete', (e: MessageEvent) => {
      try {
        onEvent('complete', JSON.parse(e.data));
      } catch {
        onEvent('complete', e.data);
      }
      eventSource.close();
    });
    
    eventSource.addEventListener('error', (e: MessageEvent) => {
      onEvent('error', e);
      eventSource.close();
    });
    
    return eventSource;
  },
};

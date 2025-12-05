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
  image_uuid?: string;
  source_lang: string;
  target_lang: string;
  status: string;
  created_at: string;
  original_url: string | null;
  result_url: string | null;
  original_path?: string;
  is_demo: boolean;
}

interface HistoryResponse {
  items: TranslationRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const LANG_MAP: Record<string, string> = {
  'zh-CN': '中文(简体)',
  'zh': '中文(简体)',
  'en': '英语',
  'ja': '日语',
  'ko': '韩语',
  'de': '德语',
  'es': '西班牙语',
  'auto': '自动检测',
};

const STATUS_MAP: Record<string, string> = {
  'done': 'completed',
  'failed': 'failed',
  'pending': 'pending',
  'processing': 'processing',
};

function transformToProject(record: TranslationRecord): Project {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
  const baseUrl = apiBase.replace('/api', '');
  
  return {
    id: record.id,
    name: record.original_path?.split('/').pop() || `翻译_${record.id.slice(0, 8)}`,
    thumbnail: record.original_url ? `${baseUrl}${record.original_url}` : undefined,
    status: (STATUS_MAP[record.status] || record.status) as Project['status'],
    sourceLang: LANG_MAP[record.source_lang] || record.source_lang,
    targetLang: LANG_MAP[record.target_lang] || record.target_lang,
    createdAt: record.created_at,
    updatedAt: record.created_at,
    isDemo: record.is_demo,
  };
}

export const projectApi = {
  list: async (params?: ProjectListParams): Promise<PaginatedResponse<Project>> => {
    const response = await api.get<HistoryResponse>('/history', { params });
    return {
      items: response.items.map(transformToProject),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
    };
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

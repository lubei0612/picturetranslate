import { api } from '@/shared/api';
import type { HistoryItem, HistoryFilters } from '../types';
import type { PaginatedResponse } from '@/shared/types';

export interface HistoryListParams extends HistoryFilters {
  page?: number;
  pageSize?: number;
}

interface BackendHistoryItem {
  id: string;
  job_id: string;
  source_lang: string;
  target_lang: string;
  status: string;
  created_at: string;
  original_path?: string;
  original_url?: string;
  result_path?: string;
  result_url?: string;
  is_demo?: boolean;
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

function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${window.location.origin}${url}`;
  return url;
}

function transformToHistoryItem(item: BackendHistoryItem): HistoryItem {
  const sourceLang = LANG_MAP[item.source_lang] || item.source_lang;
  const targetLang = LANG_MAP[item.target_lang] || item.target_lang;
  
  const thumbnailUrl = resolveImageUrl(item.result_url) || resolveImageUrl(item.original_url);
  const resultUrl = resolveImageUrl(item.result_url);
  
  return {
    id: item.id,
    date: item.created_at,
    projectName: item.original_path?.split('/').pop() || `翻译_${item.id.slice(0, 8)}`,
    action: `${sourceLang} → ${targetLang}`,
    result: item.status === 'done' ? 'success' : 'failed',
    projectId: item.status === 'done' ? item.id : undefined,
    isDemo: item.is_demo,
    thumbnailUrl,
    resultUrl,
  };
}

export interface EditorData {
  id: string;
  source_lang: string;
  target_lang: string;
  editor_data: string | null;
  inpainting_url: string | null;
  original_url: string | null;
  result_url: string | null;
}

export const historyApi = {
  list: async (params?: HistoryListParams): Promise<PaginatedResponse<HistoryItem>> => {
    const response = await api.get<{ items: BackendHistoryItem[]; total: number; page: number; pageSize: number; totalPages: number }>('/history', { params });
    return {
      items: response.items.map(transformToHistoryItem),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
    };
  },

  get: async (id: string): Promise<HistoryItem> => {
    return api.get<HistoryItem>(`/history/${id}`);
  },

  getEditorData: async (id: string): Promise<EditorData> => {
    return api.get<EditorData>(`/history/${id}/editor`);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/history/${id}`);
  },

  deleteMany: async (ids: string[]): Promise<void> => {
    return api.post('/history/batch-delete', { ids });
  },
};

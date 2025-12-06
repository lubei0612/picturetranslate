import { useState, useEffect, useCallback, useMemo } from 'react';
import { projectApi, TranslationRecord } from '@/features/dashboard/api/projectApi';

interface UseTranslationOptions {
  translationId: string;
  demoMode?: boolean;
}

interface UseTranslationResult {
  translation: TranslationRecord | null;
  originalImageUrl: string;
  resultImageUrl: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DEMO_TRANSLATION: TranslationRecord = {
  id: 'demo-1',
  job_id: 'demo-job-1',
  source_lang: 'zh',
  target_lang: 'en',
  status: 'completed',
  created_at: new Date().toISOString(),
  original_url: 'https://picsum.photos/id/175/500/600',
  result_url: 'https://picsum.photos/id/175/500/600?grayscale',
  is_demo: true,
};

function buildImageUrl(path: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // 静态文件统一走前端同源，避免在 https 下访问 8000 端口被拦截
  if (path.startsWith('/storage')) {
    return `${window.location.origin}${path}`;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
  const baseUrl = apiBase.replace('/api', '');
  return `${baseUrl}${path}`;
}

export function useTranslation({ translationId, demoMode = false }: UseTranslationOptions): UseTranslationResult {
  const [translation, setTranslation] = useState<TranslationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTranslation = useCallback(async () => {
    if (!translationId) {
      setError('无效的翻译 ID');
      setLoading(false);
      return;
    }

    if (demoMode || translationId.startsWith('demo')) {
      setTranslation(DEMO_TRANSLATION);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await projectApi.get(translationId);
      setTranslation(data);
    } catch (err) {
      console.error('Failed to fetch translation:', err);
      setError('加载翻译数据失败');
      setTranslation(DEMO_TRANSLATION);
    } finally {
      setLoading(false);
    }
  }, [translationId, demoMode]);

  useEffect(() => {
    fetchTranslation();
  }, [fetchTranslation]);

  const originalImageUrl = useMemo(() => {
    if (!translation) return 'https://picsum.photos/id/175/500/600';
    return buildImageUrl(translation.original_url);
  }, [translation]);

  const resultImageUrl = useMemo(() => {
    if (!translation) return 'https://picsum.photos/id/175/500/600?grayscale';
    return buildImageUrl(translation.result_url);
  }, [translation]);

  return {
    translation,
    originalImageUrl,
    resultImageUrl,
    loading,
    error,
    refresh: fetchTranslation,
  };
}

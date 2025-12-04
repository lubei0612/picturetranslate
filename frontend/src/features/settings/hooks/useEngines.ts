import { useState, useEffect, useCallback } from 'react';
import { api } from '@/shared/api';
import type { EngineInfo, EngineListResponse } from '@/shared/types';

const MOCK_ENGINES: EngineInfo[] = [
  { name: 'aliyun', displayName: '阿里翻译', available: true },
  { name: 'google', displayName: 'Google Translate', available: true },
  { name: 'gpt4', displayName: 'GPT-4 Turbo', available: false },
];

interface UseEnginesOptions {
  demoMode?: boolean;
}

export function useEngines(options: UseEnginesOptions = {}) {
  const { demoMode = true } = options;
  
  const [engines, setEngines] = useState<EngineInfo[]>([]);
  const [defaultEngine, setDefaultEngine] = useState<string>('aliyun');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEngines = useCallback(async () => {
    if (demoMode) {
      setEngines(MOCK_ENGINES);
      setDefaultEngine('aliyun');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.get<EngineListResponse>('/engines');
      setEngines(data.engines);
      setDefaultEngine(data.default);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch engines'));
      // Fallback to mock
      setEngines(MOCK_ENGINES);
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    fetchEngines();
  }, [fetchEngines]);

  return {
    engines,
    defaultEngine,
    loading,
    error,
    refresh: fetchEngines,
  };
}

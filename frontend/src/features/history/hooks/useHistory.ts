import { useState, useEffect, useCallback } from 'react';
import type { HistoryItem, HistoryFilters } from '../types';
import { historyApi } from '../api/historyApi';
import { MOCK_HISTORY } from '../mock/history';

interface UseHistoryOptions {
  demoMode?: boolean;
  autoFetch?: boolean;
  filters?: HistoryFilters;
}

interface UseHistoryResult {
  items: HistoryItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export function useHistory(options: UseHistoryOptions = {}): UseHistoryResult {
  const { demoMode = true, autoFetch = true, filters } = options;
  
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    if (demoMode) {
      let data = [...MOCK_HISTORY];
      
      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        data = data.filter(item => item.result === filters.status);
      }
      
      setItems(data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await historyApi.list({ ...filters });
      setItems(response.items);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch history'));
      // Fallback to mock data
      setItems(MOCK_HISTORY);
    } finally {
      setLoading(false);
    }
  }, [demoMode, filters]);

  const refresh = useCallback(async () => {
    await fetchHistory();
  }, [fetchHistory]);

  const deleteItem = useCallback(async (id: string) => {
    if (demoMode) {
      setItems(prev => prev.filter(item => item.id !== id));
      return;
    }

    try {
      await historyApi.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      throw err;
    }
  }, [demoMode]);

  useEffect(() => {
    if (autoFetch) {
      fetchHistory();
    }
  }, [autoFetch, fetchHistory]);

  return {
    items,
    loading,
    error,
    refresh,
    deleteItem,
  };
}

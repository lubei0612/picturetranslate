import { useCallback, useState } from "react";

import {
  deleteHistoryItem,
  fetchHistory,
  HistoryFilters,
  HistoryItem,
} from "../api/translateClient";

export interface HistoryState {
  items: HistoryItem[];
  total: number;
  page: number;
  pages: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: HistoryState = {
  items: [],
  total: 0,
  page: 1,
  pages: 0,
  isLoading: false,
  error: null,
};

export function useHistory() {
  const [state, setState] = useState<HistoryState>(initialState);
  const [filters, setFilters] = useState<HistoryFilters>({ limit: 20 });

  const load = useCallback(
    async (newFilters?: Partial<HistoryFilters>) => {
      const mergedFilters = { ...filters, ...newFilters };
      setFilters(mergedFilters);
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetchHistory(mergedFilters);
        setState({
          items: response.items,
          total: response.total,
          page: response.page,
          pages: response.pages,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "获取历史记录失败",
        }));
      }
    },
    [filters]
  );

  const goToPage = useCallback(
    (page: number) => {
      load({ page });
    },
    [load]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteHistoryItem(id);
        setState((prev) => ({
          ...prev,
          items: prev.items.filter((item) => item.id !== id),
          total: prev.total - 1,
        }));
        return true;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "删除失败",
        }));
        return false;
      }
    },
    []
  );

  const refresh = useCallback(() => load(filters), [filters, load]);

  return {
    ...state,
    filters,
    load,
    goToPage,
    remove,
    refresh,
  };
}

import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../types';
import { projectApi, type ProjectListParams } from '../api/projectApi';
import { MOCK_PROJECTS } from '../mock/projects';

interface UseProjectsOptions {
  demoMode?: boolean;
  autoFetch?: boolean;
}

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsResult {
  const { demoMode = false, autoFetch = true } = options;
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProjects = useCallback(async (params?: ProjectListParams) => {
    if (demoMode) {
      setProjects(MOCK_PROJECTS);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await projectApi.list(params);
      if (params?.page === 1 || !params?.page) {
        setProjects(response.items);
      } else {
        setProjects(prev => [...prev, ...response.items]);
      }
      setHasMore(response.page < response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
      // Fallback to demo data on error
      if (projects.length === 0) {
        setProjects(MOCK_PROJECTS);
      }
    } finally {
      setLoading(false);
    }
  }, [demoMode, projects.length]);

  const refresh = useCallback(async () => {
    setPage(1);
    await fetchProjects({ page: 1 });
  }, [fetchProjects]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchProjects({ page: nextPage });
  }, [hasMore, loading, page, fetchProjects]);

  useEffect(() => {
    if (autoFetch) {
      fetchProjects({ page: 1 });
    }
  }, [autoFetch, fetchProjects]);

  return {
    projects,
    loading,
    error,
    refresh,
    hasMore,
    loadMore,
  };
}

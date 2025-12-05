import { useState, useCallback, useRef } from 'react';

interface UseOptimisticUpdateOptions<T> {
  initialData: T;
  onUpdate: (data: T) => Promise<T>;
  onError?: (error: Error, rollbackData: T) => void;
}

interface UseOptimisticUpdateResult<T> {
  data: T;
  isUpdating: boolean;
  error: Error | null;
  update: (updater: (current: T) => T) => Promise<void>;
  setData: (data: T) => void;
}

export function useOptimisticUpdate<T>({
  initialData,
  onUpdate,
  onError,
}: UseOptimisticUpdateOptions<T>): UseOptimisticUpdateResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const previousData = useRef<T>(initialData);

  const update = useCallback(async (updater: (current: T) => T) => {
    setError(null);
    setIsUpdating(true);
    
    // Store previous data for rollback
    previousData.current = data;
    
    // Optimistic update
    const optimisticData = updater(data);
    setData(optimisticData);

    try {
      // Perform actual update
      const serverData = await onUpdate(optimisticData);
      setData(serverData);
    } catch (err) {
      // Rollback on error
      const error = err instanceof Error ? err : new Error('Update failed');
      setData(previousData.current);
      setError(error);
      onError?.(error, previousData.current);
    } finally {
      setIsUpdating(false);
    }
  }, [data, onUpdate, onError]);

  return {
    data,
    isUpdating,
    error,
    update,
    setData,
  };
}

// 专门用于版本冲突处理的 Hook
interface VersionedData {
  version: number;
}

export function useVersionedOptimisticUpdate<T extends VersionedData>({
  initialData,
  onUpdate,
  onConflict,
}: {
  initialData: T;
  onUpdate: (data: T) => Promise<T>;
  onConflict?: (serverData: T, localData: T) => T;
}) {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [conflict, setConflict] = useState<{ server: T; local: T } | null>(null);

  const update = useCallback(async (updater: (current: T) => T) => {
    setIsUpdating(true);
    setConflict(null);
    
    const localData = updater(data);
    setData(localData);

    try {
      const serverData = await onUpdate(localData);
      setData(serverData);
    } catch (err: unknown) {
      // Check if it's a version conflict (HTTP 409)
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: T } }).response;
        if (response?.status === 409 && response?.data) {
          const serverData = response.data;
          setConflict({ server: serverData, local: localData });
          
          // Auto-resolve if handler provided
          if (onConflict) {
            const resolved = onConflict(serverData, localData);
            setData(resolved);
            setConflict(null);
          } else {
            // Rollback to server version
            setData(serverData);
          }
          return;
        }
      }
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [data, onUpdate, onConflict]);

  return {
    data,
    isUpdating,
    conflict,
    update,
    setData,
    resolveConflict: (resolved: T) => {
      setData(resolved);
      setConflict(null);
    },
  };
}

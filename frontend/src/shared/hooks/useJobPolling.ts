import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/shared/api/client';
import type { JobResponse } from '@/shared/types';

interface UseJobPollingOptions {
  jobId: string | null;
  interval?: number;
  maxRetries?: number;
  onComplete?: (result: JobResponse) => void;
  onError?: (error: Error) => void;
}

interface UseJobPollingResult {
  status: 'idle' | 'polling' | 'completed' | 'failed';
  progress: number;
  result: JobResponse | null;
  error: Error | null;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useJobPolling = ({
  jobId,
  interval = 2000,
  maxRetries = 60,
  onComplete,
  onError,
}: UseJobPollingOptions): UseJobPollingResult => {
  const [status, setStatus] = useState<'idle' | 'polling' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<JobResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const retryCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const poll = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await apiClient.get<JobResponse>(`/api/jobs/${jobId}`);
      const data = response.data;

      setProgress(data.progress ?? 0);

      if (data.status === 'completed') {
        setStatus('completed');
        setResult(data);
        onComplete?.(data);
        stopPolling();
        return;
      }

      if (data.status === 'failed') {
        const err = new Error(data.error ?? 'Job failed');
        setStatus('failed');
        setError(err);
        onError?.(err);
        stopPolling();
        return;
      }

      // Continue polling
      retryCount.current += 1;
      if (retryCount.current >= maxRetries) {
        const err = new Error('Polling timeout');
        setStatus('failed');
        setError(err);
        onError?.(err);
        stopPolling();
        return;
      }

      timerRef.current = setTimeout(poll, interval);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setStatus('failed');
      setError(error);
      onError?.(error);
      stopPolling();
    }
  }, [jobId, interval, maxRetries, onComplete, onError, stopPolling]);

  const startPolling = useCallback(() => {
    if (!jobId) return;
    retryCount.current = 0;
    setStatus('polling');
    setProgress(0);
    setResult(null);
    setError(null);
    poll();
  }, [jobId, poll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    status,
    progress,
    result,
    error,
    startPolling,
    stopPolling,
  };
};

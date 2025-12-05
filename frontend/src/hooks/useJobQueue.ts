import { useCallback, useEffect, useRef, useState } from "react";

import {
  createJob,
  JobCreateOptions,
  JobCreateResponse,
  SSECompleteEvent,
  SSEProgressEvent,
  subscribeJobEvents,
  getStorageUrl,
} from "../api/translateClient";

export interface ImageProgress {
  uuid: string;
  status: "pending" | "processing" | "done" | "failed";
  resultUrl?: string;
  error?: string;
}

export interface JobState {
  jobId: string | null;
  status: "idle" | "uploading" | "processing" | "done" | "failed";
  images: ImageProgress[];
  completed: number;
  failed: number;
  error: string | null;
}

const initialState: JobState = {
  jobId: null,
  status: "idle",
  images: [],
  completed: 0,
  failed: 0,
  error: null,
};

export function useJobQueue() {
  const [state, setState] = useState<JobState>(initialState);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const submitJob = useCallback(
    async (options: Omit<JobCreateOptions, "files"> & { files: File[] }) => {
      cleanup();
      setState({
        ...initialState,
        status: "uploading",
        images: options.files.map((_, idx) => ({
          uuid: `temp-${idx}`,
          status: "pending",
        })),
      });

      let response: JobCreateResponse;
      try {
        response = await createJob(options);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: err instanceof Error ? err.message : "创建任务失败",
        }));
        return null;
      }

      setState((prev) => ({
        ...prev,
        jobId: response.job_id,
        status: "processing",
      }));

      const unsubscribe = subscribeJobEvents(response.job_id, {
        onProgress: (event: SSEProgressEvent) => {
          setState((prev) => {
            const images = [...prev.images];
            const idx = images.findIndex((img) => img.uuid === event.image_uuid);
            if (idx !== -1) {
              images[idx] = {
                ...images[idx],
                status: event.status,
                resultUrl: event.result_url ? getStorageUrl(event.result_url) : undefined,
                error: event.error,
              };
            } else {
              images.push({
                uuid: event.image_uuid,
                status: event.status,
                resultUrl: event.result_url ? getStorageUrl(event.result_url) : undefined,
                error: event.error,
              });
            }
            return { ...prev, images };
          });
        },
        onComplete: (event: SSECompleteEvent) => {
          setState((prev) => ({
            ...prev,
            status: "done",
            completed: event.completed,
            failed: event.failed,
          }));
        },
        onError: (error: Error) => {
          setState((prev) => ({
            ...prev,
            status: "failed",
            error: error.message,
          }));
        },
      });

      unsubscribeRef.current = unsubscribe;
      return response.job_id;
    },
    [cleanup]
  );

  const reset = useCallback(() => {
    cleanup();
    setState(initialState);
  }, [cleanup]);

  return {
    ...state,
    submitJob,
    reset,
    isProcessing: state.status === "uploading" || state.status === "processing",
  };
}

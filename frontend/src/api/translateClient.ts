const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

export interface TranslateOptions {
  sourceLang?: string;
  targetLang?: string;
  field?: "e-commerce" | "general";
  enablePostprocess?: boolean;
  protectProduct?: boolean;
}

export async function translateImage(
  file: File,
  options: TranslateOptions = {}
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("source_lang", options.sourceLang ?? "auto");
  formData.append("target_lang", options.targetLang ?? "zh");
  formData.append("field", options.field ?? "e-commerce");
  formData.append(
    "enable_postprocess",
    String(options.enablePostprocess ?? true)
  );
  formData.append(
    "protect_product",
    String(options.protectProduct ?? true)
  );

  const response = await fetch(`${API_BASE}/api/translate`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "翻译失败，请稍后再试";
    try {
      const payload = await response.json();
      message = payload?.message ?? message;
    } catch (_) {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return response.blob();
}

export function downloadBlob(blob: Blob, filename = "translated.png") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ========== Jobs API ==========

export interface JobCreateOptions extends TranslateOptions {
  files: File[];
  masks?: Blob[];
}

export interface JobCreateResponse {
  job_id: string;
  images_count: number;
  status: string;
  sse_url: string;
}

export interface SSEProgressEvent {
  image_index?: number;
  image_uuid: string;
  status: "processing" | "done" | "failed";
  result_url?: string;
  error?: string;
}

export interface SSECompleteEvent {
  job_id: string;
  completed: number;
  failed: number;
}

export async function createJob(options: JobCreateOptions): Promise<JobCreateResponse> {
  const formData = new FormData();
  options.files.forEach((file) => formData.append("files", file));
  if (options.masks) {
    options.masks.forEach((mask) => formData.append("masks", mask));
  }
  formData.append("source_lang", options.sourceLang ?? "auto");
  formData.append("target_lang", options.targetLang ?? "zh");
  formData.append("field", options.field ?? "e-commerce");
  formData.append("enable_postprocess", String(options.enablePostprocess ?? true));
  formData.append("protect_product", String(options.protectProduct ?? true));

  const response = await fetch(`${API_BASE}/api/jobs`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message ?? "创建任务失败");
  }

  return response.json();
}

export function subscribeJobEvents(
  jobId: string,
  callbacks: {
    onProgress?: (event: SSEProgressEvent) => void;
    onComplete?: (event: SSECompleteEvent) => void;
    onError?: (error: Error) => void;
  }
): () => void {
  const eventSource = new EventSource(`${API_BASE}/api/jobs/${jobId}/sse`);

  eventSource.addEventListener("progress", (e) => {
    try {
      const data = JSON.parse(e.data) as SSEProgressEvent;
      callbacks.onProgress?.(data);
    } catch (err) {
      console.error("Failed to parse progress event", err);
    }
  });

  eventSource.addEventListener("complete", (e) => {
    try {
      const data = JSON.parse(e.data) as SSECompleteEvent;
      callbacks.onComplete?.(data);
      eventSource.close();
    } catch (err) {
      console.error("Failed to parse complete event", err);
    }
  });

  eventSource.addEventListener("error", (e) => {
    try {
      const data = JSON.parse((e as MessageEvent).data ?? "{}");
      callbacks.onError?.(new Error(data.error ?? "SSE 连接错误"));
    } catch {
      callbacks.onError?.(new Error("SSE 连接错误"));
    }
  });

  eventSource.onerror = () => {
    callbacks.onError?.(new Error("连接断开"));
    eventSource.close();
  };

  return () => eventSource.close();
}

// ========== History API ==========

export interface HistoryItem {
  id: string;
  job_id: string;
  image_uuid: string;
  source_lang: string;
  target_lang: string;
  field: string;
  status: string;
  created_at: string;
  original_url: string | null;
  mask_url: string | null;
  result_url: string | null;
}

export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  pages: number;
}

export interface HistoryFilters {
  page?: number;
  limit?: number;
  source_lang?: string;
  target_lang?: string;
  date_from?: string;
  date_to?: string;
}

export async function fetchHistory(filters: HistoryFilters = {}): Promise<HistoryListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.source_lang) params.set("source_lang", filters.source_lang);
  if (filters.target_lang) params.set("target_lang", filters.target_lang);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);

  const url = `${API_BASE}/api/history${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message ?? "获取历史记录失败");
  }

  return response.json();
}

export async function fetchHistoryItem(id: string): Promise<HistoryItem> {
  const response = await fetch(`${API_BASE}/api/history/${id}`);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message ?? "获取记录详情失败");
  }

  return response.json();
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/history/${id}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message ?? "删除记录失败");
  }
}

export function getStorageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

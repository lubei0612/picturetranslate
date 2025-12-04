const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

export interface TranslateOptions {
  sourceLang?: string;
  targetLang?: string;
  field?: "e-commerce" | "general";
  enablePostprocess?: boolean;
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

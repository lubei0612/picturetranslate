import { useCallback, useState } from "react";

import { translateImage, TranslateOptions } from "../api/translateClient";

interface TranslationState {
  isLoading: boolean;
  error: string | null;
  resultBlob: Blob | null;
  resultUrl: string | null;
}

export function useTranslation() {
  const [state, setState] = useState<TranslationState>({
    isLoading: false,
    error: null,
    resultBlob: null,
    resultUrl: null,
  });

  const translate = useCallback(
    async (file: File, options?: TranslateOptions) => {
      setState((prev) => {
        if (prev.resultUrl) {
          URL.revokeObjectURL(prev.resultUrl);
        }
        return { ...prev, isLoading: true, error: null, resultBlob: null, resultUrl: null };
      });

      try {
        const blob = await translateImage(file, options);
        const url = URL.createObjectURL(blob);
        setState({ isLoading: false, error: null, resultBlob: blob, resultUrl: url });
        return blob;
      } catch (error) {
        const message = error instanceof Error ? error.message : "未知错误";
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (state.resultUrl) {
      URL.revokeObjectURL(state.resultUrl);
    }
    setState({ isLoading: false, error: null, resultBlob: null, resultUrl: null });
  }, [state.resultUrl]);

  return { ...state, translate, reset };
}

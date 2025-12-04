import { api } from '@/shared/api';
import type { TextLayer } from '@/shared/types';

export interface LayerUpdateRequest {
  translatedText?: string;
  style?: Partial<{
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor: string;
    fontWeight: string;
    fontStyle: string;
    textAlign: string;
  }>;
  version: number;
}

export interface BatchUpdateRequest {
  translationId: string;
  updates: Array<{
    layerId: string;
    translatedText?: string;
    style?: Record<string, unknown>;
    version: number;
  }>;
}

export const layerApi = {
  list: async (translationId: string): Promise<TextLayer[]> => {
    return api.get<TextLayer[]>(`/translations/${translationId}/layers`);
  },

  update: async (layerId: string, data: LayerUpdateRequest): Promise<TextLayer> => {
    return api.patch<TextLayer>(`/layers/${layerId}`, data);
  },

  batchUpdate: async (data: BatchUpdateRequest): Promise<TextLayer[]> => {
    return api.post<TextLayer[]>('/layers/batch', data);
  },
};

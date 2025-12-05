import { useState, useCallback, useEffect } from 'react';
import type { StagingTextLayer } from '../types';
import { layerApi } from '../api/layerApi';
import { MOCK_LAYERS } from '../mock/layers';
import { useToast } from '@/shared/components';

interface UseLayersOptions {
  translationId: string;
  demoMode?: boolean;
}

interface UseLayersResult {
  layers: StagingTextLayer[];
  selectedLayerId: string | null;
  selectedLayer: StagingTextLayer | null;
  loading: boolean;
  selectLayer: (id: string | null) => void;
  updateLayer: (id: string, updates: Partial<StagingTextLayer>) => void;
  refreshLayers: () => Promise<void>;
}

export function useLayers({ translationId, demoMode = true }: UseLayersOptions): UseLayersResult {
  const [layers, setLayers] = useState<StagingTextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const selectedLayer = layers.find(l => l.id === selectedLayerId) || null;

  const fetchLayers = useCallback(async () => {
    if (demoMode) {
      setLayers(MOCK_LAYERS);
      if (MOCK_LAYERS.length > 0) {
        setSelectedLayerId(MOCK_LAYERS[0].id);
      }
      return;
    }

    setLoading(true);
    try {
      const data = await layerApi.list(translationId);
      // Convert API response to staging format
      const stagingLayers: StagingTextLayer[] = data.map(layer => ({
        id: layer.id,
        originalText: layer.originalText,
        translatedText: layer.translatedText,
        translationEngine: 'aliyun',
        x: layer.bbox[0],
        y: layer.bbox[1],
        width: layer.bbox[2] - layer.bbox[0],
        height: layer.bbox[3] - layer.bbox[1],
        fontSize: layer.style?.fontSize ?? 16,
        fontFamily: layer.style?.fontFamily ?? 'Inter',
        color: layer.style?.color ?? '#000000',
        backgroundColor: layer.style?.backgroundColor ?? 'transparent',
        fontWeight: (layer.style?.fontWeight as 'normal' | 'bold') ?? 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        alignment: (layer.style?.textAlign as 'left' | 'center' | 'right') ?? 'left',
        letterSpacing: 0,
        lineHeight: 1.2,
        isVisible: true,
      }));
      setLayers(stagingLayers);
      if (stagingLayers.length > 0 && !selectedLayerId) {
        setSelectedLayerId(stagingLayers[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch layers:', err);
      // Fallback to mock data
      setLayers(MOCK_LAYERS);
    } finally {
      setLoading(false);
    }
  }, [translationId, demoMode, selectedLayerId]);

  const updateLayer = useCallback((id: string, updates: Partial<StagingTextLayer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));

    // In real mode, sync to backend
    if (!demoMode) {
      // Debounced API call would go here
      // layerApi.update(id, { ...updates, version: layer.version });
    }
  }, [demoMode]);

  const selectLayer = useCallback((id: string | null) => {
    setSelectedLayerId(id);
  }, []);

  const refreshLayers = useCallback(async () => {
    await fetchLayers();
    toast.success('图层已刷新');
  }, [fetchLayers, toast]);

  useEffect(() => {
    fetchLayers();
  }, [fetchLayers]);

  return {
    layers,
    selectedLayerId,
    selectedLayer,
    loading,
    selectLayer,
    updateLayer,
    refreshLayers,
  };
}

import { useState, useCallback, useEffect } from 'react';
import type { StagingTextLayer } from '../types';
import { layerApi } from '../api/layerApi';
import { historyApi, type EditorData } from '@/features/history/api/historyApi';
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

interface TemplateNode {
  id?: string | number;
  pairId?: string | number;
  label?: string;
  type?: string;
  content?: string;
  ocrContent?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string | null;
  textAlign?: string;
  letterSpacing?: number;
  lineHeight?: number;
  fontWeight?: string | number;
  zIndex?: number;
}

interface TemplatePayload {
  width?: number;
  height?: number;
  children?: TemplateNode[];
}

const normalizeColor = (value?: string | null): string => {
  if (!value) return '#000000';
  if (value.startsWith('#') && value.length === 9) return value.slice(0, 7);
  return value;
};

const parseEditorData = (editor: EditorData | null): StagingTextLayer[] => {
  if (!editor?.editor_data) return [];

  let template: TemplatePayload | null = null;
  try {
    template = JSON.parse(editor.editor_data);
  } catch (err) {
    console.error('解析 editor_data 失败', err);
    return [];
  }

  const children = template?.children || [];
  const stageWidth = template?.width || children[0]?.width || 1;
  const stageHeight = template?.height || children[0]?.height || 1;

  const bgMap = new Map<string | number, TemplateNode>();
  children.forEach((child) => {
    if (child.label === 'bg') {
      const key = child.pairId ?? child.id;
      if (key !== undefined) {
        bgMap.set(key, child);
      }
    }
  });

  const elements = children
    .filter((child) => child.type === 'text' && child.label === 'element')
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  return elements.map((child) => {
    const key = child.pairId ?? child.id ?? String(Math.random());
    const bg = bgMap.get(key);

    const left = Number(child.left ?? 0);
    const top = Number(child.top ?? 0);
    const width = Number(child.width ?? bg?.width ?? 0);
    const height = Number(child.height ?? bg?.height ?? 0);

    const x = stageWidth ? (left / stageWidth) * 100 : 0;
    const y = stageHeight ? (top / stageHeight) * 100 : 0;
    const w = stageWidth ? (width / stageWidth) * 100 : 0;
    const h = stageHeight ? (height / stageHeight) * 100 : 0;

    const fontSize = Number(child.fontSize ?? 16);
    const lineHeightRaw = Number(child.lineHeight ?? 0);
    const lineHeight = fontSize > 0 && lineHeightRaw > 0 ? lineHeightRaw / fontSize : 1.2;

    const fontWeightValue = typeof child.fontWeight === 'string' ? child.fontWeight : '';
    const fontWeight = Number(fontWeightValue) >= 600 || fontWeightValue === 'bold' ? 'bold' : 'normal';

    const backgroundColor = bg?.backgroundColor ?? child.backgroundColor;

    return {
      id: String(key),
      originalText: child.ocrContent || '',
      translatedText: child.content || '',
      translationEngine: 'aliyun',
      x,
      y,
      width: w,
      height: h,
      fontSize,
      fontFamily: child.fontFamily || 'Arial',
      color: normalizeColor(child.color) || '#000000',
      backgroundColor: backgroundColor ? normalizeColor(backgroundColor) : 'transparent',
      fontWeight,
      fontStyle: 'normal',
      textDecoration: 'none',
      alignment: (child.textAlign as StagingTextLayer['alignment']) || 'left',
      letterSpacing: Number(child.letterSpacing ?? 0),
      lineHeight,
      isVisible: true,
    } satisfies StagingTextLayer;
  });
};

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
      const editor = await historyApi.getEditorData(translationId);
      const editorLayers = parseEditorData(editor);

      if (editorLayers.length > 0) {
        setLayers(editorLayers);
        setSelectedLayerId(editorLayers[0].id);
        return;
      }

      const data = await layerApi.list(translationId);
      const stagingLayers: StagingTextLayer[] = data.map(layer => {
        const [x, y, w, h] = layer.bbox;
        return {
          id: layer.id,
          originalText: layer.originalText,
          translatedText: layer.translatedText,
          translationEngine: 'aliyun',
          x,
          y,
          width: w,
          height: h,
          fontSize: layer.style?.fontSize ?? 16,
          fontFamily: layer.style?.fontFamily ?? 'Inter',
          color: (layer.style as any)?.fontColor || (layer.style as any)?.color || '#000000',
          backgroundColor: (layer.style as any)?.backgroundColor ?? 'transparent',
          fontWeight: ((layer.style as any)?.fontWeight as 'normal' | 'bold') ?? 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          alignment: ((layer.style as any)?.textAlign as 'left' | 'center' | 'right') ?? 'left',
          letterSpacing: 0,
          lineHeight: 1.2,
          isVisible: true,
        } satisfies StagingTextLayer;
      });
      setLayers(stagingLayers);
      if (stagingLayers.length > 0) {
        setSelectedLayerId(stagingLayers[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch layers:', err);
      setLayers(MOCK_LAYERS);
    } finally {
      setLoading(false);
    }
  }, [translationId, demoMode]);

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

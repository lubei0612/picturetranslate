import { useState, useCallback, useEffect } from 'react';
import type { ToolType, EditorTab } from '../types';

interface UseEditorStateResult {
  // Tool state
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  
  // Tab state
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
  
  // Zoom & Pan
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

export function useEditorState(): UseEditorStateResult {
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeTab, setActiveTab] = useState<EditorTab>('settings');
  const [zoom, setZoomState] = useState(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const setZoom = useCallback((newZoom: number) => {
    setZoomState(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(zoom + ZOOM_STEP);
  }, [zoom, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(zoom - ZOOM_STEP);
  }, [zoom, setZoom]);

  const resetView = useCallback(() => {
    setZoomState(0.5);
    setPan({ x: 0, y: 0 });
  }, []);

  // Reset view when tool changes
  useEffect(() => {
    if (activeTool === 'resize') {
      setZoomState(0.6);
      setPan({ x: 0, y: 0 });
    }
  }, [activeTool]);

  return {
    activeTool,
    setActiveTool,
    activeTab,
    setActiveTab,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    pan,
    setPan,
    resetView,
  };
}

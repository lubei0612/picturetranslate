import type { TextLayer, LayerStyle } from '@/shared/types';

export type { TextLayer, LayerStyle };

export type ToolType = 'select' | 'text' | 'eraser' | 'resize' | 'help';

export type EditorTab = 'settings' | 'layers';

export interface EditorProps {
  projectId: string;
  onBack?: () => void;
}

export interface EditorHeaderProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onBack: () => void;
  onDownload: () => void;
  showZoomControls?: boolean;
}

export interface EditorToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onHelpClick?: () => void;
}

export interface ImageViewerProps {
  originalImage: string;
  translatedImage: string;
  layers: TextLayer[];
  selectedLayerId: string | null;
  onLayerSelect: (id: string) => void;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  activeTool: ToolType;
}

export interface LayerPanelProps {
  layers: TextLayer[];
  selectedLayer: TextLayer | null;
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  onLayerSelect: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<TextLayer>) => void;
}

export interface LayerListProps {
  layers: TextLayer[];
  selectedLayerId: string | null;
  onLayerSelect: (id: string) => void;
}

export interface LayerSettingsProps {
  layer: TextLayer;
  onUpdate: (updates: Partial<TextLayer>) => void;
}

// Mock data type for staging
export interface StagingTextLayer {
  id: string;
  originalText: string;
  translatedText: string;
  translationEngine?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  alignment: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  isVisible: boolean;
}

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorHeader } from './EditorHeader';
import { EditorToolbar } from './EditorToolbar';
import { ImageViewer } from './ImageViewer';
import { LayerPanel } from './LayerPanel';
import { MobileEditor } from './MobileEditor';
import { useLayers } from '../hooks/useLayers';
import { useEditorState } from '../hooks/useEditorState';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '@/shared/components';
import { useIsMobile } from '@/shared/hooks';
import { useGlobalSettings } from '@/shared/context';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isMobile = useIsMobile();
  const { settings } = useGlobalSettings();
  
  const isDemo = settings.demoMode || id?.startsWith('demo');
  
  const { translation, loading: translationLoading } = useTranslation({
    translationId: id || '',
    demoMode: isDemo,
  });

  const {
    layers,
    selectedLayerId,
    selectedLayer,
    selectLayer,
    updateLayer,
  } = useLayers({ translationId: id || '', demoMode: isDemo });

  const {
    activeTool,
    setActiveTool,
    activeTab,
    setActiveTab,
    zoom,
    zoomIn,
    zoomOut,
    pan,
    setPan,
    setZoom,
  } = useEditorState();

  const handleBack = () => {
    navigate('/');
  };

  const handleDownload = () => {
    toast.info('下载功能开发中...');
  };

  const handleToolChange = (tool: typeof activeTool) => {
    if (tool === 'text' || tool === 'resize') {
      toast.info('该功能还在开发中...');
      return;
    }
    setActiveTool(tool);
  };

  const handleLayerUpdate = (layerId: string, updates: Record<string, unknown>) => {
    updateLayer(layerId, updates);
  };

  const originalImage = translation?.original_url || 'https://picsum.photos/id/175/500/600';
  const translatedImage = translation?.result_url || 'https://picsum.photos/id/175/500/600?grayscale';

  if (translationLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">加载翻译数据...</p>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <MobileEditor
        originalImage={originalImage}
        translatedImage={translatedImage}
        layers={layers}
        selectedLayer={selectedLayer}
        onLayerSelect={selectLayer}
        onLayerUpdate={handleLayerUpdate}
        onDownload={handleDownload}
      />
    );
  }

  // Desktop layout
  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col">
      <EditorHeader
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onBack={handleBack}
        onDownload={handleDownload}
        showZoomControls={activeTool !== 'resize'}
      />

      <div className="flex-1 flex overflow-hidden">
        <EditorToolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
        />

        <ImageViewer
          originalImage={originalImage}
          translatedImage={translatedImage}
          layers={layers}
          selectedLayerId={selectedLayerId}
          onLayerSelect={selectLayer}
          zoom={zoom}
          pan={pan}
          onPanChange={setPan}
          onZoomChange={setZoom}
          activeTool={activeTool}
        />

        <LayerPanel
          layers={layers}
          selectedLayer={selectedLayer}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLayerSelect={selectLayer}
          onLayerUpdate={handleLayerUpdate}
        />
      </div>
    </div>
  );
};

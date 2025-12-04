import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorHeader } from './EditorHeader';
import { EditorToolbar } from './EditorToolbar';
import { ImageViewer } from './ImageViewer';
import { LayerPanel } from './LayerPanel';
import { useLayers } from '../hooks/useLayers';
import { useEditorState } from '../hooks/useEditorState';
import { useToast } from '@/shared/components';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    layers,
    selectedLayerId,
    selectedLayer,
    selectLayer,
    updateLayer,
  } = useLayers({ translationId: id || '', demoMode: true });

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

  const handleLayerUpdate = (layerId: string, updates: Record<string, unknown>) => {
    updateLayer(layerId, updates);
  };

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
          onToolChange={setActiveTool}
        />

        <ImageViewer
          originalImage="https://picsum.photos/id/175/500/600"
          translatedImage="https://picsum.photos/id/175/500/600?grayscale"
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

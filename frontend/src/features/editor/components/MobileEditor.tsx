import React, { useState } from 'react';
import { ArrowLeft, Download, Layers, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet, Button, LazyImage } from '@/shared/components';
import { LayerList } from './LayerList';
import { LayerSettings } from './LayerSettings';
import type { StagingTextLayer } from '../types';

interface MobileEditorProps {
  originalImage: string;
  translatedImage: string;
  layers: StagingTextLayer[];
  selectedLayer: StagingTextLayer | null;
  onLayerSelect: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<StagingTextLayer>) => void;
  onDownload: () => void;
}

type ImageTab = 'original' | 'translated';

export const MobileEditor: React.FC<MobileEditorProps> = ({
  originalImage,
  translatedImage,
  layers,
  selectedLayer,
  onLayerSelect,
  onLayerUpdate,
  onDownload,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ImageTab>('translated');
  const [showLayerSheet, setShowLayerSheet] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="h-12 bg-gray-900 flex items-center justify-between px-3 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-sm font-medium text-white">图片精修</span>

        <Button
          variant="primary"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={onDownload}
        >
          保存
        </Button>
      </header>

      {/* Image Tab Switcher */}
      <div className="flex bg-gray-800 shrink-0">
        <button
          onClick={() => setActiveTab('original')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'original'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400'
          }`}
        >
          原图
        </button>
        <button
          onClick={() => setActiveTab('translated')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'translated'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400'
          }`}
        >
          译图
        </button>
      </div>

      {/* Image Viewer */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <LazyImage
            src={activeTab === 'original' ? originalImage : translatedImage}
            alt={activeTab === 'original' ? 'Original' : 'Translated'}
            className="max-w-full max-h-full object-contain rounded-lg"
          />

          {/* Layer Overlays (only on translated) */}
          {activeTab === 'translated' && (
            <div className="absolute inset-4 pointer-events-none">
              {layers.map((layer) =>
                layer.isVisible && (
                  <div
                    key={layer.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerSelect(layer.id);
                      setShowSettingsSheet(true);
                    }}
                    className={`
                      absolute pointer-events-auto cursor-pointer
                      ${selectedLayer?.id === layer.id ? 'ring-2 ring-blue-500' : ''}
                    `}
                    style={{
                      left: `${layer.x}%`,
                      top: `${layer.y}%`,
                      width: `${layer.width}%`,
                      height: `${layer.height}%`,
                      backgroundColor: layer.backgroundColor,
                    }}
                  >
                    <span
                      className="text-xs"
                      style={{
                        color: layer.color,
                        fontWeight: layer.fontWeight,
                      }}
                    >
                      {layer.translatedText}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="h-14 bg-gray-800 flex items-center justify-around shrink-0 safe-area-pb">
        <button
          onClick={() => setShowLayerSheet(true)}
          className="flex flex-col items-center text-gray-400 hover:text-white"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-1">图层</span>
        </button>

        <button
          onClick={() => selectedLayer && setShowSettingsSheet(true)}
          className={`flex flex-col items-center ${
            selectedLayer ? 'text-gray-400 hover:text-white' : 'text-gray-600'
          }`}
          disabled={!selectedLayer}
        >
          <Settings2 className="w-5 h-5" />
          <span className="text-[10px] mt-1">设置</span>
        </button>
      </div>

      {/* Layer List Sheet */}
      <BottomSheet
        isOpen={showLayerSheet}
        onClose={() => setShowLayerSheet(false)}
        title="图层列表"
        height="half"
      >
        <LayerList
          layers={layers}
          selectedLayerId={selectedLayer?.id || null}
          onLayerSelect={(id) => {
            onLayerSelect(id);
            setShowLayerSheet(false);
            setShowSettingsSheet(true);
          }}
        />
      </BottomSheet>

      {/* Layer Settings Sheet */}
      <BottomSheet
        isOpen={showSettingsSheet && !!selectedLayer}
        onClose={() => setShowSettingsSheet(false)}
        title="图层设置"
        height="auto"
      >
        {selectedLayer && (
          <LayerSettings
            layer={selectedLayer}
            onUpdate={(updates) => onLayerUpdate(selectedLayer.id, updates)}
          />
        )}
      </BottomSheet>
    </div>
  );
};

import React from 'react';
import { LayerList } from './LayerList';
import { LayerSettings } from './LayerSettings';
import type { StagingTextLayer, EditorTab } from '../types';

interface LayerPanelProps {
  layers: StagingTextLayer[];
  selectedLayer: StagingTextLayer | null;
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  onLayerSelect: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<StagingTextLayer>) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  selectedLayer,
  activeTab,
  onTabChange,
  onLayerSelect,
  onLayerUpdate,
}) => {
  return (
    <aside className="w-[360px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex p-2 gap-2 shrink-0">
        <button
          onClick={() => onTabChange('settings')}
          className={`
            flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors
            ${activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
            }
          `}
        >
          设置
        </button>
        <button
          onClick={() => onTabChange('layers')}
          className={`
            flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors
            ${activeTab === 'layers'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
            }
          `}
        >
          图层
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'layers' ? (
          <LayerList
            layers={layers}
            selectedLayerId={selectedLayer?.id || null}
            onLayerSelect={onLayerSelect}
          />
        ) : selectedLayer ? (
          <LayerSettings
            layer={selectedLayer}
            onUpdate={(updates) => onLayerUpdate(selectedLayer.id, updates)}
          />
        ) : (
          <div className="p-10 text-center text-gray-400 text-sm">
            请选择一个图层以编辑样式
          </div>
        )}
      </div>
    </aside>
  );
};

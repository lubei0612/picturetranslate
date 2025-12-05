import React from 'react';
import { Type } from 'lucide-react';
import type { StagingTextLayer } from '../types';

interface LayerListProps {
  layers: StagingTextLayer[];
  selectedLayerId: string | null;
  onLayerSelect: (id: string) => void;
}

export const LayerList: React.FC<LayerListProps> = ({
  layers,
  selectedLayerId,
  onLayerSelect,
}) => {
  if (layers.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm">
        暂无图层
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {layers.map((layer) => (
        <div
          key={layer.id}
          onClick={() => onLayerSelect(layer.id)}
          className={`
            p-3 rounded-lg border cursor-pointer flex items-center justify-between
            group transition-all
            ${selectedLayerId === layer.id
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-transparent hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <Type className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate text-sm font-medium text-gray-700">
              {layer.translatedText || layer.originalText}
            </span>
          </div>

          {selectedLayerId === layer.id && (
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
};

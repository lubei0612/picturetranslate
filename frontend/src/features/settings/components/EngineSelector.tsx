import React from 'react';
import { Cpu, Check, AlertCircle } from 'lucide-react';
import type { EngineInfo } from '@/shared/types';

interface EngineSelectorProps {
  engines: EngineInfo[];
  selectedEngine: string;
  onSelect: (engine: string) => void;
  loading?: boolean;
}

export const EngineSelector: React.FC<EngineSelectorProps> = ({
  engines,
  selectedEngine,
  onSelect,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {engines.map((engine) => (
        <label
          key={engine.name}
          className={`
            flex items-center p-4 border rounded-lg cursor-pointer transition-all
            ${selectedEngine === engine.name
              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
              : 'border-gray-200 hover:bg-gray-50'
            }
            ${!engine.available ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            type="radio"
            name="engine"
            value={engine.name}
            checked={selectedEngine === engine.name}
            onChange={() => engine.available && onSelect(engine.name)}
            disabled={!engine.available}
            className="sr-only"
          />

          <div className="flex items-center flex-1">
            <Cpu className={`w-5 h-5 mr-3 ${
              selectedEngine === engine.name ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <div>
              <div className="font-medium text-gray-900">{engine.displayName}</div>
              <div className="text-sm text-gray-500">
                {engine.available ? '可用' : '暂不可用'}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            {selectedEngine === engine.name ? (
              <Check className="w-5 h-5 text-blue-600" />
            ) : !engine.available ? (
              <AlertCircle className="w-5 h-5 text-gray-300" />
            ) : null}
          </div>
        </label>
      ))}
    </div>
  );
};

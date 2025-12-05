import React from 'react';
import {
  Copy, RefreshCw, Info,
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  ChevronDown
} from 'lucide-react';
import type { StagingTextLayer } from '../types';

interface LayerSettingsProps {
  layer: StagingTextLayer;
  onUpdate: (updates: Partial<StagingTextLayer>) => void;
}

export const LayerSettings: React.FC<LayerSettingsProps> = ({ layer, onUpdate }) => {
  const handleColorChange = (key: 'color' | 'backgroundColor', value: string) => {
    onUpdate({ [key]: value });
  };

  return (
    <div className="p-5 space-y-6">
      {/* Tip */}
      <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-start space-x-2">
        <Info className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
        <p className="text-xs text-green-700 leading-tight">
          可以按住 "Shift" 键选择多个文本来同步设置样式
        </p>
      </div>

      {/* Original Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500">原文</label>
          <button className="flex items-center text-xs text-gray-400 hover:text-blue-600 transition-colors">
            <Copy className="w-3 h-3 mr-1" />复制
          </button>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 min-h-[40px] flex items-center">
          {layer.originalText}
        </div>
      </div>

      {/* Translation Engine */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500">翻译引擎</label>
        <div className="relative">
          <div className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-800 flex items-center justify-between appearance-none cursor-default">
            <span>阿里云翻译</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Translated Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500">译文内容</label>
          <button className="flex items-center text-xs text-blue-600 hover:text-blue-700 transition-colors">
            <RefreshCw className="w-3 h-3 mr-1" />重新翻译
          </button>
        </div>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all min-h-[80px] resize-y"
          value={layer.translatedText}
          onChange={(e) => onUpdate({ translatedText: e.target.value })}
        />
      </div>

      {/* Typography Section */}
      <div className="space-y-5 pt-5 border-t border-gray-100">
        <label className="text-xs font-semibold text-gray-500 block">文本样式</label>

        {/* Font Family & Size */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white appearance-none pr-8 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              value={layer.fontFamily}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            >
              <option value="Inter">Inter (默认)</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
          
          <div className="w-24 relative flex items-center border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all">
            <input
              type="number"
              className="w-full py-2 text-sm text-center bg-transparent outline-none pl-2 pr-6"
              value={layer.fontSize}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
            />
            <span className="absolute right-3 text-xs text-gray-400 pointer-events-none">
              px
            </span>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          {/* Text Color */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">文字颜色</label>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded border border-gray-200 relative overflow-hidden shrink-0 shadow-sm">
                <input
                  type="color"
                  className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] p-0 m-0 cursor-pointer opacity-0"
                  value={layer.color}
                  onChange={(e) => handleColorChange('color', e.target.value)}
                />
                <div className="w-full h-full pointer-events-none" style={{ backgroundColor: layer.color }} />
              </div>
              <input
                type="text"
                value={layer.color}
                onChange={(e) => handleColorChange('color', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-600 font-mono uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">背景颜色</label>
            <div className="flex items-center gap-2 h-9">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={layer.backgroundColor === 'transparent'}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.checked ? 'transparent' : '#ffffff' })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
                />
                <span className="text-xs text-gray-600">无</span>
              </label>

              {layer.backgroundColor !== 'transparent' && (
                <div className="w-9 h-9 rounded border border-gray-200 relative overflow-hidden shrink-0 ml-auto shadow-sm">
                  <input
                    type="color"
                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] p-0 m-0 cursor-pointer opacity-0"
                    value={layer.backgroundColor}
                    onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  />
                  <div className="w-full h-full pointer-events-none" style={{ backgroundColor: layer.backgroundColor }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center justify-between border border-gray-300 rounded-lg p-1 bg-white">
          <FormatButton
            active={layer.fontWeight === 'bold'}
            icon={Bold}
            onClick={() => onUpdate({ fontWeight: layer.fontWeight === 'bold' ? 'normal' : 'bold' })}
          />
          <FormatButton
            active={layer.fontStyle === 'italic'}
            icon={Italic}
            onClick={() => onUpdate({ fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' })}
          />
          <FormatButton
            active={layer.textDecoration === 'underline'}
            icon={Underline}
            onClick={() => onUpdate({ textDecoration: layer.textDecoration === 'underline' ? 'none' : 'underline' })}
          />

          <div className="w-px h-4 bg-gray-200 mx-1" />

          <FormatButton
            active={layer.alignment === 'left'}
            icon={AlignLeft}
            onClick={() => onUpdate({ alignment: 'left' })}
          />
          <FormatButton
            active={layer.alignment === 'center'}
            icon={AlignCenter}
            onClick={() => onUpdate({ alignment: 'center' })}
          />
          <FormatButton
            active={layer.alignment === 'right'}
            icon={AlignRight}
            onClick={() => onUpdate({ alignment: 'right' })}
          />
        </div>
      </div>
    </div>
  );
};

const FormatButton: React.FC<{
  active: boolean;
  icon: React.ElementType;
  onClick: () => void;
}> = ({ active, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className={`
      p-2 rounded-md transition-all duration-200
      ${active 
        ? 'text-blue-600 bg-blue-50' 
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }
    `}
  >
    <Icon className="w-4 h-4" />
  </button>
);

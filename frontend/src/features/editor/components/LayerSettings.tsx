import React from 'react';
import {
  Copy, RefreshCw, ChevronDown, Info,
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react';
import type { StagingTextLayer } from '../types';

interface LayerSettingsProps {
  layer: StagingTextLayer;
  onUpdate: (updates: Partial<StagingTextLayer>) => void;
}

export const LayerSettings: React.FC<LayerSettingsProps> = ({ layer, onUpdate }) => {
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
          <button className="flex items-center text-xs text-gray-400 hover:text-blue-600">
            <Copy className="w-3 h-3 mr-1" />复制
          </button>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-600 min-h-[40px] flex items-center">
          {layer.originalText}
        </div>
      </div>

      {/* Translation Engine */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500">翻译引擎</label>
        <div className="relative">
          <select
            className="w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={layer.translationEngine || 'aliyun'}
            onChange={(e) => onUpdate({ translationEngine: e.target.value })}
          >
            <option value="aliyun">阿里翻译</option>
            <option value="google">Google Translate</option>
            <option value="gpt4">GPT-4 Turbo</option>
          </select>
          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Translated Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500">译文内容</label>
          <button className="flex items-center text-xs text-blue-600 hover:text-blue-700">
            <RefreshCw className="w-3 h-3 mr-1" />重新翻译
          </button>
        </div>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
          value={layer.translatedText}
          onChange={(e) => onUpdate({ translatedText: e.target.value })}
        />
      </div>

      {/* Typography */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <label className="text-xs font-semibold text-gray-500 block">文本样式</label>

        {/* Font & Size */}
        <div className="flex gap-2">
          <select
            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
            value={layer.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          >
            <option value="Inter">Inter (默认)</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
          <div className="w-20 relative">
            <input
              type="number"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center"
              value={layer.fontSize}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
            />
            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">
              px
            </span>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 mb-1 block">文字颜色</label>
            <div className="flex items-center space-x-2 border border-gray-300 rounded p-1">
              <input
                type="color"
                className="w-6 h-6 rounded border-none p-0 cursor-pointer"
                value={layer.color}
                onChange={(e) => onUpdate({ color: e.target.value })}
              />
              <span className="text-xs text-gray-600 font-mono">{layer.color}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 mb-1 block">背景颜色</label>
            <div className="flex items-center space-x-2 border border-gray-300 rounded p-1">
              <input
                type="color"
                className="w-6 h-6 rounded border-none p-0 cursor-pointer"
                value={layer.backgroundColor === 'transparent' ? '#ffffff' : layer.backgroundColor}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              />
              <span className="text-xs text-gray-600">
                {layer.backgroundColor === 'transparent' ? '无' : '填充'}
              </span>
            </div>
          </div>
        </div>

        {/* Formatting */}
        <div className="flex items-center justify-between border border-gray-300 rounded-lg p-1">
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

          <div className="w-px h-4 bg-gray-200" />

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
      p-1.5 rounded hover:bg-gray-100 transition-colors
      ${active ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}
    `}
  >
    <Icon className="w-4 h-4" />
  </button>
);

import React from 'react';
import { ArrowLeft, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/shared/components';
import type { EditorHeaderProps } from '../types';

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onBack,
  onDownload,
  showZoomControls = true,
}) => {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
      {/* Left: Back & Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span className="text-sm font-medium">退出</span>
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <span className="text-sm font-semibold text-gray-800">图片精修</span>
      </div>

      {/* Right: Zoom Controls & Download */}
      <div className="flex items-center space-x-3">
        {showZoomControls && (
          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={onZoomOut}
              className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs w-12 text-center font-mono text-gray-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        )}

        <Button
          variant="primary"
          size="md"
          icon={<Download className="w-4 h-4" />}
          onClick={onDownload}
        >
          下载结果
        </Button>
      </div>
    </header>
  );
};

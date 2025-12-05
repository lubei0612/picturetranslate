import React from 'react';
import { 
  ArrowLeft, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Monitor, 
  Undo2, 
  Redo2 
} from 'lucide-react';
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-50">
      {/* Left: Back & Title */}
      <div className="flex items-center space-x-6">
        <button
          onClick={onBack}
          className="group flex items-center text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">退出</span>
        </button>
        
        <div className="h-6 w-px bg-gray-200" />
        
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
          CrossBorder AI
        </h1>
      </div>

      {/* Center: Toolbar Actions (Device, Undo, Redo) - Visual Placeholder for now */}
      <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
        <button className="p-2 text-gray-500 hover:text-gray-800 hover:bg-white rounded-md transition-all" title="切换设备 (开发中)">
          <Monitor className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button className="p-2 text-gray-400 hover:text-gray-600 cursor-not-allowed" title="撤销 (开发中)">
          <Undo2 className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 cursor-not-allowed" title="重做 (开发中)">
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Zoom Controls & Download */}
      <div className="flex items-center space-x-4">
        {showZoomControls && (
          <div className="flex items-center space-x-2 mr-2">
             <button
              onClick={onZoomOut}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium w-12 text-center text-gray-700 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              title="放大"
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
          className="shadow-md shadow-blue-500/20"
        >
          下载结果
        </Button>
      </div>
    </header>
  );
};

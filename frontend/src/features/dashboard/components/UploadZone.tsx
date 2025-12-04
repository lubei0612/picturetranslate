import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Link as LinkIcon, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components';
import type { UploadZoneProps, UploadOptions } from '../types';

export const UploadZone: React.FC<UploadZoneProps> = ({
  onUpload,
  onUrlImport,
  isUploading = false,
}) => {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('zh-CN');
  const [imageUrl, setImageUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const options: UploadOptions = { sourceLang, targetLang };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      onUpload(files[0], options);
    }
  }, [onUpload, options]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleUrlImport = useCallback(() => {
    if (imageUrl.trim()) {
      onUrlImport(imageUrl, options);
      setImageUrl('');
    }
  }, [imageUrl, onUrlImport, options]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* File Upload Zone */}
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          p-8 border-b-2 border-dashed transition-colors cursor-pointer
          ${isDragOver ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50/50'}
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center mb-4
            ${isDragOver ? 'bg-blue-100' : 'bg-blue-50'}
          `}>
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6 text-blue-600" />
            )}
          </div>

          <h3 className="text-base font-medium text-gray-900 mb-1">
            {isUploading ? '正在上传...' : '点击或拖拽图片到此处'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            支持 JPG, PNG, WebP (最大 10MB)
          </p>

          {/* Language Selection */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center space-x-2">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isUploading}
              >
                <option value="auto">自动检测语言</option>
                <option value="zh-CN">中文(简体)</option>
                <option value="en">英语</option>
                <option value="ja">日语</option>
                <option value="ko">韩语</option>
              </select>

              <ArrowRight className="w-4 h-4 text-gray-400" />

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-blue-50 border border-blue-500 text-blue-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-blue-500 focus:border-blue-500"
                disabled={isUploading}
              >
                <option value="zh-CN">中文(简体)</option>
                <option value="en">英语</option>
                <option value="ja">日语</option>
                <option value="ko">韩语</option>
                <option value="de">德语</option>
                <option value="es">西班牙语</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* URL Import Zone */}
      <div className="px-6 py-4 bg-gray-50/50 flex items-center space-x-4">
        <LinkIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
          placeholder="粘贴图片链接 (例如: https://example.com/product.jpg)"
          className="flex-1 bg-transparent border-none text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none"
          disabled={isUploading}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUrlImport}
          disabled={isUploading || !imageUrl.trim()}
        >
          导入链接
        </Button>
      </div>
    </div>
  );
};

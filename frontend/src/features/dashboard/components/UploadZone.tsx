import React, { useState, useRef, useCallback, useMemo } from 'react';
import { UploadCloud, Link as LinkIcon, ArrowRight, Loader2, X, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components';
import type { UploadZoneProps, UploadOptions } from '../types';

// 阿里云图片翻译支持的语言配置
const SOURCE_LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: '英语' },
];

// 目标语言（从中文翻译）
const TARGET_LANGUAGES_FROM_ZH = [
  { code: 'en', label: '英语' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'zh-tw', label: '繁体中文' },
  { code: 'ru', label: '俄语' },
  { code: 'es', label: '西班牙语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
  { code: 'it', label: '意大利语' },
  { code: 'pt', label: '葡萄牙语' },
  { code: 'nl', label: '荷兰语' },
  { code: 'pl', label: '波兰语' },
  { code: 'tr', label: '土耳其语' },
  { code: 'th', label: '泰语' },
  { code: 'vi', label: '越南语' },
  { code: 'id', label: '印尼语' },
  { code: 'ms', label: '马来语' },
];

// 目标语言（从英语翻译）
const TARGET_LANGUAGES_FROM_EN = [
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'ru', label: '俄语' },
  { code: 'es', label: '西班牙语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
  { code: 'it', label: '意大利语' },
  { code: 'pt', label: '葡萄牙语' },
  { code: 'nl', label: '荷兰语' },
  { code: 'pl', label: '波兰语' },
  { code: 'tr', label: '土耳其语' },
  { code: 'th', label: '泰语' },
  { code: 'vi', label: '越南语' },
  { code: 'id', label: '印尼语' },
  { code: 'ms', label: '马来语' },
];

export const UploadZone: React.FC<UploadZoneProps> = ({
  onUpload,
  onUrlImport,
  isUploading = false,
}) => {
  const [sourceLang, setSourceLang] = useState('zh');
  const [targetLang, setTargetLang] = useState('en');
  const [imageUrl, setImageUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 根据源语言动态获取目标语言列表
  const targetLanguages = useMemo(() => {
    return sourceLang === 'en' ? TARGET_LANGUAGES_FROM_EN : TARGET_LANGUAGES_FROM_ZH;
  }, [sourceLang]);

  // 当源语言变化时，重置目标语言为列表第一项
  const handleSourceLangChange = useCallback((newSourceLang: string) => {
    setSourceLang(newSourceLang);
    const newTargets = newSourceLang === 'en' ? TARGET_LANGUAGES_FROM_EN : TARGET_LANGUAGES_FROM_ZH;
    // 如果当前目标语言不在新列表中，重置为第一项
    if (!newTargets.find(t => t.code === targetLang)) {
      setTargetLang(newTargets[0].code);
    }
  }, [targetLang]);

  const options: UploadOptions = { sourceLang, targetLang };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setPreviewFile(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, [previewUrl]);

  const handleStartTranslate = useCallback(() => {
    if (previewFile) {
      onUpload(previewFile, options);
    }
  }, [previewFile, onUpload, options]);

  const handleClearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

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
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Preview Mode */}
      {previewUrl && previewFile ? (
        <div className="p-6">
          <div className="relative mb-4">
            <img
              src={previewUrl}
              alt="预览"
              className="max-h-64 mx-auto rounded-lg object-contain"
            />
            <button
              onClick={handleClearPreview}
              disabled={isUploading}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 truncate">{previewFile.name}</p>
            <p className="text-xs text-gray-400">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>

          {/* Language Selection */}
          <div className="flex flex-col items-center gap-3 mb-6">
            {/* 提示信息 */}
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>请正确选择源语言，翻译质量会更好</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={sourceLang}
                onChange={(e) => handleSourceLangChange(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isUploading}
              >
                {SOURCE_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>

              <ArrowRight className="w-4 h-4 text-gray-400" />

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-blue-50 border border-blue-500 text-blue-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-blue-500 focus:border-blue-500"
                disabled={isUploading}
              >
                {targetLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Translation Button */}
          <div className="flex justify-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              重新选择
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleStartTranslate}
              disabled={isUploading}
              className="min-w-[140px]"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  翻译中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  开始翻译
                </span>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Upload Zone */
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
            <p className="text-sm text-gray-500 mb-4">
              支持 JPG, PNG, WebP (最大 10MB)
            </p>

            {/* Language Selection */}
            <div className="flex flex-col items-center gap-3">
              {/* 提示信息 */}
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>请正确选择源语言，翻译质量会更好</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={sourceLang}
                  onChange={(e) => handleSourceLangChange(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isUploading}
                >
                  {SOURCE_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>

                <ArrowRight className="w-4 h-4 text-gray-400" />

                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-blue-50 border border-blue-500 text-blue-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-blue-500 focus:border-blue-500"
                  disabled={isUploading}
                >
                  {targetLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

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

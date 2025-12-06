import React, { useRef, useCallback, useState, useEffect } from 'react';
import type { StagingTextLayer, ToolType } from '../types';

interface ImageViewerProps {
  originalImage: string;
  translatedImage: string;
  layers: StagingTextLayer[];
  selectedLayerId: string | null;
  onLayerSelect: (id: string) => void;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  activeTool: ToolType;
  showLayers?: boolean;
}

interface ImageSize {
  width: number;
  height: number;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  originalImage,
  translatedImage,
  layers,
  selectedLayerId,
  onLayerSelect,
  zoom,
  pan,
  onPanChange,
  onZoomChange,
  activeTool,
  showLayers = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  
  // 动态获取图片尺寸
  const [imageSize, setImageSize] = useState<ImageSize>({ width: 500, height: 600 });
  
  useEffect(() => {
    if (!translatedImage) return;
    
    const img = new Image();
    img.onload = () => {
      // 保持原始比例，但限制最大显示尺寸（视口友好）
      const maxWidth = 800;
      const maxHeight = 1200;
      let { naturalWidth: w, naturalHeight: h } = img;
      
      // 如果图片太大，按比例缩小显示（但实际图片是原始尺寸）
      if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      
      setImageSize({ width: w, height: h });
    };
    img.src = translatedImage;
  }, [translatedImage]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'resize') return;
    
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }, [activeTool, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    onPanChange({
      x: dragStart.current.panX + dx,
      y: dragStart.current.panY + dy,
    });
  }, [onPanChange]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (activeTool === 'resize') return;

    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      onZoomChange(Math.max(0.1, Math.min(5, zoom * delta)));
    } else {
      onPanChange({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
      });
    }
  }, [activeTool, zoom, pan, onZoomChange, onPanChange]);

  return (
    <div
      ref={containerRef}
      className={`
        flex-1 relative overflow-hidden bg-[#F3F4F6] flex items-center justify-center
        ${activeTool === 'eraser' ? 'cursor-crosshair' : 'cursor-grab'}
        ${isDragging.current ? 'cursor-grabbing' : ''}
      `}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Split View Content */}
      <div
        className="flex gap-12 transition-transform duration-75 ease-linear will-change-transform items-start"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {/* Original Image */}
        <div className="relative bg-white shadow-xl ring-1 ring-black/5" style={{ width: imageSize.width, height: imageSize.height }}>
          <div className="absolute -top-10 left-0 bg-white/80 backdrop-blur border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 shadow-sm">
            原图参考
          </div>
          <img
            src={originalImage}
            alt="Original"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>

        {/* Translated Image with Layers */}
        <div className="relative bg-white shadow-xl ring-1 ring-black/5" style={{ width: imageSize.width, height: imageSize.height }}>
          <div className="absolute -top-10 left-0 bg-blue-50/90 backdrop-blur border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 shadow-sm">
            译文编辑
          </div>

          <img
            src={translatedImage}
            alt="Translated"
            className="w-full h-full object-contain"
            draggable={false}
          />

          {/* Text Layers - 只在编辑模式下显示，避免与 result.png 中的文字重叠 */}
          {showLayers && layers.map((layer) =>
            layer.isVisible && (
              <div
                key={layer.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onLayerSelect(layer.id);
                }}
                className={`
                  absolute cursor-pointer flex items-center justify-center group
                  ${selectedLayerId === layer.id && activeTool === 'select'
                    ? 'ring-2 ring-blue-500'
                    : 'hover:ring-1 hover:ring-blue-300'
                  }
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
                  className="pointer-events-none w-full"
                  style={{
                    fontSize: `${layer.fontSize}px`,
                    color: layer.color,
                    fontFamily: layer.fontFamily,
                    fontWeight: layer.fontWeight,
                    fontStyle: layer.fontStyle,
                    textDecoration: layer.textDecoration,
                    textAlign: layer.alignment,
                  }}
                >
                  {layer.translatedText}
                </span>

                {/* Selection Handles */}
                {selectedLayerId === layer.id && activeTool === 'select' && (
                  <>
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500" />
                  </>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

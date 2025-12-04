
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Download, ZoomIn, ZoomOut, Undo, Redo,
  Type, MousePointer2, Ruler, HelpCircle, Eraser,
  Settings2, Layers, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Trash2, X, ChevronDown, Check, Info,
  Maximize, Copy, RefreshCw
} from 'lucide-react';
import { TextLayer, ToolType } from '../types';
import { MOCK_LAYERS } from '../constants';

interface EditorProps {
  onBack: () => void;
}

const RESIZE_PRESETS = [
  { label: '自由裁剪', value: 'free' },
  { label: '原图', value: 'original' },
  { label: '1:1', value: 1 },
  { label: '2:3', value: 0.666 },
  { label: '3:2', value: 1.5 },
  { label: '3:4', value: 0.75 },
  { label: '4:3', value: 1.333 },
];

// Mock Original Image Specs
const ORIGINAL_WIDTH = 1000;
const ORIGINAL_HEIGHT = 1200;

// Display container size (Fixed for simplicity in this mock)
const CANVAS_W = 600;
const CANVAS_H = 720;

type InteractionMode = 'none' | 'pan' | 'crop-move' | 'crop-resize-tl' | 'crop-resize-tr' | 'crop-resize-bl' | 'crop-resize-br' | 'eraser-draw';

export const Editor: React.FC<EditorProps> = ({ onBack }) => {
  // --- Data State ---
  const [layers, setLayers] = useState<TextLayer[]>(MOCK_LAYERS);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('l1');
  
  // --- View State ---
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeTab, setActiveTab] = useState<'settings' | 'layers'>('settings');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // --- Canvas Transform State (For Edit Mode) ---
  const [zoom, setZoom] = useState(0.5); // Initial zoom smaller to fit two images
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // --- Resize/Crop State (For Resize Mode) ---
  const [resizeRatio, setResizeRatio] = useState<number | string>('original');
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, w: 100, h: 100 }); // Percentages (0-100)
  
  // --- Eraser State ---
  const [maskPaths, setMaskPaths] = useState<string[]>([]); // Array of SVG path strings
  const [currentPath, setCurrentPath] = useState<string>('');

  // --- Interaction Temp State ---
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
  const [dragStartMouse, setDragStartMouse] = useState({ x: 0, y: 0 });
  const [dragStartPan, setDragStartPan] = useState({ x: 0, y: 0 });
  const [dragStartCrop, setDragStartCrop] = useState({ x: 0, y: 0, w: 100, h: 100 });

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // --- Effects ---

  // When entering Resize mode, reset crop to full
  useEffect(() => {
    if (activeTool === 'resize') {
      setResizeRatio('original');
      setCropRect({ x: 0, y: 0, w: 100, h: 100 });
      setZoom(0.6); // Reset zoom for resize mode
      setPan({ x: 0, y: 0 });
    } else {
       // Reset for edit mode
       setZoom(0.5);
       setPan({ x: 0, y: 0 });
    }
  }, [activeTool]);

  // Global Mouse Events for Dragging
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (interactionMode === 'none') return;

      // Calculate logic for Eraser Drawing
      if (interactionMode === 'eraser-draw' && containerRef.current) {
         const rect = containerRef.current.getBoundingClientRect();
         // Calculate relative position within the 500x600 image container
         // (Requires knowing where the image is inside the flex container, simplified here for mock)
         // For the mock, we just update the path string blindly to show feedback
         // In production, this needs rigorous coordinate mapping
         return; 
      }

      const dx = e.clientX - dragStartMouse.x;
      const dy = e.clientY - dragStartMouse.y;

      // 1. Pan Canvas Mode
      if (interactionMode === 'pan') {
        setPan({
          x: dragStartPan.x + dx,
          y: dragStartPan.y + dy
        });
        return;
      }

      // 2. Crop Interaction Mode
      const dPctX = (dx / CANVAS_W) * 100;
      const dPctY = (dy / CANVAS_H) * 100;

      let newCrop = { ...dragStartCrop };
      const MIN_SIZE = 5; // Minimum 5% size

      if (interactionMode === 'crop-move') {
         // Constrain movement inside bounds
         const maxX = 100 - dragStartCrop.w;
         const maxY = 100 - dragStartCrop.h;
         newCrop.x = Math.min(Math.max(0, dragStartCrop.x + dPctX), maxX);
         newCrop.y = Math.min(Math.max(0, dragStartCrop.y + dPctY), maxY);
      } 
      else if (interactionMode.startsWith('crop-resize')) {
          if (interactionMode === 'crop-resize-tl') {
             const maxDx = dragStartCrop.w - MIN_SIZE;
             const maxDy = dragStartCrop.h - MIN_SIZE;
             const safeDx = Math.min(Math.max(-dragStartCrop.x, dPctX), maxDx);
             const safeDy = Math.min(Math.max(-dragStartCrop.y, dPctY), maxDy);
             newCrop.x += safeDx; newCrop.y += safeDy; newCrop.w -= safeDx; newCrop.h -= safeDy;
          }
          else if (interactionMode === 'crop-resize-tr') {
             const maxW = 100 - dragStartCrop.x;
             const maxDy = dragStartCrop.h - MIN_SIZE;
             const safeDx = Math.min(Math.max(MIN_SIZE - dragStartCrop.w, dPctX), maxW - dragStartCrop.w);
             const safeDy = Math.min(Math.max(-dragStartCrop.y, dPctY), maxDy);
             newCrop.y += safeDy; newCrop.w += safeDx; newCrop.h -= safeDy;
          }
          else if (interactionMode === 'crop-resize-bl') {
             const maxDx = dragStartCrop.w - MIN_SIZE;
             const maxH = 100 - dragStartCrop.y;
             const safeDx = Math.min(Math.max(-dragStartCrop.x, dPctX), maxDx);
             const safeDy = Math.min(Math.max(MIN_SIZE - dragStartCrop.h, dPctY), maxH - dragStartCrop.h);
             newCrop.x += safeDx; newCrop.w -= safeDx; newCrop.h += safeDy;
          }
          else if (interactionMode === 'crop-resize-br') {
             const maxW = 100 - dragStartCrop.x;
             const maxH = 100 - dragStartCrop.y;
             const safeDx = Math.min(Math.max(MIN_SIZE - dragStartCrop.w, dPctX), maxW - dragStartCrop.w);
             const safeDy = Math.min(Math.max(MIN_SIZE - dragStartCrop.h, dPctY), maxH - dragStartCrop.h);
             newCrop.w += safeDx; newCrop.h += safeDy;
          }
          
          // Switch to 'free' mode if manually resizing
          if (resizeRatio !== 'free') {
              setResizeRatio('free');
          }
      }

      setCropRect(newCrop);
    };

    const handleWindowMouseUp = () => {
      setInteractionMode('none');
      if (interactionMode === 'eraser-draw') {
        // Commit path
      }
    };

    if (interactionMode !== 'none') {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [interactionMode, dragStartMouse, dragStartPan, dragStartCrop, resizeRatio]);

  // --- Handlers ---

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool);
  };

  const updateCropByRatio = (val: number | string) => {
    setResizeRatio(val);
    if (val === 'original') {
       setCropRect({ x: 0, y: 0, w: 100, h: 100 });
       return;
    }
    if (val === 'free') {
        // Keep current rect
        return;
    }
    if (typeof val === 'number') {
       const imgAspect = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;
       let newW = 100, newH = 100;
       if (val > imgAspect) {
          newH = (imgAspect / val) * 100;
       } else {
          newW = (val / imgAspect) * 100;
       }
       setCropRect({
          x: (100 - newW) / 2, y: (100 - newH) / 2, w: newW, h: newH
       });
    }
  };

  const updateCropByPixel = (dimension: 'w' | 'h', pxVal: number) => {
     setResizeRatio('free');
     let newRect = { ...cropRect };
     if (dimension === 'w') {
        const pct = (pxVal / ORIGINAL_WIDTH) * 100;
        newRect.w = Math.min(100 - newRect.x, Math.max(1, pct));
     } else {
        const pct = (pxVal / ORIGINAL_HEIGHT) * 100;
        newRect.h = Math.min(100 - newRect.y, Math.max(1, pct));
     }
     setCropRect(newRect);
  };

  const getCurrentPixelSize = () => ({
     w: Math.round((cropRect.w / 100) * ORIGINAL_WIDTH),
     h: Math.round((cropRect.h / 100) * ORIGINAL_HEIGHT)
  });

  const updateLayer = (key: keyof TextLayer, value: any) => {
      if (!selectedLayerId) return;
      setLayers(layers.map(l => l.id === selectedLayerId ? { ...l, [key]: value } : l));
  };

  // --- Render Helpers ---

  const renderCropOverlay = () => {
    return (
      <>
        {/* Dark Overlays (Z=10) */}
        <div className="absolute bg-black/50 pointer-events-none z-10" style={{ top: 0, left: 0, right: 0, height: `${cropRect.y}%` }} />
        <div className="absolute bg-black/50 pointer-events-none z-10" style={{ bottom: 0, left: 0, right: 0, height: `${100 - (cropRect.y + cropRect.h)}%` }} />
        <div className="absolute bg-black/50 pointer-events-none z-10" style={{ top: `${cropRect.y}%`, left: 0, width: `${cropRect.x}%`, height: `${cropRect.h}%` }} />
        <div className="absolute bg-black/50 pointer-events-none z-10" style={{ top: `${cropRect.y}%`, right: 0, width: `${100 - (cropRect.x + cropRect.w)}%`, height: `${cropRect.h}%` }} />

        {/* The Crop Box (Z=20) */}
        <div 
          className="absolute z-20 cursor-move group"
          style={{
             top: `${cropRect.y}%`, left: `${cropRect.x}%`, width: `${cropRect.w}%`, height: `${cropRect.h}%`,
             boxShadow: '0 0 0 1px rgba(255,255,255,0.8), 0 0 0 1px rgba(0,0,0,0.5)'
          }}
          onMouseDown={(e) => { e.stopPropagation(); setInteractionMode('crop-move'); setDragStartMouse({x:e.clientX, y:e.clientY}); setDragStartCrop(cropRect); }}
        >
           {/* Grid Lines */}
           <div className="absolute w-full h-full opacity-100 pointer-events-none">
              <div className="absolute top-1/3 w-full h-px bg-white/40"></div>
              <div className="absolute top-2/3 w-full h-px bg-white/40"></div>
              <div className="absolute left-1/3 h-full w-px bg-white/40"></div>
              <div className="absolute left-2/3 h-full w-px bg-white/40"></div>
           </div>

           {/* Corner Handles (Z=30) - Adjusted size for easier clicking */}
           {[
             { pos: '-top-2 -left-2', cursor: 'nw-resize', mode: 'crop-resize-tl' },
             { pos: '-top-2 -right-2', cursor: 'ne-resize', mode: 'crop-resize-tr' },
             { pos: '-bottom-2 -left-2', cursor: 'sw-resize', mode: 'crop-resize-bl' },
             { pos: '-bottom-2 -right-2', cursor: 'se-resize', mode: 'crop-resize-br' },
           ].map((handle, i) => (
             <div 
               key={i}
               className={`absolute ${handle.pos} w-4 h-4 z-30 flex items-center justify-center ${handle.cursor}`}
               onMouseDown={(e) => {
                 e.stopPropagation();
                 setInteractionMode(handle.mode as InteractionMode);
                 setDragStartMouse({x:e.clientX, y:e.clientY});
                 setDragStartCrop(cropRect);
               }}
             >
                <div className="w-4 h-4 bg-white border border-gray-400 rounded-full shadow-sm hover:scale-125 transition-transform"></div>
             </div>
           ))}
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col font-sans">
      
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20 shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center transition-colors">
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">退出</span>
          </button>
          <div className="h-5 w-px bg-gray-200"></div>
          <span className="text-sm font-semibold text-gray-800">图片精修</span>
        </div>
        <div className="flex items-center space-x-3">
             {activeTool !== 'resize' && (
                <div className="flex items-center bg-gray-100/80 rounded-lg p-1 mr-2 border border-gray-200">
                    <button onClick={() => setZoom(z => z - 0.1)} className="p-1.5 hover:bg-white rounded-md text-gray-600"><ZoomOut className="w-4 h-4"/></button>
                    <span className="text-xs w-10 text-center font-mono text-gray-700">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => z + 0.1)} className="p-1.5 hover:bg-white rounded-md text-gray-600"><ZoomIn className="w-4 h-4"/></button>
                </div>
             )}
             <button className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm">
               <Download className="w-4 h-4 mr-2" />
               下载结果
             </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-20 bg-white border-r border-gray-200 flex flex-col py-4 z-20 shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.02)] items-center space-y-4">
           <ToolButton active={activeTool === 'select'} icon={MousePointer2} label="选择" onClick={() => handleToolClick('select')} />
           <ToolButton active={activeTool === 'text'} icon={Type} label="文字" onClick={() => handleToolClick('text')} />
           <ToolButton active={activeTool === 'eraser'} icon={Eraser} label="消除笔" onClick={() => handleToolClick('eraser')} />
           <div className="w-10 h-px bg-gray-200"></div>
           <ToolButton active={activeTool === 'resize'} icon={Ruler} label="尺寸" onClick={() => handleToolClick('resize')} />
           <div className="w-10 h-px bg-gray-200"></div>
           <ToolButton active={activeTool === 'help'} icon={HelpCircle} label="说明" onClick={() => setShowHelpModal(true)} />
        </div>

        {/* Main Canvas Area */}
        <div 
          className={`flex-1 relative overflow-hidden bg-[#F3F4F6] flex items-center justify-center ${activeTool === 'eraser' ? 'cursor-crosshair' : ''}`}
          ref={containerRef}
          onMouseDown={(e) => {
            if (activeTool === 'eraser') {
               setInteractionMode('eraser-draw');
               // Mock: add a dummy mask visual
            } else if (activeTool !== 'resize') {
               setInteractionMode('pan');
               setDragStartMouse({ x: e.clientX, y: e.clientY });
               setDragStartPan(pan);
            }
          }}
          onWheel={(e) => {
             if (activeTool !== 'resize') {
                if (e.ctrlKey) {
                   const d = e.deltaY > 0 ? 0.9 : 1.1;
                   setZoom(z => Math.max(0.1, Math.min(5, z * d)));
                } else {
                   setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
                }
             }
          }}
        >
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-20" 
              style={{
                  backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
              }} 
          />

          {/* Canvas Content */}
          {activeTool === 'resize' ? (
             /* RESIZE MODE: Single Centered Image */
             <div className="relative bg-white shadow-2xl select-none" style={{ width: CANVAS_W, height: CANVAS_H }}>
                <img src="https://picsum.photos/id/175/1000/1200" className="w-full h-full object-cover" draggable={false} />
                {renderCropOverlay()}
             </div>
          ) : (
             /* EDIT MODE: Split View (Side by Side) */
             <div 
                className="flex gap-12 transition-transform duration-75 ease-linear will-change-transform items-start"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
             >
                {/* 1. Original Image (Left) */}
                <div className="relative bg-white shadow-xl ring-1 ring-black/5" style={{ width: 500, height: 600 }}>
                   <div className="absolute -top-10 left-0 bg-white/80 backdrop-blur border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 shadow-sm flex items-center">
                      原图参考
                   </div>
                   <img src="https://picsum.photos/id/175/500/600" className="w-full h-full object-cover" draggable={false} />
                </div>

                {/* 2. Translated Image (Right - Editable) */}
                <div className="relative bg-white shadow-xl ring-1 ring-black/5" style={{ width: 500, height: 600 }}>
                   <div className="absolute -top-10 left-0 bg-blue-50/90 backdrop-blur border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 shadow-sm flex items-center">
                      译文编辑
                   </div>

                   <img src="https://picsum.photos/id/175/500/600?grayscale" className="w-full h-full object-cover opacity-90" draggable={false} />
                   
                   {/* Text Layers */}
                   {layers.map(layer => layer.isVisible && (
                      <div key={layer.id}
                           onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); setActiveTool('select'); }}
                           className={`absolute cursor-pointer flex items-center justify-center group ${selectedLayerId===layer.id && activeTool==='select' ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-300'}`}
                           style={{ left:`${layer.x}%`, top:`${layer.y}%`, width:`${layer.width}%`, height:`${layer.height}%`, backgroundColor: layer.backgroundColor }}
                      >
                         <span style={{ fontSize: `${layer.fontSize}px`, color: layer.color, fontFamily: layer.fontFamily, fontWeight: layer.fontWeight, fontStyle: layer.fontStyle, textDecoration: layer.textDecoration, textAlign: layer.alignment, width:'100%' }} className="pointer-events-none">{layer.translatedText}</span>
                         {/* Selection Handles (Mock) */}
                         {selectedLayerId===layer.id && activeTool==='select' && (
                             <>
                               <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500"></div>
                               <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500"></div>
                               <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500"></div>
                               <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500"></div>
                             </>
                         )}
                      </div>
                   ))}
                   
                   {/* Eraser Mock Overlay */}
                   {activeTool === 'eraser' && (
                       <div className="absolute inset-0 pointer-events-none">
                           {/* Static mock of erased area */}
                           <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-red-500/30 blur-xl rounded-full mix-blend-multiply"></div>
                       </div>
                   )}
                </div>
             </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-[360px] bg-white border-l border-gray-200 flex flex-col z-20 shrink-0 overflow-y-auto">
           {activeTool === 'resize' ? (
             /* Resize Panel */
             <div className="flex flex-col h-full">
               <div className="p-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900 flex items-center"><Maximize className="w-4 h-4 mr-2" />比例调整</h3></div>
               <div className="p-5 space-y-6">
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">预设比例</label>
                   <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                      {RESIZE_PRESETS.map((p) => (
                        <button key={p.label} onClick={() => updateCropByRatio(p.value)} className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 ${resizeRatio === p.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}>
                          {p.label} {resizeRatio === p.value && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-gray-500 mb-1.5 block">宽 (px)</label><input type="number" value={getCurrentPixelSize().w} onChange={(e) => updateCropByPixel('w', Number(e.target.value))} className="w-full text-sm border-gray-300 rounded-md text-center py-2 border shadow-sm" /></div>
                    <div><label className="text-xs text-gray-500 mb-1.5 block">高 (px)</label><input type="number" value={getCurrentPixelSize().h} onChange={(e) => updateCropByPixel('h', Number(e.target.value))} className="w-full text-sm border-gray-300 rounded-md text-center py-2 border shadow-sm" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-3 pt-4">
                    <button onClick={() => updateCropByRatio('original')} className="py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">取消</button>
                    <button onClick={() => setActiveTool('select')} className="py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shadow-sm">应用</button>
                 </div>
               </div>
             </div>
           ) : (
             /* Settings / Layers Tabs */
             <>
               <div className="flex border-b border-gray-200">
                  <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:text-gray-700'}`}>设置</button>
                  <button onClick={() => setActiveTab('layers')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'layers' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:text-gray-700'}`}>图层</button>
               </div>
               
               {activeTab === 'layers' && (
                 <div className="p-2 space-y-1">
                   {layers.map(l => (
                     <div key={l.id} 
                          onClick={() => { setSelectedLayerId(l.id); setActiveTool('select'); }} 
                          className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between group transition-all ${selectedLayerId === l.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                     >
                        <div className="flex items-center space-x-3 overflow-hidden">
                           <Type className="w-4 h-4 text-gray-400" />
                           <span className="truncate text-sm font-medium text-gray-700">{l.translatedText}</span>
                        </div>
                        {selectedLayerId === l.id && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                     </div>
                   ))}
                   {layers.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">暂无图层</div>}
                 </div>
               )}

               {activeTab === 'settings' && selectedLayer ? (
                  <div className="p-5 space-y-6">
                     {/* Tip */}
                     <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-start space-x-2">
                        <Info className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-green-700 leading-tight">可以按住 "Shift" 键选择多个文本来同步设置样式</p>
                     </div>

                     {/* Original Text */}
                     <div className="space-y-2">
                        <div className="flex items-center justify-between">
                           <label className="text-xs font-semibold text-gray-500">原文</label>
                           <button className="flex items-center text-xs text-gray-400 hover:text-blue-600"><Copy className="w-3 h-3 mr-1"/>复制</button>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-600 min-h-[40px] flex items-center">
                           {selectedLayer.originalText}
                        </div>
                     </div>

                     {/* Engine */}
                     <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">翻译引擎</label>
                        <div className="relative">
                           <select 
                              className="w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedLayer.translationEngine}
                              onChange={(e) => updateLayer('translationEngine', e.target.value)}
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
                           <button className="flex items-center text-xs text-blue-600 hover:text-blue-700"><RefreshCw className="w-3 h-3 mr-1"/>重新翻译</button>
                        </div>
                        <textarea 
                           className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]" 
                           value={selectedLayer.translatedText}
                           onChange={e => updateLayer('translatedText', e.target.value)}
                        />
                     </div>

                     {/* Typography */}
                     <div className="space-y-4 pt-4 border-t border-gray-100">
                        <label className="text-xs font-semibold text-gray-500 block">文本样式</label>
                        
                        {/* Font & Size */}
                        <div className="flex gap-2">
                           <select className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm bg-white" value={selectedLayer.fontFamily} onChange={e => updateLayer('fontFamily', e.target.value)}>
                              <option value="Inter">Inter (默认)</option>
                              <option value="Arial">Arial</option>
                              <option value="Times New Roman">Times New Roman</option>
                           </select>
                           <div className="w-20 relative">
                               <input type="number" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center" value={selectedLayer.fontSize} onChange={e => updateLayer('fontSize', Number(e.target.value))} />
                               <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">px</span>
                           </div>
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-2 gap-3">
                           <div>
                              <label className="text-[10px] text-gray-400 mb-1 block">文字颜色</label>
                              <div className="flex items-center space-x-2 border border-gray-300 rounded p-1">
                                 <input type="color" className="w-6 h-6 rounded border-none p-0 cursor-pointer" value={selectedLayer.color} onChange={e => updateLayer('color', e.target.value)} />
                                 <span className="text-xs text-gray-600 font-mono">{selectedLayer.color}</span>
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] text-gray-400 mb-1 block">背景颜色</label>
                              <div className="flex items-center space-x-2 border border-gray-300 rounded p-1">
                                 <div className="w-6 h-6 rounded border border-gray-200 bg-[url('https://www.transparenttextures.com/patterns/transparent-square.png')] overflow-hidden relative">
                                     <input type="color" className="absolute -top-1 -left-1 w-8 h-8 opacity-0 cursor-pointer" value={selectedLayer.backgroundColor === 'transparent' ? '#ffffff' : selectedLayer.backgroundColor} onChange={e => updateLayer('backgroundColor', e.target.value)} />
                                     {selectedLayer.backgroundColor !== 'transparent' && <div className="absolute inset-0" style={{ backgroundColor: selectedLayer.backgroundColor }}></div>}
                                 </div>
                                 <span className="text-xs text-gray-600">{selectedLayer.backgroundColor === 'transparent' ? '无' : '填充'}</span>
                              </div>
                           </div>
                        </div>

                        {/* Formatting */}
                        <div className="flex items-center justify-between border border-gray-300 rounded-lg p-1">
                           <button onClick={() => updateLayer('fontWeight', selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold')} className={`p-1.5 rounded hover:bg-gray-100 ${selectedLayer.fontWeight === 'bold' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}><Bold className="w-4 h-4" /></button>
                           <button onClick={() => updateLayer('fontStyle', selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-1.5 rounded hover:bg-gray-100 ${selectedLayer.fontStyle === 'italic' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}><Italic className="w-4 h-4" /></button>
                           <button onClick={() => updateLayer('textDecoration', selectedLayer.textDecoration === 'underline' ? 'none' : 'underline')} className={`p-1.5 rounded hover:bg-gray-100 ${selectedLayer.textDecoration === 'underline' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}><Underline className="w-4 h-4" /></button>
                           <div className="w-px h-4 bg-gray-200"></div>
                           <button onClick={() => updateLayer('alignment', 'left')} className={`p-1.5 rounded hover:bg-gray-100 ${selectedLayer.alignment === 'left' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}><AlignLeft className="w-4 h-4" /></button>
                           <button onClick={() => updateLayer('alignment', 'center')} className={`p-1.5 rounded hover:bg-gray-100 ${selectedLayer.alignment === 'center' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}><AlignCenter className="w-4 h-4" /></button>
                           <button onClick={() => updateLayer('alignment', 'right')} className={`p-1.5 rounded hover:bg-gray-100 ${selectedLayer.alignment === 'right' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}><AlignRight className="w-4 h-4" /></button>
                        </div>
                     </div>
                  </div>
               ) : (
                  activeTab === 'settings' && <div className="p-10 text-center text-gray-400 text-sm">请选择一个图层以编辑样式</div>
               )}
             </>
           )}
        </div>
      </div>
    </div>
  );
};

const ToolButton: React.FC<{ active: boolean, icon: any, label: string, onClick: () => void }> = ({ active, icon: Icon, label, onClick }) => (
  <button onClick={onClick} className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all mb-1 ${active ? 'bg-blue-50 text-blue-700 shadow-inner' : 'text-gray-500 hover:bg-gray-100'}`}>
    <Icon className={`w-5 h-5 mb-1 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
    <span className="text-[10px] font-medium scale-90">{label}</span>
  </button>
);

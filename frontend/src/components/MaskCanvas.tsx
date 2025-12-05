import { useCallback, useEffect, useRef, useState } from "react";

export interface MaskCanvasProps {
  imageUrl: string;
  width: number;
  height: number;
  onMaskChange: (maskBlob: Blob, mimeType: string) => void;
  brushSize?: number;
  initialTool?: "brush" | "eraser";
}

let webPSupported: boolean | null = null;
async function checkWebPSupport(): Promise<boolean> {
  if (webPSupported !== null) return webPSupported;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      webPSupported = img.width === 1;
      resolve(webPSupported);
    };
    img.onerror = () => {
      webPSupported = false;
      resolve(false);
    };
    img.src =
      "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=";
  });
}

export function MaskCanvas({
  imageUrl,
  width,
  height,
  onMaskChange,
  brushSize = 20,
  initialTool = "brush",
}: MaskCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"brush" | "eraser">(initialTool);
  const [size, setSize] = useState(brushSize);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
  }, [width, height, imageUrl]);

  const getPos = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [width, height]
  );

  const draw = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation =
        tool === "brush" ? "source-over" : "destination-out";
      ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [tool, size]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDrawing(true);
      const pos = getPos(e);
      lastPosRef.current = pos;
      draw(pos, pos);
    },
    [getPos, draw]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !lastPosRef.current) return;
      const pos = getPos(e);
      draw(lastPosRef.current, pos);
      lastPosRef.current = pos;
    },
    [isDrawing, getPos, draw]
  );

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    lastPosRef.current = null;
  }, []);

  const exportMask = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const supportsWebP = await checkWebPSupport();

    const exportBlob = (format: string, quality?: number): Promise<Blob | null> =>
      new Promise((resolve) => {
        canvas.toBlob(resolve, format, quality);
      });

    let blob: Blob | null = null;
    let mimeType = "image/png";

    if (supportsWebP) {
      blob = await exportBlob("image/webp", 0.8);
      if (blob) mimeType = "image/webp";
    }

    if (!blob) {
      blob = await exportBlob("image/png");
      mimeType = "image/png";
    }

    if (blob) {
      onMaskChange(blob, mimeType);
    }
  }, [onMaskChange]);

  const clearMask = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
  }, [width, height]);

  return (
    <div className="mask-canvas-container">
      <div className="mask-canvas-toolbar">
        <button
          type="button"
          className={tool === "brush" ? "active" : ""}
          onClick={() => setTool("brush")}
        >
          画笔
        </button>
        <button
          type="button"
          className={tool === "eraser" ? "active" : ""}
          onClick={() => setTool("eraser")}
        >
          橡皮
        </button>
        <label>
          大小:
          <input
            type="range"
            min={5}
            max={100}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <span>{size}px</span>
        </label>
        <button type="button" onClick={clearMask}>
          清除
        </button>
        <button type="button" onClick={exportMask}>
          应用 Mask
        </button>
      </div>
      <div
        className="mask-canvas-wrapper"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: width,
          aspectRatio: `${width} / ${height}`,
        }}
      >
        <img
          src={imageUrl}
          alt="原图"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            cursor: "crosshair",
            touchAction: "none",
          }}
        />
      </div>
    </div>
  );
}

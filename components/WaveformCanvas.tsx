
import React, { useRef, useEffect, useCallback } from 'react';

interface WaveformCanvasProps {
  data: number[];
  type: string;
  color: string;
}

const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ data, type, color }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use a ref to store latest props so we can access them in the ResizeObserver callback
  // without re-creating the observer or callback on every render.
  const propsRef = useRef({ data, color });
  useEffect(() => {
    propsRef.current = { data, color };
  }, [data, color]);

  const draw = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const { data: currentData, color: currentColor } = propsRef.current;
    
    // 1. Measure Container
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Safety check: Do not draw if container is hidden or collapsed
    if (width === 0 || height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 2. Resize Canvas to match Container (High DPI support)
    const dpr = window.devicePixelRatio || 1;
    
    // Only resize if dimensions actually changed to avoid expensive context reset
    // We check against the internal canvas resolution
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
       canvas.width = width * dpr;
       canvas.height = height * dpr;
       ctx.scale(dpr, dpr);
    }

    // 3. Clear
    ctx.clearRect(0, 0, width, height);

    // Safety check for empty data
    if (!currentData || currentData.length < 2) return;

    // 4. Grid Background (Medical Look)
    ctx.strokeStyle = '#1f2937'; // gray-800
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // 5. Draw Waveform
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // PADDING LOGIC:
    // Reserve 10% or at least 4px padding on top/bottom
    const padding = Math.max(height * 0.1, 4);
    const drawHeight = height - (padding * 2);

    ctx.beginPath();
    
    const stepX = width / Math.max(currentData.length - 1, 1);
    
    currentData.forEach((val, index) => {
      const x = index * stepX;
      // Clamp and normalize value 0-100
      const safeVal = Math.max(0, Math.min(100, val));
      // Map 0-100 to canvas Y (Inverted: 100 is top)
      const y = (height - padding) - ((safeVal / 100) * drawHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // 6. Scan bar / Fade effect
    const fadeWidth = 50;
    const fadeGradient = ctx.createLinearGradient(Math.max(0, width - fadeWidth), 0, width, 0);
    // Use fully transparent start to avoid darkening the line too much
    fadeGradient.addColorStop(0, 'rgba(15, 17, 21, 0)'); 
    fadeGradient.addColorStop(1, '#0f1115'); // Match background color
    ctx.fillStyle = fadeGradient;
    ctx.fillRect(Math.max(0, width - fadeWidth), 0, fadeWidth, height);
  }, []); // Empty deps because we use refs

  // Setup ResizeObserver (Run once)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
       requestAnimationFrame(draw);
    });
    ro.observe(container);

    return () => ro.disconnect();
  }, [draw]);

  // Trigger draw on data update (Run on every tick)
  useEffect(() => {
    requestAnimationFrame(draw);
  }, [data, color, draw]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full"
      />
    </div>
  );
};

export default WaveformCanvas;

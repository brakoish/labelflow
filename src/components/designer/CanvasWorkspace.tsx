'use client';

import { useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
import { useDesignerStore } from '@/lib/store';

export function CanvasWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { currentFormat, canvasState } = useDesignerStore();

  useEffect(() => {
    if (!canvasRef.current || !currentFormat) return;

    // Initialize fabric canvas
    const fabricCanvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: true,
    });

    fabricCanvasRef.current = fabricCanvas;

    // Cleanup
    return () => {
      fabricCanvas.dispose();
    };
  }, [currentFormat]);

  // Handle zoom
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setZoom(canvasState.zoom);
    fabricCanvasRef.current.renderAll();
  }, [canvasState.zoom]);

  if (!currentFormat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-zinc-400 text-sm mb-2">No format selected</p>
          <p className="text-zinc-600 text-xs">Select a format to start designing</p>
        </div>
      </div>
    );
  }

  const DPI = 96; // Screen DPI for display
  const labelWidthPx = currentFormat.labelWidth * DPI;
  const labelHeightPx = currentFormat.labelHeight * DPI;

  return (
    <div ref={containerRef} className="flex-1 bg-[#0a0a0a] relative overflow-hidden">
      {/* Rulers */}
      {canvasState.showRulers && (
        <>
          {/* Horizontal ruler */}
          <div className="absolute top-0 left-14 right-0 h-6 bg-zinc-900/80 border-b border-zinc-800">
            <Ruler orientation="horizontal" length={labelWidthPx} />
          </div>

          {/* Vertical ruler */}
          <div className="absolute left-0 top-6 bottom-0 w-14 bg-zinc-900/80 border-r border-zinc-800">
            <Ruler orientation="vertical" length={labelHeightPx} />
          </div>
        </>
      )}

      {/* Canvas container */}
      <div
        className={`absolute flex items-center justify-center ${
          canvasState.showRulers ? 'top-6 left-14' : 'top-0 left-0'
        } right-0 bottom-0`}
      >
        <div className="relative" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          {/* Grid overlay */}
          {canvasState.showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent ${canvasState.gridSize * DPI - 1}px,
                    #27272a ${canvasState.gridSize * DPI - 1}px,
                    #27272a ${canvasState.gridSize * DPI}px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent ${canvasState.gridSize * DPI - 1}px,
                    #27272a ${canvasState.gridSize * DPI - 1}px,
                    #27272a ${canvasState.gridSize * DPI}px
                  )
                `,
              }}
            />
          )}

          {/* Canvas */}
          <canvas ref={canvasRef} />

          {/* Border */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: '2px dashed #fb923c',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Ruler component
function Ruler({
  orientation,
  length,
}: {
  orientation: 'horizontal' | 'vertical';
  length: number;
}) {
  const DPI = 96;
  const ticks: React.ReactElement[] = [];

  // Generate ticks for each 1/8 inch
  const totalInches = length / DPI;
  const tickCount = Math.ceil(totalInches / 0.125);

  for (let i = 0; i <= tickCount; i++) {
    const position = i * 0.125 * DPI;
    const isMajor = i % 8 === 0; // Every inch
    const isHalf = i % 4 === 0; // Every 1/2 inch

    const tickHeight = isMajor ? 12 : isHalf ? 8 : 4;

    ticks.push(
      <div
        key={i}
        className="absolute bg-zinc-500"
        style={
          orientation === 'horizontal'
            ? {
                left: `${position}px`,
                bottom: 0,
                width: '1px',
                height: `${tickHeight}px`,
              }
            : {
                top: `${position}px`,
                right: 0,
                height: '1px',
                width: `${tickHeight}px`,
              }
        }
      />
    );

    // Add labels for major ticks
    if (isMajor) {
      ticks.push(
        <div
          key={`label-${i}`}
          className="absolute text-[10px] text-zinc-400 font-mono"
          style={
            orientation === 'horizontal'
              ? {
                  left: `${position + 2}px`,
                  top: '2px',
                }
              : {
                  top: `${position + 2}px`,
                  left: '2px',
                }
          }
        >
          {i / 8}"
        </div>
      );
    }
  }

  return <div className="relative w-full h-full">{ticks}</div>;
}

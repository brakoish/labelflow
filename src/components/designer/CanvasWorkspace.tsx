'use client';

import { useEffect, useRef } from 'react';
import { Canvas, FabricObject, IText, Rect, Ellipse, Line, FabricImage } from 'fabric';
import { useDesignerStore } from '@/lib/store';
import { CanvasElement } from '@/lib/types';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

// Extend FabricObject to include elementId
declare module 'fabric' {
  interface FabricObject {
    elementId?: string;
  }
}

export function CanvasWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentFormat = useDesignerStore((s) => s.currentFormat);
  const canvasState = useDesignerStore((s) => s.canvasState);
  const currentDesign = useDesignerStore((s) => s.currentDesign);

  // Use refs for values needed in event handlers to avoid re-creating canvas
  const activeToolRef = useRef(useDesignerStore.getState().activeTool);
  const currentDesignRef = useRef(currentDesign);

  // Keep refs in sync
  useEffect(() => {
    const unsub = useDesignerStore.subscribe((state) => {
      activeToolRef.current = state.activeTool;
      currentDesignRef.current = state.currentDesign;
    });
    return unsub;
  }, []);

  useEffect(() => {
    currentDesignRef.current = currentDesign;
  }, [currentDesign]);

  useEffect(() => {
    if (!canvasRef.current || !currentFormat) return;

    const DPI = 96;
    const canvasWidth = currentFormat.labelWidth * DPI;
    const canvasHeight = currentFormat.labelHeight * DPI;

    // Initialize fabric canvas
    const fabricCanvas = new Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
      selection: true,
    });

    fabricCanvasRef.current = fabricCanvas;

    // Handle canvas click for adding elements
    const handleCanvasClick = (e: any) => {
      const tool = activeToolRef.current;
      if (tool === 'select') return;

      // Fabric.js v6 uses scenePoint, not pointer
      const pointer = e.scenePoint || e.viewportPoint || e.pointer;
      if (!pointer) return;

      const x = pointer.x / DPI;
      const y = pointer.y / DPI;

      addElementAtPosition(fabricCanvas, x, y, tool, DPI);
    };

    fabricCanvas.on('mouse:down', handleCanvasClick);

    // Handle object selection
    fabricCanvas.on('selection:created', (e: any) => {
      const selectedIds = e.selected?.map((obj: any) => obj.elementId).filter(Boolean) || [];
      useDesignerStore.getState().setSelectedElements(selectedIds);
    });

    fabricCanvas.on('selection:updated', (e: any) => {
      const selectedIds = e.selected?.map((obj: any) => obj.elementId).filter(Boolean) || [];
      useDesignerStore.getState().setSelectedElements(selectedIds);
    });

    fabricCanvas.on('selection:cleared', () => {
      useDesignerStore.getState().setSelectedElements([]);
    });

    // Handle object modification (move/resize)
    fabricCanvas.on('object:modified', (e: any) => {
      const obj = e.target;
      if (!obj || !obj.elementId) return;

      const updates: Partial<CanvasElement> = {
        x: (obj.left || 0) / DPI,
        y: (obj.top || 0) / DPI,
        width: (obj.getScaledWidth() || 0) / DPI,
        height: (obj.getScaledHeight() || 0) / DPI,
        rotation: obj.angle || 0,
      };

      useDesignerStore.getState().updateElement(obj.elementId, updates);
    });

    // Handle keyboard delete
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't delete if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && fabricCanvas.getActiveObject()) {
        const activeObjects = fabricCanvas.getActiveObjects();
        activeObjects.forEach(obj => fabricCanvas.remove(obj));
        useDesignerStore.getState().deleteSelectedElements();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Handle property panel updates
    const handleElementUpdate = (e: CustomEvent) => {
      const { id, field, value } = e.detail;
      const obj = fabricCanvas.getObjects().find((o: any) => o.elementId === id);
      if (!obj) return;

      // Update the fabric object based on field
      switch (field) {
        case 'x':
          obj.set({ left: value * DPI });
          break;
        case 'y':
          obj.set({ top: value * DPI });
          break;
        case 'width':
          obj.set({ scaleX: (value * DPI) / (obj.width || 1) });
          break;
        case 'height':
          obj.set({ scaleY: (value * DPI) / (obj.height || 1) });
          break;
        case 'rotation':
          obj.set({ angle: value });
          break;
        case 'text':
          if ('text' in obj) obj.set({ text: value });
          break;
        case 'fontSize':
          if ('fontSize' in obj) obj.set({ fontSize: value });
          break;
        case 'fontFamily':
          if ('fontFamily' in obj) obj.set({ fontFamily: value });
          break;
        case 'fontWeight':
          if ('fontWeight' in obj) obj.set({ fontWeight: value });
          break;
        case 'textAlign':
          if ('textAlign' in obj) obj.set({ textAlign: value });
          break;
        case 'color':
          if ('fill' in obj) obj.set({ fill: value });
          break;
        case 'fillColor':
          obj.set({ fill: value });
          break;
        case 'strokeColor':
          obj.set({ stroke: value });
          break;
        case 'strokeWidth':
          obj.set({ strokeWidth: value });
          break;
        case 'cornerRadius':
          if ('rx' in obj && 'ry' in obj) {
            obj.set({ rx: value, ry: value });
          }
          break;
      }

      fabricCanvas.renderAll();
    };

    window.addEventListener('element-updated', handleElementUpdate as EventListener);

    // Handle save with thumbnail
    const handleSave = () => {
      const thumbnail = fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.25, // Scale down for smaller file size
      });

      const store = useDesignerStore.getState();
      store.saveCurrentDesign(thumbnail);

      // Show success notification (simple alert for now)
      alert('Design saved successfully!');
    };

    window.addEventListener('save-design', handleSave);

    // Load existing elements from the design
    if (currentDesign) {
      currentDesign.elements.forEach(async (element) => {
        await loadElementToCanvas(fabricCanvas, element, DPI);
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('element-updated', handleElementUpdate as EventListener);
      window.removeEventListener('save-design', handleSave);
      fabricCanvas.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFormat]);

  // Helper to load existing elements to canvas
  const loadElementToCanvas = async (fabricCanvas: Canvas, element: CanvasElement, DPI: number) => {
    let fabricObject: FabricObject | null = null;

    try {
      switch (element.type) {
        case 'text':
          fabricObject = new IText(element.text || 'Text', {
            left: element.x * DPI,
            top: element.y * DPI,
            fontSize: element.fontSize || 14,
            fontFamily: element.fontFamily || 'Arial',
            fill: element.color || '#000000',
            fontWeight: element.fontWeight || 'normal',
            textAlign: element.textAlign || 'left',
          });
          break;

        case 'qr':
          const qrDataUrl = await QRCode.toDataURL(element.qrData || 'https://example.com', { width: element.width * DPI });
          fabricObject = await FabricImage.fromURL(qrDataUrl);
          fabricObject.set({ left: element.x * DPI, top: element.y * DPI });
          break;

        case 'barcode':
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, element.barcodeData || '123456789012', {
            format: element.barcodeFormat || 'CODE128',
            displayValue: element.showBarcodeText !== false,
          });
          fabricObject = await FabricImage.fromURL(canvas.toDataURL());
          fabricObject.set({ left: element.x * DPI, top: element.y * DPI });
          break;

        case 'image':
          if (element.imageData) {
            fabricObject = await FabricImage.fromURL(element.imageData);
            fabricObject.set({
              left: element.x * DPI,
              top: element.y * DPI,
              scaleX: element.width / (fabricObject.width || 1),
              scaleY: element.height / (fabricObject.height || 1),
            });
          }
          break;

        case 'shape':
          if (element.shapeType === 'rect') {
            fabricObject = new Rect({
              left: element.x * DPI,
              top: element.y * DPI,
              width: element.width * DPI,
              height: element.height * DPI,
              fill: element.fillColor || 'transparent',
              stroke: element.strokeColor || '#000000',
              strokeWidth: element.strokeWidth || 2,
              rx: element.cornerRadius || 0,
              ry: element.cornerRadius || 0,
            });
          } else if (element.shapeType === 'circle') {
            fabricObject = new Ellipse({
              left: element.x * DPI,
              top: element.y * DPI,
              rx: (element.width * DPI) / 2,
              ry: (element.height * DPI) / 2,
              fill: element.fillColor || 'transparent',
              stroke: element.strokeColor || '#000000',
              strokeWidth: element.strokeWidth || 2,
            });
          } else if (element.shapeType === 'line') {
            fabricObject = new Line(
              [element.x * DPI, element.y * DPI, (element.x + element.width) * DPI, (element.y + element.height) * DPI],
              {
                stroke: element.strokeColor || '#000000',
                strokeWidth: element.strokeWidth || 2,
              }
            );
          }
          break;
      }

      if (fabricObject) {
        fabricObject.elementId = element.id;
        if (element.rotation) fabricObject.set({ angle: element.rotation });
        fabricCanvas.add(fabricObject);
      }
    } catch (err) {
      console.error('Error loading element to canvas:', err);
    }
  };

  // Handle zoom
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setZoom(canvasState.zoom);
    fabricCanvasRef.current.renderAll();
  }, [canvasState.zoom]);

  // Helper function to add elements to canvas
  const addElementAtPosition = async (fabricCanvas: Canvas, x: number, y: number, tool: string, DPI: number) => {
    if (!currentDesignRef.current) return;

    const elementId = crypto.randomUUID();
    let fabricObject: FabricObject | null = null;
    let element: CanvasElement | null = null;
    const { addElement: storeAddElement, setActiveTool: storeSetActiveTool } = useDesignerStore.getState();

    switch (tool) {
      case 'text':
        const text = new IText('Text', {
          left: x * DPI,
          top: y * DPI,
          fontSize: 14,
          fontFamily: 'Arial',
          fill: '#000000',
        });
        fabricObject = text;
        element = {
          id: elementId,
          type: 'text',
          x,
          y,
          width: text.width! / DPI,
          height: text.height! / DPI,
          text: 'Text',
          fontFamily: 'Arial',
          fontSize: 14,
          color: '#000000',
          textAlign: 'left',
        };
        break;

      case 'qr':
        try {
          const qrDataUrl = await QRCode.toDataURL('https://example.com', { width: 96 });
          const img = await FabricImage.fromURL(qrDataUrl);
          img.set({ left: x * DPI, top: y * DPI, scaleX: 1, scaleY: 1 });
          fabricObject = img;
          element = {
            id: elementId,
            type: 'qr',
            x,
            y,
            width: 1,
            height: 1,
            qrData: 'https://example.com',
            qrErrorCorrection: 'M',
          };
        } catch (err) {
          console.error('Error creating QR code:', err);
          return;
        }
        break;

      case 'barcode':
        try {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, '123456789012', { format: 'CODE128', width: 2, height: 50 });
          const barcodeDataUrl = canvas.toDataURL();
          const img = await FabricImage.fromURL(barcodeDataUrl);
          img.set({ left: x * DPI, top: y * DPI });
          fabricObject = img;
          element = {
            id: elementId,
            type: 'barcode',
            x,
            y,
            width: img.width! / DPI,
            height: img.height! / DPI,
            barcodeData: '123456789012',
            barcodeFormat: 'CODE128',
            showBarcodeText: true,
          };
        } catch (err) {
          console.error('Error creating barcode:', err);
          return;
        }
        break;

      case 'image':
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            const img = await FabricImage.fromURL(dataUrl);
            img.set({ left: x * DPI, top: y * DPI });
            img.elementId = elementId;
            fabricCanvas.add(img);

            const imgElement: CanvasElement = {
              id: elementId,
              type: 'image',
              x,
              y,
              width: img.width! / DPI,
              height: img.height! / DPI,
              imageData: dataUrl,
            };
            storeAddElement(imgElement);
            storeSetActiveTool('select');
            fabricCanvas.setActiveObject(img);
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;

      case 'rectangle':
        const rect = new Rect({
          left: x * DPI,
          top: y * DPI,
          width: 96,
          height: 96,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
        });
        fabricObject = rect;
        element = {
          id: elementId,
          type: 'shape',
          shapeType: 'rect',
          x,
          y,
          width: 1,
          height: 1,
          fillColor: 'transparent',
          strokeColor: '#000000',
          strokeWidth: 2,
        };
        break;

      case 'ellipse':
        const ellipse = new Ellipse({
          left: x * DPI,
          top: y * DPI,
          rx: 48,
          ry: 48,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
        });
        fabricObject = ellipse;
        element = {
          id: elementId,
          type: 'shape',
          shapeType: 'circle',
          x,
          y,
          width: 1,
          height: 1,
          fillColor: 'transparent',
          strokeColor: '#000000',
          strokeWidth: 2,
        };
        break;

      case 'line':
        const line = new Line([x * DPI, y * DPI, (x + 2) * DPI, y * DPI], {
          stroke: '#000000',
          strokeWidth: 2,
        });
        fabricObject = line;
        element = {
          id: elementId,
          type: 'shape',
          shapeType: 'line',
          x,
          y,
          width: 2,
          height: 0,
          strokeColor: '#000000',
          strokeWidth: 2,
        };
        break;
    }

    if (fabricObject && element) {
      fabricObject.elementId = elementId;
      fabricCanvas.add(fabricObject);
      storeAddElement(element);
      storeSetActiveTool('select');
      fabricCanvas.setActiveObject(fabricObject);
      fabricCanvas.renderAll();
    }
  };

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

'use client';

import { useEffect, useState, useRef } from 'react';
import * as fabric from 'fabric';
import { LabelFormat, CanvasElement, PrintSettings } from '@/lib/types';
import { getFormats, initializeDefaultFormats, saveDesign, getDesigns } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

const DPI = 96; // Screen DPI for canvas display

export default function DesignerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [formats, setFormats] = useState<LabelFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<LabelFormat | null>(null);
  const [selectedElement, setSelectedElement] = useState<fabric.Object | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    mode: 'thermal',
    safeMargin: 0.05,
    dpi: 203,
    darkness: 15,
    printSpeed: 4,
    mediaType: 'direct',
  });
  const [customWidth, setCustomWidth] = useState('2');
  const [customHeight, setCustomHeight] = useState('1');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [designName, setDesignName] = useState('Untitled Label');

  useEffect(() => {
    initializeDefaultFormats();
    const loadedFormats = getFormats();
    setFormats(loadedFormats);
    if (loadedFormats.length > 0) {
      setSelectedFormat(loadedFormats[0]);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !selectedFormat) return;

    // Clear existing canvas
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    // Calculate canvas size in pixels
    const labelWidthPx = selectedFormat.labelWidth * DPI;
    const labelHeightPx = selectedFormat.labelHeight * DPI;

    // Initialize Fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: labelWidthPx,
      height: labelHeightPx,
      backgroundColor: '#ffffff',
    });

    fabricCanvasRef.current = canvas;

    // Handle selection
    canvas.on('selection:created', (e: any) => {
      setSelectedElement(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e: any) => {
      setSelectedElement(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedElement(null);
    });

    return () => {
      canvas.dispose();
    };
  }, [selectedFormat]);

  const addText = async () => {
    if (!fabricCanvasRef.current || !selectedFormat) return;

    const text = new fabric.IText('Sample Text', {
      left: (selectedFormat.labelWidth * DPI) / 2,
      top: (selectedFormat.labelHeight * DPI) / 2,
      fontSize: 24,
      fill: '#000000',
      fontFamily: 'Arial',
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  };

  const addQRCode = async () => {
    if (!fabricCanvasRef.current || !selectedFormat) return;

    try {
      const qrDataUrl = await QRCode.toDataURL('https://example.com', {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M',
      });

      const img = await fabric.Image.fromURL(qrDataUrl);
      if (!fabricCanvasRef.current || !selectedFormat) return;

      img.set({
        left: (selectedFormat.labelWidth * DPI) / 2 - 50,
        top: (selectedFormat.labelHeight * DPI) / 2 - 50,
        scaleX: 0.5,
        scaleY: 0.5,
      });

      (img as any).qrData = 'https://example.com';
      (img as any).elementType = 'qr';

      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);
      fabricCanvasRef.current.renderAll();
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const addBarcode = async () => {
    if (!fabricCanvasRef.current || !selectedFormat) return;

    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, '123456789012', {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
      });

      const barcodeDataUrl = canvas.toDataURL();

      const img = await fabric.Image.fromURL(barcodeDataUrl);
      if (!fabricCanvasRef.current || !selectedFormat) return;

      img.set({
        left: (selectedFormat.labelWidth * DPI) / 2 - 100,
        top: (selectedFormat.labelHeight * DPI) / 2 - 25,
        scaleX: 0.8,
        scaleY: 0.8,
      });

      (img as any).barcodeData = '123456789012';
      (img as any).barcodeFormat = 'CODE128';
      (img as any).elementType = 'barcode';

      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);
      fabricCanvasRef.current.renderAll();
    } catch (error) {
      console.error('Error generating barcode:', error);
    }
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !fabricCanvasRef.current || !selectedFormat) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;

        const img = await fabric.Image.fromURL(dataUrl);
        if (!fabricCanvasRef.current || !selectedFormat) return;

        img.set({
          left: (selectedFormat.labelWidth * DPI) / 2 - 50,
          top: (selectedFormat.labelHeight * DPI) / 2 - 50,
          scaleX: 0.5,
          scaleY: 0.5,
        });

        (img as any).imageData = dataUrl;
        (img as any).elementType = 'image';

        fabricCanvasRef.current.add(img);
        fabricCanvasRef.current.setActiveObject(img);
        fabricCanvasRef.current.renderAll();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addShape = () => {
    if (!fabricCanvasRef.current || !selectedFormat) return;

    const rect = new fabric.Rect({
      left: (selectedFormat.labelWidth * DPI) / 2 - 50,
      top: (selectedFormat.labelHeight * DPI) / 2 - 50,
      width: 100,
      height: 100,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 2,
    });

    rect.set('elementType', 'shape');
    rect.set('shapeType', 'rect');

    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    fabricCanvasRef.current.renderAll();
  };

  const handleSave = () => {
    if (!fabricCanvasRef.current || !selectedFormat) return;

    const design = {
      id: currentDesignId || uuidv4(),
      name: designName,
      formatId: selectedFormat.id,
      elements: [], // TODO: serialize canvas elements
      createdAt: currentDesignId ? getDesigns().find(d => d.id === currentDesignId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveDesign(design);
    setCurrentDesignId(design.id);
    alert('Layout saved!');
  };

  const handleDelete = () => {
    if (!fabricCanvasRef.current || !selectedElement) return;

    fabricCanvasRef.current.remove(selectedElement);
    fabricCanvasRef.current.renderAll();
    setSelectedElement(null);
  };

  return (
    <div className="h-full flex bg-gray-950">
      {/* Left Panel - Add Element */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add Element</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={addText}
            className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
          >
            <span className="text-2xl mb-2">T</span>
            <span className="text-sm text-gray-300">Text</span>
          </button>
          <button
            onClick={addQRCode}
            className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
          >
            <span className="text-2xl mb-2">⊞</span>
            <span className="text-sm text-gray-300">QR Code</span>
          </button>
          <button
            onClick={addBarcode}
            className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
          >
            <span className="text-2xl mb-2">|||</span>
            <span className="text-sm text-gray-300">Barcode</span>
          </button>
          <button
            onClick={addImage}
            className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
          >
            <span className="text-2xl mb-2">🖼</span>
            <span className="text-sm text-gray-300">Image</span>
          </button>
          <button
            onClick={addShape}
            className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors col-span-2"
          >
            <span className="text-2xl mb-2">▭</span>
            <span className="text-sm text-gray-300">Shape</span>
          </button>
        </div>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Layout Builder</h1>
            <p className="text-sm text-gray-400">Design layouts by adding and arranging elements on a canvas</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <select
                value={selectedFormat?.id || ''}
                onChange={(e) => {
                  const format = formats.find((f) => f.id === e.target.value);
                  setSelectedFormat(format || null);
                }}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Quick size...</option>
                {formats.map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.name}
                  </option>
                ))}
              </select>
              <span className="text-gray-500">or</span>
              <input
                type="number"
                step="0.1"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="w-16 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="W"
              />
              <span className="text-gray-500">×</span>
              <input
                type="number"
                step="0.1"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                className="w-16 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="H"
              />
              <span className="text-gray-400 text-sm">"</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Layouts</span>
              <div className="px-2 py-1 bg-gray-800 rounded text-white text-sm">1</div>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <span>💾</span>
              Save layout
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-950 p-8 overflow-auto">
          <div className="flex items-center justify-center min-h-full">
            <div className="relative">
              <canvas ref={canvasRef} className="border-2 border-dashed border-orange-500 shadow-lg" />
              {selectedFormat && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded">
                  {selectedFormat.labelWidth}" × {selectedFormat.labelHeight}"
                </div>
              )}
              {!selectedElement && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-500 text-center">
                    Add an element from the panel to start building your label
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">⚙ Print Settings</h2>
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          {!selectedElement ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Print mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrintSettings({ ...printSettings, mode: 'thermal' })}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      printSettings.mode === 'thermal'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300'
                    }`}
                  >
                    <span className="mr-2">🖨</span>
                    Thermal
                  </button>
                  <button
                    onClick={() => setPrintSettings({ ...printSettings, mode: 'sheet' })}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      printSettings.mode === 'sheet'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300'
                    }`}
                  >
                    <span className="mr-2">⊞</span>
                    Sheet
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Safe margin</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={printSettings.safeMargin}
                    onChange={(e) => setPrintSettings({ ...printSettings, safeMargin: parseFloat(e.target.value) })}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400">"</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Printer DPI</label>
                <select
                  value={printSettings.dpi}
                  onChange={(e) => setPrintSettings({ ...printSettings, dpi: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="203">203 DPI (standard)</option>
                  <option value="300">300 DPI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Darkness: {printSettings.darkness}
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={printSettings.darkness}
                  onChange={(e) => setPrintSettings({ ...printSettings, darkness: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Print speed: {printSettings.printSpeed} ips
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={printSettings.printSpeed}
                  onChange={(e) => setPrintSettings({ ...printSettings, printSpeed: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Media type</label>
                <select
                  value={printSettings.mediaType}
                  onChange={(e) => setPrintSettings({ ...printSettings, mediaType: e.target.value as 'direct' | 'transfer' })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="direct">Direct Thermal</option>
                  <option value="transfer">Thermal Transfer</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Element Properties</h3>

              {selectedElement && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">X</label>
                      <input
                        type="number"
                        step="0.01"
                        value={((selectedElement.left || 0) / DPI).toFixed(2)}
                        onChange={(e) => {
                          selectedElement.set('left', parseFloat(e.target.value) * DPI);
                          fabricCanvasRef.current?.renderAll();
                        }}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Y</label>
                      <input
                        type="number"
                        step="0.01"
                        value={((selectedElement.top || 0) / DPI).toFixed(2)}
                        onChange={(e) => {
                          selectedElement.set('top', parseFloat(e.target.value) * DPI);
                          fabricCanvasRef.current?.renderAll();
                        }}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {selectedElement.type === 'i-text' && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Font size</label>
                        <input
                          type="number"
                          value={(selectedElement as fabric.IText).fontSize || 24}
                          onChange={(e) => {
                            (selectedElement as fabric.IText).set('fontSize', parseInt(e.target.value));
                            fabricCanvasRef.current?.renderAll();
                          }}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Font family</label>
                        <select
                          value={(selectedElement as fabric.IText).fontFamily || 'Arial'}
                          onChange={(e) => {
                            (selectedElement as fabric.IText).set('fontFamily', e.target.value);
                            fabricCanvasRef.current?.renderAll();
                          }}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Georgia">Georgia</option>
                        </select>
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete Element
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Live Preview</h3>
            <div className="bg-white rounded-lg p-4 flex items-center justify-center" style={{ aspectRatio: '1' }}>
              <div className="text-gray-400 text-sm">Preview placeholder</div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              203 DPI simulation with sample data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

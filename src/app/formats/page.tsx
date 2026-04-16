'use client';

import { useEffect, useState } from 'react';
import { useFormatsStore } from '@/lib/store';
import { LabelFormat } from '@/lib/types';
import FormatGridPreview from '@/components/FormatGridPreview';
import { Plus, Upload, Edit2, Trash2, Tag } from 'lucide-react';
import Link from 'next/link';

export default function FormatsPage() {
  const { formats, loadFormats, deleteFormat: deleteFormatFromStore } = useFormatsStore();
  const [selectedFormat, setSelectedFormat] = useState<LabelFormat | null>(null);

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  useEffect(() => {
    if (formats.length > 0 && !selectedFormat) {
      setSelectedFormat(formats[0]);
    }
  }, [formats, selectedFormat]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this format?')) {
      deleteFormatFromStore(id);
      if (selectedFormat?.id === id) {
        setSelectedFormat(formats[0] || null);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Top bar with navigation */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-6 gap-4">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
          ← Designer
        </Link>
        <div className="w-px h-6 bg-zinc-700" />
        <h1 className="text-lg font-semibold text-white">Label Formats</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Format list */}
        <div className="w-96 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-md flex items-center justify-center gap-2">
                <Plus size={16} />
                New Format
              </button>
              <button className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-md flex items-center gap-2">
                <Upload size={16} />
                Import PDF
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedFormat?.id === format.id
                    ? 'bg-zinc-800 border-indigo-500'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1">{format.name}</h3>
                    <p className="text-xs text-zinc-400 mb-2">
                      {format.labelWidth}" × {format.labelHeight}"
                    </p>
                    {format.type === 'sheet' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                          {format.labelsPerSheet} labels/sheet
                        </span>
                      </div>
                    )}
                    {format.type === 'thermal' && (
                      <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded">
                        Thermal Roll
                      </span>
                    )}
                  </div>

                  {format.type === 'sheet' && (
                    <div className="w-16 h-16 flex-shrink-0">
                      <FormatGridPreview format={format} className="w-full h-full" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Format details */}
        <div className="flex-1 overflow-y-auto">
          {selectedFormat ? (
            <div className="max-w-3xl mx-auto p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedFormat.name}</h2>
                  <p className="text-zinc-400">
                    {selectedFormat.type === 'sheet' ? 'Sheet Labels' : 'Thermal Roll'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md">
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedFormat.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {selectedFormat.type === 'sheet' && (
                <div className="mb-8 bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-4">Sheet Preview</h3>
                  <FormatGridPreview format={selectedFormat} className="mb-4" />
                  <p className="text-xs text-zinc-500 text-center">
                    {selectedFormat.columns} × {selectedFormat.rows} grid — {selectedFormat.labelsPerSheet} labels per sheet
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">Label Dimensions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Width</p>
                      <p className="text-lg font-mono text-white">{selectedFormat.labelWidth}"</p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Height</p>
                      <p className="text-lg font-mono text-white">{selectedFormat.labelHeight}"</p>
                    </div>
                  </div>
                </div>

                {selectedFormat.type === 'sheet' && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Sheet Dimensions</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Sheet Width</p>
                          <p className="text-lg font-mono text-white">{selectedFormat.sheetWidth}"</p>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Sheet Height</p>
                          <p className="text-lg font-mono text-white">{selectedFormat.sheetHeight}"</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Grid Layout</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Columns</p>
                          <p className="text-lg font-mono text-white">{selectedFormat.columns}</p>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Rows</p>
                          <p className="text-lg font-mono text-white">{selectedFormat.rows}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Margins & Gaps</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Top Margin</p>
                          <p className="text-lg font-mono text-white">{selectedFormat.topMargin}"</p>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Side Margin</p>
                          <p className="text-lg font-mono text-white">{selectedFormat.sideMargin}"</p>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Horizontal Gap</p>
                          <p className="text-lg font-mono text-white">{selectedFormat.horizontalGap}"</p>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Vertical Gap</p>
                          <p className="text-lg font-mono text-white">{selectedFormat.verticalGap}"</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {selectedFormat.type === 'thermal' && selectedFormat.dpi && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-300 mb-3">Printer Settings</h3>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">DPI</p>
                      <p className="text-lg font-mono text-white">{selectedFormat.dpi}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">Select a format to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

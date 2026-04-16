'use client';

import { useEffect, useState } from 'react';
import { LabelFormat } from '@/lib/types';
import { getFormats, initializeDefaultFormats, deleteFormat } from '@/lib/store';
import FormatGridPreview from '@/components/FormatGridPreview';
import AddFormatModal from '@/components/AddFormatModal';

export default function FormatsPage() {
  const [formats, setFormats] = useState<LabelFormat[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    initializeDefaultFormats();
    loadFormats();
  }, []);

  const loadFormats = () => {
    setFormats(getFormats());
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this format?')) {
      deleteFormat(id);
      loadFormats();
    }
  };

  return (
    <div className="min-h-full bg-gray-950">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Label Formats</h1>
          <p className="text-gray-400">
            Physical sheet dimensions — labels per sheet, grid layout, margins, and gaps. Upload a manufacturer PDF (Avery, OnlineLabels, etc.) to auto-extract specs.
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Add manually
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
            <span>↑</span>
            Upload PDF template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formats.map((format) => (
            <div
              key={format.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">{format.name}</h3>
                <p className="text-sm text-gray-400">{format.description}</p>
              </div>

              <div className="mb-6 flex justify-center">
                {format.type === 'sheet' && <FormatGridPreview format={format} />}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Dimensions</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Label size</span>
                      <span className="text-white font-mono">
                        {format.labelWidth}" × {format.labelHeight}"
                      </span>
                    </div>
                    {format.type === 'sheet' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Sheet</span>
                          <span className="text-white font-mono">
                            {format.sheetWidth}" × {format.sheetHeight}"
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Grid</span>
                          <span className="text-white font-mono">
                            {format.columns} col × {format.rows} row
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Labels / sheet</span>
                          <span className="text-white font-mono">{format.labelsPerSheet}</span>
                        </div>
                      </>
                    )}
                    {format.type === 'thermal' && format.dpi && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">DPI</span>
                        <span className="text-white font-mono">{format.dpi}</span>
                      </div>
                    )}
                  </div>
                </div>

                {format.type === 'sheet' && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Margins & Gaps</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Top margin</span>
                        <span className="text-white font-mono">{format.topMargin}"</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Side margin</span>
                        <span className="text-white font-mono">{format.sideMargin}"</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Horizontal gap</span>
                        <span className="text-white font-mono">{format.horizontalGap}"</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vertical gap</span>
                        <span className="text-white font-mono">
                          {format.verticalGap === 0 ? 'none' : `${format.verticalGap}"`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end gap-2">
                <button className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(format.id)}
                  className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddFormatModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={loadFormats}
      />
    </div>
  );
}

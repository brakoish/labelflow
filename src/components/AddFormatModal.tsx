'use client';

import { useState, useEffect } from 'react';
import { LabelFormat } from '@/lib/types';
import { saveFormat } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import FormatGridPreview from './FormatGridPreview';

interface AddFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function AddFormatModal({ isOpen, onClose, onSave }: AddFormatModalProps) {
  const [formatType, setFormatType] = useState<'thermal' | 'sheet'>('sheet');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Label dimensions
  const [labelWidth, setLabelWidth] = useState('2.625');
  const [labelHeight, setLabelHeight] = useState('1');

  // Sheet-specific
  const [sheetWidth, setSheetWidth] = useState('8.5');
  const [sheetHeight, setSheetHeight] = useState('11');
  const [columns, setColumns] = useState('3');
  const [rows, setRows] = useState('10');
  const [topMargin, setTopMargin] = useState('0.5');
  const [sideMargin, setSideMargin] = useState('0.1875');
  const [horizontalGap, setHorizontalGap] = useState('0.125');
  const [verticalGap, setVerticalGap] = useState('0');

  // Thermal-specific
  const [dpi, setDpi] = useState('203');

  const labelsPerSheet = parseInt(columns) * parseInt(rows);

  const previewFormat: LabelFormat = {
    id: 'preview',
    name: name || 'Preview',
    type: formatType,
    labelWidth: parseFloat(labelWidth) || 0,
    labelHeight: parseFloat(labelHeight) || 0,
    ...(formatType === 'sheet' && {
      sheetWidth: parseFloat(sheetWidth) || 0,
      sheetHeight: parseFloat(sheetHeight) || 0,
      columns: parseInt(columns) || 0,
      rows: parseInt(rows) || 0,
      labelsPerSheet,
      topMargin: parseFloat(topMargin) || 0,
      sideMargin: parseFloat(sideMargin) || 0,
      horizontalGap: parseFloat(horizontalGap) || 0,
      verticalGap: parseFloat(verticalGap) || 0,
    }),
    ...(formatType === 'thermal' && {
      dpi: parseInt(dpi) || 203,
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleSave = () => {
    const format: LabelFormat = {
      ...previewFormat,
      id: uuidv4(),
      name,
      description,
    };

    saveFormat(format);
    onSave();
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setName('');
    setDescription('');
    setLabelWidth('2.625');
    setLabelHeight('1');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Review extracted dimensions</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-400 mb-6">
            We extracted these specs from the PDF. Review and correct anything before saving.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column - Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Format name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-blue-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Avery 5160"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 160 labels per sheet (8×20), 1&quot; × 0.5&quot;"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase mb-2">Label Size</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Width (")</label>
                    <input
                      type="number"
                      step="0.001"
                      value={labelWidth}
                      onChange={(e) => setLabelWidth(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Height (")</label>
                    <input
                      type="number"
                      step="0.001"
                      value={labelHeight}
                      onChange={(e) => setLabelHeight(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {formatType === 'sheet' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 uppercase mb-2">Grid Layout</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Columns</label>
                        <input
                          type="number"
                          value={columns}
                          onChange={(e) => setColumns(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Rows</label>
                        <input
                          type="number"
                          value={rows}
                          onChange={(e) => setRows(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Labels / sheet</label>
                        <input
                          type="number"
                          value={labelsPerSheet}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 uppercase mb-2">Sheet Size</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Width (")</label>
                        <input
                          type="number"
                          step="0.1"
                          value={sheetWidth}
                          onChange={(e) => setSheetWidth(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Height (")</label>
                        <input
                          type="number"
                          step="0.1"
                          value={sheetHeight}
                          onChange={(e) => setSheetHeight(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 uppercase mb-2">Margins & Gaps</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Top margin (")</label>
                        <input
                          type="number"
                          step="0.001"
                          value={topMargin}
                          onChange={(e) => setTopMargin(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Side margin (")</label>
                        <input
                          type="number"
                          step="0.001"
                          value={sideMargin}
                          onChange={(e) => setSideMargin(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Horizontal gap (")</label>
                        <input
                          type="number"
                          step="0.001"
                          value={horizontalGap}
                          onChange={(e) => setHorizontalGap(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Vertical gap (")</label>
                        <input
                          type="number"
                          step="0.001"
                          value={verticalGap}
                          onChange={(e) => setVerticalGap(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right column - Preview */}
            <div>
              <div className="sticky top-24">
                <label className="block text-sm font-medium text-gray-500 uppercase mb-3">Live Preview</label>
                <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
                  {formatType === 'sheet' && <FormatGridPreview format={previewFormat} />}
                  <p className="text-sm text-gray-400 mt-4">
                    {previewFormat.columns} col × {previewFormat.rows} row
                    <br />
                    {previewFormat.labelsPerSheet} labels / sheet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            Save format
          </button>
        </div>
      </div>
    </div>
  );
}

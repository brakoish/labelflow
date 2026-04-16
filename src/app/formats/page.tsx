'use client';

import { useEffect, useState } from 'react';
import { useFormatsStore } from '@/lib/store';
import { LabelFormat } from '@/lib/types';
import FormatGridPreview from '@/components/FormatGridPreview';
import { Plus, Upload, Edit2, Trash2, Tag } from 'lucide-react';
import Link from 'next/link';

export default function FormatsPage() {
  const { formats, loadFormats, deleteFormat: deleteFormatFromStore, saveFormat } = useFormatsStore();
  const [selectedFormat, setSelectedFormat] = useState<LabelFormat | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newType, setNewType] = useState<'thermal' | 'sheet'>('thermal');
  const [newName, setNewName] = useState('');
  const [newLabelW, setNewLabelW] = useState('2');
  const [newLabelH, setNewLabelH] = useState('1');
  const [newDpi, setNewDpi] = useState('203');
  const [newSheetW, setNewSheetW] = useState('8.5');
  const [newSheetH, setNewSheetH] = useState('11');
  const [newCols, setNewCols] = useState('3');
  const [newRows, setNewRows] = useState('10');
  const [newTopMargin, setNewTopMargin] = useState('0.5');
  const [newSideMargin, setNewSideMargin] = useState('0.1875');
  const [newHGap, setNewHGap] = useState('0.125');
  const [newVGap, setNewVGap] = useState('0');
  const [showPdfImportModal, setShowPdfImportModal] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');

  const resetNewForm = () => {
    setNewName(''); setNewLabelW('2'); setNewLabelH('1'); setNewDpi('203');
    setNewSheetW('8.5'); setNewSheetH('11'); setNewCols('3'); setNewRows('10');
    setNewTopMargin('0.5'); setNewSideMargin('0.1875'); setNewHGap('0.125'); setNewVGap('0');
    setNewType('thermal');
    setEditing(false);
    setEditingId(null);
  };

  const loadFormatIntoForm = (format: LabelFormat) => {
    setNewName(format.name);
    setNewType(format.type);
    setNewLabelW(String(format.labelWidth));
    setNewLabelH(String(format.labelHeight));
    if (format.type === 'thermal') {
      setNewDpi(String(format.dpi || 203));
    } else {
      setNewSheetW(String(format.sheetWidth || 8.5));
      setNewSheetH(String(format.sheetHeight || 11));
      setNewCols(String(format.columns || 3));
      setNewRows(String(format.rows || 10));
      setNewTopMargin(String(format.topMargin || 0.5));
      setNewSideMargin(String(format.sideMargin || 0.1875));
      setNewHGap(String(format.horizontalGap || 0.125));
      setNewVGap(String(format.verticalGap || 0));
    }
  };

  const handleCreateFormat = () => {
    if (!newName.trim()) return;
    const now = new Date().toISOString();
    const format: LabelFormat = {
      id: editing && editingId ? editingId : crypto.randomUUID(),
      name: newName,
      type: newType,
      labelWidth: parseFloat(newLabelW) || 2,
      labelHeight: parseFloat(newLabelH) || 1,
      ...(newType === 'thermal' && { dpi: parseInt(newDpi) || 203 }),
      ...(newType === 'sheet' && {
        sheetWidth: parseFloat(newSheetW) || 8.5,
        sheetHeight: parseFloat(newSheetH) || 11,
        columns: parseInt(newCols) || 3,
        rows: parseInt(newRows) || 10,
        labelsPerSheet: (parseInt(newCols) || 3) * (parseInt(newRows) || 10),
        topMargin: parseFloat(newTopMargin) || 0,
        sideMargin: parseFloat(newSideMargin) || 0,
        horizontalGap: parseFloat(newHGap) || 0,
        verticalGap: parseFloat(newVGap) || 0,
      }),
      createdAt: editing && selectedFormat ? selectedFormat.createdAt : now,
      updatedAt: now,
    };
    saveFormat(format);
    setSelectedFormat(format);
    setShowNewForm(false);
    resetNewForm();
  };

  const handleEditFormat = () => {
    if (!selectedFormat) return;
    setEditing(true);
    setEditingId(selectedFormat.id);
    loadFormatIntoForm(selectedFormat);
    setShowNewForm(true);
  };

  const handlePdfImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.pdf')) return;

    setPdfFileName(file.name);
    // Default to letter size for v1
    setNewSheetW('8.5');
    setNewSheetH('11');
    setNewType('sheet');
    setShowPdfImportModal(true);
  };

  const confirmPdfImport = () => {
    setShowPdfImportModal(false);
    setShowNewForm(true);
    setNewName(pdfFileName.replace('.pdf', '') + ' Labels');
    // Keep the sheet dimensions already set, user will fill in grid specs
  };

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
              <button
                onClick={() => setShowNewForm(!showNewForm)}
                className="flex-1 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-md flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                New Format
              </button>
              <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-md flex items-center gap-2 cursor-pointer">
                <Upload size={16} />
                Import PDF
                <input type="file" accept=".pdf" onChange={handlePdfImport} className="hidden" />
              </label>
            </div>
          </div>

          {showNewForm && (
            <div className="p-4 border-b border-zinc-800 space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. My Custom Label"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewType('thermal')}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      newType === 'thermal'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    Thermal Roll
                  </button>
                  <button
                    onClick={() => setNewType('sheet')}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      newType === 'sheet'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    Sheet
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Label Width (")</label>
                  <input type="number" step="0.001" value={newLabelW} onChange={(e) => setNewLabelW(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Label Height (")</label>
                  <input type="number" step="0.001" value={newLabelH} onChange={(e) => setNewLabelH(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              {newType === 'thermal' && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">DPI</label>
                  <select value={newDpi} onChange={(e) => setNewDpi(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500">
                    <option value="203">203 DPI</option>
                    <option value="300">300 DPI</option>
                  </select>
                </div>
              )}
              {newType === 'sheet' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Sheet W (")</label>
                      <input type="number" step="0.1" value={newSheetW} onChange={(e) => setNewSheetW(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Sheet H (")</label>
                      <input type="number" step="0.1" value={newSheetH} onChange={(e) => setNewSheetH(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Columns</label>
                      <input type="number" value={newCols} onChange={(e) => setNewCols(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Rows</label>
                      <input type="number" value={newRows} onChange={(e) => setNewRows(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Top Margin (")</label>
                      <input type="number" step="0.001" value={newTopMargin} onChange={(e) => setNewTopMargin(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Side Margin (")</label>
                      <input type="number" step="0.001" value={newSideMargin} onChange={(e) => setNewSideMargin(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">H Gap (")</label>
                      <input type="number" step="0.001" value={newHGap} onChange={(e) => setNewHGap(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">V Gap (")</label>
                      <input type="number" step="0.001" value={newVGap} onChange={(e) => setNewVGap(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreateFormat}
                  disabled={!newName.trim()}
                  className="flex-1 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm rounded-md"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => { setShowNewForm(false); resetNewForm(); }}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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
                  <button
                    onClick={handleEditFormat}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md"
                  >
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

      {/* PDF Import Modal */}
      {showPdfImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">PDF Template Imported</h3>
            <p className="text-sm text-zinc-300 mb-4">
              Review dimensions below and manually enter the label grid specifications.
            </p>
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <p className="text-xs text-zinc-400 mb-2">Detected sheet size (Letter):</p>
              <p className="text-sm text-white font-mono">8.5" × 11"</p>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Click Continue to fill in label count, margins, and gaps in the form.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmPdfImport}
                className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-md"
              >
                Continue
              </button>
              <button
                onClick={() => setShowPdfImportModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

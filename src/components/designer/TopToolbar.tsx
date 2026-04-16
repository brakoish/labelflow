'use client';

import { ZoomIn, ZoomOut, Undo, Redo, Save } from 'lucide-react';
import { useDesignerStore } from '@/lib/store';
import { useFormatsStore } from '@/lib/store';
import Link from 'next/link';

export function TopToolbar() {
  const {
    currentDesign,
    currentFormat,
    canvasState,
    history,
    updateDesignName,
    setCanvasState,
    setCurrentFormat,
    undo,
    redo,
    saveCurrentDesign,
  } = useDesignerStore();

  const formats = useFormatsStore((state) => state.formats);

  const handleZoomIn = () => {
    setCanvasState({ zoom: Math.min(canvasState.zoom * 1.2, 5) });
  };

  const handleZoomOut = () => {
    setCanvasState({ zoom: Math.max(canvasState.zoom / 1.2, 0.1) });
  };

  const handleZoomReset = () => {
    setCanvasState({ zoom: 1 });
  };

  const handleFormatChange = (formatId: string) => {
    const newFormat = formats.find(f => f.id === formatId);
    if (newFormat) {
      setCurrentFormat(newFormat);
    }
  };

  const handleSave = () => {
    // Trigger canvas to generate thumbnail
    window.dispatchEvent(new CustomEvent('save-design'));
  };

  return (
    <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-6">
      {/* Left: Logo and design name */}
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
          LabelFlow
        </Link>

        {currentDesign && (
          <>
            <div className="w-px h-5 bg-zinc-700" />
            <input
              type="text"
              value={currentDesign.name}
              onChange={(e) => updateDesignName(e.target.value)}
              className="bg-transparent text-sm text-zinc-100 border-none outline-none focus:bg-zinc-800/50 px-2 py-1 rounded"
              placeholder="Untitled Design"
            />
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded-md flex items-center gap-1.5"
            >
              <Save size={14} />
              Save
            </button>
          </>
        )}
      </div>

      {/* Center: Format selector and dimensions */}
      <div className="flex-1 flex items-center justify-center gap-4">
        {currentFormat && (
          <>
            <select
              className="bg-zinc-800 text-sm text-zinc-100 border border-zinc-700 rounded-md px-3 py-1.5 outline-none focus:border-indigo-500"
              value={currentFormat.id}
              onChange={(e) => handleFormatChange(e.target.value)}
            >
              {formats.map((fmt) => (
                <option key={fmt.id} value={fmt.id}>
                  {fmt.name} — {fmt.labelWidth}" × {fmt.labelHeight}"
                </option>
              ))}
            </select>

            <div className="text-sm text-zinc-400 font-mono">
              {currentFormat.labelWidth}" × {currentFormat.labelHeight}"
            </div>
          </>
        )}
      </div>

      {/* Right: Zoom and undo/redo */}
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={history.past.length === 0}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={redo}
          disabled={history.future.length === 0}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        <button
          onClick={handleZoomOut}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleZoomReset}
          className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded font-mono min-w-[3rem] text-center"
        >
          {Math.round(canvasState.zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        <div className="flex gap-2 text-xs">
          <Link href="/formats" className="px-2 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded">
            Formats
          </Link>
          <Link href="/labels" className="px-2 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded">
            Labels
          </Link>
        </div>
      </div>
    </div>
  );
}

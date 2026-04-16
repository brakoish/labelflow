'use client';

import { useDesignerStore } from '@/lib/store';

export function BottomBar() {
  const { currentDesign, currentFormat, canvasState, cursorPosition } = useDesignerStore();

  if (!currentFormat) return null;

  return (
    <div className="h-8 bg-zinc-900 border-t border-zinc-800 flex items-center px-4 text-xs text-zinc-400">
      <div className="flex items-center gap-6">
        <div className="font-mono">
          {currentFormat.labelWidth}" × {currentFormat.labelHeight}"
        </div>
        <div className="w-px h-4 bg-zinc-700" />
        <div>
          {currentDesign?.elements.length || 0} element{currentDesign?.elements.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-6">
        <div className="font-mono">
          {cursorPosition.x.toFixed(3)}", {cursorPosition.y.toFixed(3)}"
        </div>
        <div className="w-px h-4 bg-zinc-700" />
        <div className="font-mono">{Math.round(canvasState.zoom * 100)}%</div>
      </div>
    </div>
  );
}

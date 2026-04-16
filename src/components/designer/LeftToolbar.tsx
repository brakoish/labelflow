'use client';

import {
  MousePointer2,
  Type,
  QrCode,
  Barcode,
  Image,
  Square,
  Circle,
  Minus,
} from 'lucide-react';
import { useDesignerStore } from '@/lib/store';
import { ToolType } from '@/lib/types';

const tools: Array<{ type: ToolType; icon: React.ElementType; label: string }> = [
  { type: 'select', icon: MousePointer2, label: 'Select' },
  { type: 'text', icon: Type, label: 'Text' },
  { type: 'qr', icon: QrCode, label: 'QR Code' },
  { type: 'barcode', icon: Barcode, label: 'Barcode' },
  { type: 'image', icon: Image, label: 'Image' },
  { type: 'rectangle', icon: Square, label: 'Rectangle' },
  { type: 'ellipse', icon: Circle, label: 'Ellipse' },
  { type: 'line', icon: Minus, label: 'Line' },
];

export function LeftToolbar() {
  const { activeTool, setActiveTool } = useDesignerStore();

  return (
    <div className="w-14 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-1">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.type;

        return (
          <button
            key={tool.type}
            onClick={() => setActiveTool(tool.type)}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              transition-colors group relative
              ${
                isActive
                  ? 'bg-indigo-500 text-white'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              }
            `}
            title={tool.label}
          >
            <Icon size={20} />

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-zinc-100 text-xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              {tool.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

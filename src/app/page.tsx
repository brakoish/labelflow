'use client';

import { useEffect } from 'react';
import { TopToolbar } from '@/components/designer/TopToolbar';
import { LeftToolbar } from '@/components/designer/LeftToolbar';
import { CanvasWorkspace } from '@/components/designer/CanvasWorkspace';
import { PropertiesPanel } from '@/components/designer/PropertiesPanel';
import { BottomBar } from '@/components/designer/BottomBar';
import { useDesignerStore, useFormatsStore } from '@/lib/store';

export default function DesignerPage() {
  const { currentDesign, currentFormat, setCurrentDesign, setCurrentFormat } = useDesignerStore();
  const { formats, loadFormats } = useFormatsStore();

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  useEffect(() => {
    // Initialize with a new design if none exists
    if (!currentDesign && formats.length > 0) {
      const defaultFormat = formats[0];
      setCurrentFormat(defaultFormat);
      setCurrentDesign({
        id: crypto.randomUUID(),
        name: 'Untitled Label',
        formatId: defaultFormat.id,
        elements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [formats, currentDesign, setCurrentDesign, setCurrentFormat]);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950">
      <TopToolbar />

      <div className="flex-1 flex overflow-hidden">
        <LeftToolbar />
        <CanvasWorkspace />
        <PropertiesPanel />
      </div>

      <BottomBar />
    </div>
  );
}

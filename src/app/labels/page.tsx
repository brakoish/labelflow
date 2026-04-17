'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDesignsStore, useFormatsStore } from '@/lib/store';
import { Plus, Copy, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';

export default function LabelsPage() {
  const router = useRouter();
  const { designs, loadDesigns, deleteDesign } = useDesignsStore();
  const { formats, loadFormats, getFormatById } = useFormatsStore();

  const saveDesign = (design: any) => {
    const storedDesigns = localStorage.getItem('labelflow_designs');
    const allDesigns = storedDesigns ? JSON.parse(storedDesigns) : [];
    allDesigns.push(design);
    localStorage.setItem('labelflow_designs', JSON.stringify(allDesigns));
    loadDesigns(); // Refresh the list
  };

  useEffect(() => {
    loadFormats();
    loadDesigns();
  }, [loadFormats, loadDesigns]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this label design?')) {
      deleteDesign(id);
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const design = designs.find(d => d.id === id);
    if (!design) return;

    const now = new Date().toISOString();
    const duplicatedDesign = {
      ...design,
      id: crypto.randomUUID(),
      name: design.name + ' (copy)',
      createdAt: now,
      updatedAt: now,
    };

    saveDesign(duplicatedDesign);
  };

  const handleOpen = (id: string) => {
    router.push(`/?design=${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Top bar */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
            <img src="/logo.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(55%) sepia(52%) saturate(5765%) hue-rotate(222deg) brightness(100%) contrast(93%)' }} />
            Label Wrangler
          </Link>
          <div className="w-px h-6 bg-zinc-700" />
          <h1 className="text-lg font-semibold text-white">My Labels</h1>
        </div>

        <Link
          href="/"
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-md flex items-center gap-2"
        >
          <Plus size={16} />
          New Label
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {designs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <FileText className="w-20 h-20 text-zinc-700 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">This corral&apos;s empty</h2>
            <p className="text-zinc-400 mb-6">Design your first label to get started</p>
            <Link
              href="/"
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              Go to Designer
            </Link>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {designs.map((design) => {
                const format = getFormatById(design.formatId);

                return (
                  <div
                    key={design.id}
                    onClick={() => handleOpen(design.id)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-indigo-500 transition-all cursor-pointer group"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] bg-zinc-800 relative overflow-hidden">
                      {design.thumbnail ? (
                        <img
                          src={design.thumbnail}
                          alt={design.name}
                          className="w-full h-full object-contain p-4"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                            <p className="text-xs text-zinc-500">
                              {format?.labelWidth}" × {format?.labelHeight}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-medium text-sm">Open in Designer</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-white mb-1 truncate">
                        {design.name}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-3">
                        {format?.name || 'Unknown format'}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">
                          {formatDate(design.updatedAt)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => handleDuplicate(design.id, e)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(design.id, e)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LabelDesign, LabelFormat } from '@/lib/types';
import { getDesigns, deleteDesign, getFormatById } from '@/lib/store';

export default function LabelsPage() {
  const [designs, setDesigns] = useState<LabelDesign[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = () => {
    setDesigns(getDesigns());
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this label design?')) {
      deleteDesign(id);
      loadDesigns();
    }
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
    <div className="min-h-full bg-gray-950">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Labels</h1>
          <p className="text-gray-400">
            Saved label designs. Click to open in the designer.
          </p>
        </div>

        {designs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <span className="text-5xl">🏷️</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No saved labels yet</h2>
            <p className="text-gray-400 mb-6">Create your first label in the Designer</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go to Designer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design) => {
              const format = getFormatById(design.formatId);
              return (
                <div
                  key={design.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors cursor-pointer group"
                  onClick={() => handleOpen(design.id)}
                >
                  <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                    <div className="relative text-center">
                      <div className="text-6xl mb-2">🏷️</div>
                      <div className="text-xs text-gray-400">
                        {format?.labelWidth}" × {format?.labelHeight}"
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium">Open in Designer</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                      {design.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Format: {format?.name || 'Unknown'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Updated {formatDate(design.updatedAt)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement duplicate
                            alert('Duplicate feature coming soon!');
                          }}
                          className="px-2 py-1 hover:text-white transition-colors"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(design.id);
                          }}
                          className="px-2 py-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

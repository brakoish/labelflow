'use client';

import { useEffect, useState } from 'react';
import { LabelDesign, LabelFormat } from '@/lib/types';
import { getDesigns, getFormatById } from '@/lib/store';

export default function PrintPage() {
  const [designs, setDesigns] = useState<LabelDesign[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<LabelDesign | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [quantityPerRow, setQuantityPerRow] = useState(1);

  useEffect(() => {
    setDesigns(getDesigns());
  }, []);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    setCsvData(data);
  };

  const handlePrint = () => {
    if (!selectedDesign) {
      alert('Please select a label design');
      return;
    }

    const format = getFormatById(selectedDesign.formatId);
    if (!format) {
      alert('Format not found');
      return;
    }

    if (format.type === 'thermal') {
      alert('QZ Tray integration coming soon! This will send ZPL commands to your thermal printer.');
    } else {
      alert('PDF generation coming soon! This will create a PDF with all your labels.');
    }
  };

  const selectedFormat = selectedDesign ? getFormatById(selectedDesign.formatId) : null;

  return (
    <div className="min-h-full bg-gray-950">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Print Labels</h1>
          <p className="text-gray-400">
            Batch print labels with dynamic data from CSV files.
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Select Design */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              1. Select Label Design
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {designs.length === 0 ? (
                <p className="text-gray-400 col-span-3">
                  No saved designs. Create a label in the Designer first.
                </p>
              ) : (
                designs.map((design) => {
                  const format = getFormatById(design.formatId);
                  return (
                    <button
                      key={design.id}
                      onClick={() => setSelectedDesign(design)}
                      className={`p-4 rounded-lg border transition-colors text-left ${
                        selectedDesign?.id === design.id
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-lg font-medium mb-1">{design.name}</div>
                      <div className="text-sm opacity-75">
                        {format?.name} ({format?.labelWidth}" × {format?.labelHeight}")
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Upload CSV */}
          {selectedDesign && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                2. Upload CSV Data
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    CSV File (optional - leave blank for single label)
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-600 file:text-white
                      hover:file:bg-blue-700 file:cursor-pointer
                      cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Upload a CSV file with columns matching your dynamic fields
                  </p>
                </div>

                {csvData.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">
                      Preview ({csvData.length} rows)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-800">
                            {Object.keys(csvData[0]).map((header) => (
                              <th
                                key={header}
                                className="px-4 py-2 text-left text-gray-400 font-medium"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-b border-gray-800">
                              {Object.values(row).map((value, colIndex) => (
                                <td key={colIndex} className="px-4 py-2 text-gray-300">
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvData.length > 5 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Showing first 5 of {csvData.length} rows
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Print Options */}
          {selectedDesign && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                3. Print Options
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Quantity per row
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantityPerRow}
                    onChange={(e) => setQuantityPerRow(parseInt(e.target.value))}
                    className="w-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Print {quantityPerRow} label(s) for each row in the CSV
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  {selectedFormat?.type === 'thermal' ? (
                    <button
                      onClick={handlePrint}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span>🖨</span>
                      Print via QZ Tray
                    </button>
                  ) : (
                    <button
                      onClick={handlePrint}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span>📄</span>
                      Generate PDF
                    </button>
                  )}
                  <div className="flex-1 bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Total labels to print: {csvData.length > 0 ? csvData.length * quantityPerRow : 1}
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedFormat?.type === 'sheet'
                          ? `≈ ${Math.ceil((csvData.length * quantityPerRow) / (selectedFormat.labelsPerSheet || 1))} sheets`
                          : 'Thermal printer ready'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QZ Tray Status */}
          {selectedFormat?.type === 'thermal' && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">QZ Tray Status</h3>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <div className="text-white font-medium">Not Connected</div>
                  <div className="text-sm text-gray-400">
                    QZ Tray is not detected. Install from{' '}
                    <a
                      href="https://qz.io/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      qz.io/download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

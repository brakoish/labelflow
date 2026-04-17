'use client';

import { useEffect, useState } from 'react';
import { useDesignsStore, useFormatsStore } from '@/lib/store';
import { CSVRow, LabelDesign, LabelFormat, CanvasElement } from '@/lib/types';
import { Upload, Download, Printer, FileText } from 'lucide-react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export default function PrintPage() {
  const { designs, loadDesigns } = useDesignsStore();
  const { loadFormats, getFormatById } = useFormatsStore();
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [quantityPerRow, setQuantityPerRow] = useState(1);
  const [showZplModal, setShowZplModal] = useState(false);
  const [zplOutput, setZplOutput] = useState('');

  useEffect(() => {
    loadFormats();
    loadDesigns();
  }, [loadFormats, loadDesigns]);

  const selectedDesign = designs.find((d) => d.id === selectedDesignId);
  const selectedFormat = selectedDesign ? getFormatById(selectedDesign.formatId) : null;

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
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return;

    const headers = lines[0].split(',').map((h) => h.trim());
    const data = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    setCsvData(data);
  };

  const downloadCsvTemplate = () => {
    if (!selectedDesign) return;

    // Extract dynamic fields from elements
    const dynamicFields = selectedDesign.elements
      .filter((el) => el.isDynamic && el.fieldName)
      .map((el) => el.fieldName!);

    const uniqueFields = Array.from(new Set(dynamicFields));

    if (uniqueFields.length === 0) {
      alert('This design has no dynamic fields. Add dynamic data to elements first.');
      return;
    }

    const csvContent = uniqueFields.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDesign.name}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = async () => {
    if (!selectedDesign || !selectedFormat) {
      alert('Please select a label design');
      return;
    }

    if (selectedFormat.type === 'sheet') {
      await generatePDF(selectedDesign, selectedFormat, csvData, quantityPerRow);
    } else {
      await generateZPL(selectedDesign, selectedFormat, csvData, quantityPerRow);
    }
  };

  const generatePDF = async (design: LabelDesign, format: LabelFormat, data: CSVRow[], qty: number) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [format.sheetWidth || 8.5, format.sheetHeight || 11],
    });

    const labelsPerSheet = format.labelsPerSheet || 1;
    const totalLabels = data.length * qty;
    let labelIndex = 0;

    for (let i = 0; i < totalLabels; i++) {
      const dataRow = data[Math.floor(i / qty)];
      const col = labelIndex % (format.columns || 1);
      const row = Math.floor(labelIndex / (format.columns || 1)) % (format.rows || 1);

      // Calculate label position
      const labelX = (format.sideMargin || 0) + col * (format.labelWidth + (format.horizontalGap || 0));
      const labelY = (format.topMargin || 0) + row * (format.labelHeight + (format.verticalGap || 0));

      // Render each element on the label
      for (const element of design.elements) {
        await renderElementToPDF(pdf, element, labelX, labelY, dataRow);
      }

      labelIndex++;

      // Add new page if we've filled this sheet and have more labels
      if (labelIndex % labelsPerSheet === 0 && i < totalLabels - 1) {
        pdf.addPage();
        labelIndex = 0;
      }
    }

    // Open PDF in new tab
    pdf.output('dataurlnewwindow');
  };

  const renderElementToPDF = async (pdf: jsPDF, element: CanvasElement, offsetX: number, offsetY: number, dataRow?: CSVRow) => {
    const x = offsetX + element.x;
    const y = offsetY + element.y;

    if (element.type === 'text') {
      const text = element.isDynamic && element.fieldName && dataRow
        ? dataRow[element.fieldName] || element.text || ''
        : element.text || '';

      pdf.setFontSize(element.fontSize || 12);
      pdf.text(text, x, y + (element.fontSize || 12) / 72); // Adjust for baseline
    }
    else if (element.type === 'qr') {
      const qrData = element.isDynamic && element.fieldName && dataRow
        ? dataRow[element.fieldName] || element.qrData || ''
        : element.qrData || '';

      try {
        const qrDataUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: element.qrErrorCorrection || 'M',
          width: element.width * 72,
          margin: 0,
        });
        pdf.addImage(qrDataUrl, 'PNG', x, y, element.width, element.height);
      } catch (err) {
        console.error('QR generation error:', err);
      }
    }
    else if (element.type === 'barcode') {
      const barcodeData = element.isDynamic && element.fieldName && dataRow
        ? dataRow[element.fieldName] || element.barcodeData || ''
        : element.barcodeData || '';

      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, barcodeData, {
          format: element.barcodeFormat || 'CODE128',
          displayValue: element.showBarcodeText ?? true,
          width: 2,
          height: element.height * 72,
        });
        const barcodeDataUrl = canvas.toDataURL();
        pdf.addImage(barcodeDataUrl, 'PNG', x, y, element.width, element.height);
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
    else if (element.type === 'shape') {
      pdf.setDrawColor(element.strokeColor || '#000000');
      pdf.setFillColor(element.fillColor || '#ffffff');
      pdf.setLineWidth(element.strokeWidth || 1 / 72);

      if (element.shapeType === 'rect') {
        if (element.fillColor) {
          pdf.rect(x, y, element.width, element.height, 'FD');
        } else {
          pdf.rect(x, y, element.width, element.height, 'S');
        }
      } else if (element.shapeType === 'circle') {
        const radius = Math.min(element.width, element.height) / 2;
        if (element.fillColor) {
          pdf.circle(x + radius, y + radius, radius, 'FD');
        } else {
          pdf.circle(x + radius, y + radius, radius, 'S');
        }
      } else if (element.shapeType === 'line') {
        pdf.line(x, y, x + element.width, y + element.height);
      }
    }
  };

  const generateZPL = async (design: LabelDesign, format: LabelFormat, data: CSVRow[], qty: number) => {
    const dpi = format.dpi || 203;
    let zpl = '';

    const totalLabels = data.length * qty;
    for (let i = 0; i < totalLabels; i++) {
      const dataRow = data[Math.floor(i / qty)];

      zpl += '^XA\n'; // Start label
      zpl += `^PW${Math.round(format.labelWidth * dpi)}\n`; // Print width
      zpl += `^LL${Math.round(format.labelHeight * dpi)}\n`; // Label length

      for (const element of design.elements) {
        zpl += renderElementToZPL(element, dpi, dataRow);
      }

      zpl += '^XZ\n'; // End label
    }

    setZplOutput(zpl);
    setShowZplModal(true);
  };

  const renderElementToZPL = (element: CanvasElement, dpi: number, dataRow?: CSVRow): string => {
    const x = Math.round(element.x * dpi);
    const y = Math.round(element.y * dpi);
    let zpl = '';

    if (element.type === 'text') {
      const text = element.isDynamic && element.fieldName && dataRow
        ? dataRow[element.fieldName] || element.text || ''
        : element.text || '';

      const fontSize = Math.round((element.fontSize || 12) * dpi / 72);
      zpl += `^FO${x},${y}\n`;
      zpl += `^A0N,${fontSize},${fontSize}\n`;
      zpl += `^FD${text}^FS\n`;
    }
    else if (element.type === 'qr') {
      const qrData = element.isDynamic && element.fieldName && dataRow
        ? dataRow[element.fieldName] || element.qrData || ''
        : element.qrData || '';

      const size = Math.round(element.width * dpi / 10);
      zpl += `^FO${x},${y}\n`;
      zpl += `^BQN,2,${size}\n`;
      zpl += `^FD${qrData}^FS\n`;
    }
    else if (element.type === 'barcode') {
      const barcodeData = element.isDynamic && element.fieldName && dataRow
        ? dataRow[element.fieldName] || element.barcodeData || ''
        : element.barcodeData || '';

      const height = Math.round(element.height * dpi);
      zpl += `^FO${x},${y}\n`;
      zpl += `^BCN,${height},Y,N,N\n`;
      zpl += `^FD${barcodeData}^FS\n`;
    }

    return zpl;
  };

  const totalLabels = csvData.length * quantityPerRow;

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Top bar */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-6 gap-4">
        <Link href="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
          <img src="/logo.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(55%) sepia(52%) saturate(5765%) hue-rotate(222deg) brightness(100%) contrast(93%)' }} />
          Label Wrangler
        </Link>
        <div className="w-px h-6 bg-zinc-700" />
        <h1 className="text-lg font-semibold text-white">Print Labels</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Select Design */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">1. Select Label Design</h2>

            {designs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm mb-4">No labels wrangled yet</p>
                <Link
                  href="/"
                  className="inline-block px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-md"
                >
                  Create a Label
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {designs.map((design) => {
                  const format = getFormatById(design.formatId);
                  const isSelected = selectedDesignId === design.id;

                  return (
                    <button
                      key={design.id}
                      onClick={() => setSelectedDesignId(design.id)}
                      className={`p-4 rounded-lg border transition-all text-left ${
                        isSelected
                          ? 'border-indigo-500 bg-zinc-800'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {design.thumbnail ? (
                        <img
                          src={design.thumbnail}
                          alt={design.name}
                          className="w-full h-24 object-contain mb-3 bg-zinc-800 rounded"
                        />
                      ) : (
                        <div className="w-full h-24 bg-zinc-800 rounded flex items-center justify-center mb-3">
                          <FileText className="w-8 h-8 text-zinc-600" />
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-white truncate">{design.name}</h3>
                      <p className="text-xs text-zinc-500">{format?.name}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Upload Data */}
          {selectedDesign && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">2. Upload Data (CSV)</h2>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={downloadCsvTemplate}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-md flex items-center gap-2"
                >
                  <Download size={16} />
                  Download CSV Template
                </button>

                <label className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-md flex items-center gap-2 cursor-pointer">
                  <Upload size={16} />
                  Upload CSV
                  <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                </label>
              </div>

              {csvData.length > 0 && (
                <div>
                  <p className="text-sm text-zinc-400 mb-3">
                    Loaded {csvData.length} rows from {csvFile?.name}
                  </p>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-900 sticky top-0">
                        <tr>
                          {Object.keys(csvData[0]).map((key) => (
                            <th key={key} className="px-4 py-2 text-left text-zinc-300 font-semibold">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="border-t border-zinc-800">
                            {Object.values(row).map((val, i) => (
                              <td key={i} className="px-4 py-2 text-zinc-400">
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvData.length > 10 && (
                    <p className="text-xs text-zinc-500 mt-2">Showing first 10 of {csvData.length} rows</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Print Settings */}
          {selectedDesign && csvData.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">3. Print Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Quantity per Row</label>
                  <input
                    type="number"
                    min="1"
                    value={quantityPerRow}
                    onChange={(e) => setQuantityPerRow(parseInt(e.target.value) || 1)}
                    className="w-32 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                  />
                </div>

                <div className="bg-zinc-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">Data Rows</p>
                      <p className="text-lg font-mono text-white">{csvData.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Total Labels</p>
                      <p className="text-lg font-mono text-white">{totalLabels}</p>
                    </div>
                    {selectedFormat?.type === 'sheet' && (
                      <div>
                        <p className="text-xs text-zinc-500">Sheets Needed</p>
                        <p className="text-lg font-mono text-white">
                          {Math.ceil(totalLabels / (selectedFormat.labelsPerSheet || 1))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="w-full px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-md flex items-center justify-center gap-2"
                >
                  <Printer size={20} />
                  {selectedFormat?.type === 'thermal' ? 'Send to Printer' : 'Generate PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ZPL Output Modal */}
      {showZplModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-3xl w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">ZPL Output</h3>
            <p className="text-sm text-zinc-300 mb-4">
              Copy the ZPL commands below and send to your thermal printer via QZ Tray or direct connection.
            </p>
            <textarea
              value={zplOutput}
              readOnly
              className="w-full h-96 px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-md text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(zplOutput);
                  alert('ZPL copied to clipboard!');
                }}
                className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-md"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowZplModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

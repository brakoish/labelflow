// Label Format — defines the physical media
export interface LabelFormat {
  id: string;
  name: string;
  description?: string;
  type: 'thermal' | 'sheet';

  // Label dimensions (inches)
  labelWidth: number;
  labelHeight: number;

  // For sheet labels only
  sheetWidth?: number;
  sheetHeight?: number;
  columns?: number;
  rows?: number;
  labelsPerSheet?: number;
  topMargin?: number;
  sideMargin?: number;
  horizontalGap?: number;
  verticalGap?: number;

  // For thermal labels
  dpi?: number;
  labelsAcross?: number; // For multi-across thermal rolls (e.g., 3 labels per row)

  createdAt: string;
  updatedAt: string;
}

// Label Design — a saved label template
export interface LabelDesign {
  id: string;
  name: string;
  formatId: string;
  elements: CanvasElement[];
  thumbnail?: string; // base64 image data URL
  createdAt: string;
  updatedAt: string;
}

// Canvas Element — positioned in inches from top-left of label
export interface CanvasElement {
  id: string;
  type: 'text' | 'qr' | 'barcode' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;

  // Text
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  lineHeight?: number;

  // QR Code
  qrData?: string;
  qrErrorCorrection?: 'L' | 'M' | 'Q' | 'H';

  // Barcode
  barcodeData?: string;
  barcodeFormat?: string;
  showBarcodeText?: boolean;

  // Image
  imageData?: string;

  // Shape
  shapeType?: 'rect' | 'circle' | 'line';
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  cornerRadius?: number;

  // Dynamic data binding
  isDynamic?: boolean;
  fieldName?: string;
}

// Print Settings
export interface PrintSettings {
  mode: 'thermal' | 'sheet';
  safeMargin: number;
  dpi: number;
  darkness: number;
  printSpeed: number;
  mediaType: 'direct' | 'transfer';
}

// Tool Types
export type ToolType = 'select' | 'text' | 'qr' | 'barcode' | 'image' | 'rectangle' | 'ellipse' | 'line';

// Canvas State
export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number; // in inches
}

// History for undo/redo
export interface HistoryState {
  past: CanvasElement[][];
  present: CanvasElement[];
  future: CanvasElement[][];
}

// CSV Data for printing
export interface CSVRow {
  [key: string]: string;
}

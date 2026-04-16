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

  createdAt: string;
  updatedAt: string;
}

// Label Design — a saved label template
export interface LabelDesign {
  id: string;
  name: string;
  formatId: string;
  elements: CanvasElement[];
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
  textAlign?: string;
  color?: string;

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

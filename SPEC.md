# LabelFlow — Label Designer & Printer Software

## Overview
A web-based label designer for thermal rolls and sheet labels. Industry-agnostic. Design labels with a drag-and-drop canvas, manage a library of label formats, support dynamic data from CSV, print to Zebra thermal printers via QZ Tray (ZPL) or regular printers (PDF).

## Tech Stack
- Next.js 15 (App Router, TypeScript, Tailwind CSS)
- Fabric.js 6 for the canvas designer
- jsPDF for sheet label PDF generation
- qrcode + JsBarcode for generating QR codes and barcodes
- LocalStorage/IndexedDB for persisting designs and formats (no backend for v1)
- QZ Tray for raw ZPL printing to Zebra printers

## Design System
- Dark theme matching the screenshots provided (dark gray backgrounds, subtle borders)
- Clean, modern UI with sidebar panels
- Consistent spacing, rounded corners, subtle shadows
- Colors: background #1a1a2e or similar dark, cards slightly lighter, blue accent for primary actions

## Core Architecture

### Data Model

```typescript
// Label Format — defines the physical media
interface LabelFormat {
  id: string;
  name: string;               // e.g., "Avery 5160", "2x1 Thermal Roll"
  description?: string;
  type: 'thermal' | 'sheet';
  
  // Label dimensions (inches)
  labelWidth: number;
  labelHeight: number;
  
  // For sheet labels only
  sheetWidth?: number;        // e.g., 8.5
  sheetHeight?: number;       // e.g., 11
  columns?: number;
  rows?: number;
  labelsPerSheet?: number;    // auto-calculated: columns * rows
  topMargin?: number;
  sideMargin?: number;
  horizontalGap?: number;
  verticalGap?: number;
  
  // For thermal labels
  dpi?: number;               // 203 or 300
  
  createdAt: string;
  updatedAt: string;
}

// Label Design — a saved label template
interface LabelDesign {
  id: string;
  name: string;
  formatId: string;           // references a LabelFormat
  elements: CanvasElement[];  // the design elements
  createdAt: string;
  updatedAt: string;
}

// Canvas Element — positioned in inches from top-left of label
interface CanvasElement {
  id: string;
  type: 'text' | 'qr' | 'barcode' | 'image' | 'shape';
  x: number;                  // inches from left
  y: number;                  // inches from top
  width: number;              // inches
  height: number;             // inches
  rotation?: number;
  
  // Type-specific properties
  // Text
  text?: string;
  fontFamily?: string;
  fontSize?: number;          // points
  fontWeight?: string;
  textAlign?: string;
  
  // QR Code
  qrData?: string;            // static value OR "{{field_name}}" for dynamic
  qrErrorCorrection?: 'L' | 'M' | 'Q' | 'H';
  
  // Barcode
  barcodeData?: string;       // static or "{{field_name}}"
  barcodeFormat?: string;     // CODE128, CODE39, EAN13, UPC, etc.
  showBarcodeText?: boolean;
  
  // Image
  imageData?: string;         // base64 data URL
  
  // Shape
  shapeType?: 'rect' | 'circle' | 'line';
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  
  // Dynamic data binding
  isDynamic?: boolean;        // if true, content comes from CSV
  fieldName?: string;         // CSV column name to bind to
}
```

### Storage
Use a simple localStorage wrapper for v1:
- `labelflow_formats` — array of LabelFormat
- `labelflow_designs` — array of LabelDesign

## Pages & Navigation

### Sidebar Navigation (left side, always visible)
- **Designer** — the main canvas editor (`/`)
- **Label Formats** — manage label formats library (`/formats`)
- **My Labels** — saved label designs (`/labels`)
- **Print** — batch print with CSV data (`/print`)

### Page 1: Designer (`/`)
The main design canvas. Matches Screenshot 1 layout.

**Left Panel — "Add Element"**
- Buttons for: Text, QR Code, Barcode, Image, Shape
- Clicking adds the element to the center of the canvas
- Each element type has an icon

**Center — Canvas**
- Fabric.js canvas showing the label at a comfortable zoom
- White label area on a subtle gray background
- Label dimensions shown in corner (e.g., "2" × 1"")
- Grid/snap optional
- Elements can be dragged, resized, rotated
- Click element to select → shows properties in right panel
- Delete key removes selected element

**Top Bar (above canvas)**
- Format selector dropdown (pick from saved formats, or "Quick size" with W × H inputs)
- "Save layout" button

**Right Panel — Properties**
When no element is selected, show Print Settings:
- Print mode toggle: Thermal / Sheet
- Safe margin input
- Printer DPI dropdown (203 DPI / 300 DPI)
- Darkness slider (1-30)
- Print speed slider (1-6 ips)
- Media type dropdown (Direct Thermal, Thermal Transfer)

When an element is selected, show element properties:
- Position: X, Y (inches)
- Size: W, H (inches)
- Type-specific props (font, size, alignment for text; data, error correction for QR; etc.)
- **Dynamic data toggle** — switch to bind this element to a CSV field
  - When enabled, show field name input (e.g., "link", "product_name")
  - Preview shows placeholder like "{{link}}"

**Bottom of right panel — Live Preview**
- Small preview box showing what the label looks like at actual print resolution
- "203 DPI simulation with sample data" caption

### Page 2: Label Formats (`/formats`)
Matches Screenshot 2 layout.

**Top Bar:**
- "Add manually" button
- "Upload PDF template" button (blue, prominent)

**Grid of format cards:**
Each card shows:
- Name and subtitle (e.g., "Avery 5160 — 2.625" × 1"")
- Visual grid preview (miniature of the sheet layout with rectangles for each label)
- DIMENSIONS section: Label size, Sheet size, Grid (col × row), Labels/sheet
- MARGINS & GAPS section: Top margin, Side margin, Horizontal gap, Vertical gap
- For thermal formats: show DPI, roll width instead of sheet dims
- Edit/Delete actions (subtle, on hover or menu)

**Add Manually Modal:**
- Format name
- Type toggle: Thermal / Sheet
- If Sheet: all the sheet dimensions, grid layout, margins/gaps fields
- If Thermal: label width, height, DPI
- Live preview on the right showing the grid
- Cancel / Save format buttons

**Upload PDF Template Flow:**
- File upload accepting .pdf
- After upload, show "Review extracted dimensions" modal (Screenshot 3)
- Auto-populate all fields from PDF analysis (use AI/heuristic to measure grid from PDF)
- For v1: parse PDF page dimensions and try to detect grid lines. If detection fails, just pre-fill page size and let user enter the rest manually.
- User reviews, corrects any values, saves
- Live preview updates as values change

### Page 3: My Labels (`/labels`)
Grid of saved label designs.
- Thumbnail preview of each design
- Name, format used, last modified date
- Click to open in designer
- Duplicate / Delete actions

### Page 4: Print (`/print`)
Batch printing with dynamic data.

- Select a saved label design
- Upload CSV file
- Preview table showing CSV data mapped to label fields
- Preview of first few labels with data filled in
- Print button with options:
  - For thermal: "Print via QZ Tray" (sends ZPL)
  - For sheet: "Generate PDF" (opens print dialog)
- Quantity per row option (print N copies of each)

## ZPL Generation
For thermal labels, generate ZPL commands from the design:

```zpl
^XA
^FO{x_dots},{y_dots}^A0N,{height},{width}^FD{text}^FS     // Text
^FO{x_dots},{y_dots}^BQN,2,{size}^FDMA,{data}^FS          // QR Code
^FO{x_dots},{y_dots}^BCN,{height},Y,N^FD{data}^FS         // Barcode (Code128)
^XZ
```

Conversion: position_dots = position_inches × DPI

## PDF Generation (Sheet Labels)
Use jsPDF to generate a PDF matching the sheet layout:
- Page size matches sheet dimensions
- Place each label at the correct grid position accounting for margins and gaps
- For batch printing with CSV, fill pages sequentially

## QZ Tray Integration
- Detect if QZ Tray is running
- List available printers
- Send raw ZPL data to selected printer
- Status indicator showing connection state
- Fallback message if QZ Tray not detected with setup instructions

## Key UX Details
- All measurements in inches (with option to toggle to mm later)
- Responsive canvas that scales to fit the viewport
- Undo/redo for canvas operations
- Keyboard shortcuts: Delete, Ctrl+Z, Ctrl+Y, Ctrl+S, Ctrl+C, Ctrl+V
- Toast notifications for save/delete actions
- Smooth animations on modals and transitions

## What NOT to Build in v1
- User accounts / authentication
- Cloud storage / database backend
- Compliance-specific features
- Multiple label designs per page (one design, batch print)
- Direct USB printing (QZ Tray handles this)
- Image editing/cropping

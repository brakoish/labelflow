# LabelFlow Redesign — Build What's Right

The current UI was too closely copied from mockup screenshots. Rebuild from scratch with proper UX for a real label designer.

## Design Philosophy
- This is a TOOL, not a dashboard. Think Figma, Canva, or BarTender — not a settings page.
- The canvas is king. It should dominate the screen.
- Minimize chrome. Every pixel of UI should earn its place.
- Professional dark theme but YOUR OWN design language — not copying anyone's mockups.

## Layout Approach

### Designer Page (/)
Use a **Figma-like layout**:

**Top toolbar** (thin, ~48px):
- Left: Logo/app name (small), current design name (editable inline), save button
- Center: Format selector (dropdown showing "2" × 1" - Avery 5160"), quick W×H number inputs
- Right: Zoom controls, undo/redo, mode toggle (Thermal/Sheet)

**Left toolbar** (narrow, ~56px, icon-only):
- Vertical icon strip: Select tool, Text, QR Code, Barcode, Image, Rectangle, Ellipse, Line
- Just icons with tooltips, no labels — like Figma's left toolbar
- Active tool highlighted

**Center: Canvas workspace** (takes ALL remaining space):
- Gray workspace background (#0a0a0a or similar)
- White label "artboard" centered with a subtle shadow
- Actual canvas zoom/pan support
- Rulers along top and left edges (in inches)
- Orange dashed border around label bounds
- Grid dots or lines (toggleable)

**Right panel** (~280px, collapsible):
- When nothing selected: Print settings (DPI, darkness, speed, media type) — compact
- When element selected: Element-specific properties
  - Position: X/Y (inches, number inputs)
  - Size: W/H (inches)
  - Rotation
  - For text: font family, size, weight, alignment, color, line height
  - For QR: data value, error correction level, size
  - For barcode: data value, format (CODE128/CODE39/EAN13/UPC), show text toggle
  - For shapes: fill color, stroke color, stroke width, corner radius
  - **Dynamic Data section** (at bottom of properties):
    - Toggle: "Use dynamic data"
    - When on: field name input with {{ }} preview
    - Small info text: "This value will be replaced per row from CSV"

**Bottom bar** (thin, ~32px):
- Left: artboard dimensions, element count
- Right: zoom percentage, coordinates of cursor in inches

### Formats Page (/formats)
Two-column layout:
- Left: list/grid of saved formats with search/filter
- Right: selected format detail with visual sheet preview and editable specs
- FAB or top button: "New Format" opens inline editor (not a modal)
- "Import from PDF" as a secondary action

Each format card should show:
- Name, type badge (thermal/sheet)
- Mini visual grid preview (SVG-based, not canvas — lighter)
- Key stat: "30 labels/sheet" or "2×1 thermal roll"

### Labels Page (/labels)  
Grid of saved label designs:
- Actual thumbnail preview of the design (export canvas to image on save)
- Name, format used, last modified
- Click opens in designer
- Hover shows quick actions (duplicate, delete, download)

### Print Page (/print)
Streamlined wizard-style:
1. Pick a saved design (card selector with thumbnails)
2. Dynamic data section:
   - Shows which fields are dynamic on this design
   - "Download CSV template" button (auto-generates headers from dynamic fields)
   - CSV upload dropzone
   - Data preview table
3. Print settings:
   - Quantity per row
   - For thermal: printer selector (from QZ Tray), print button
   - For sheet: "Generate PDF" button with preview of first page
   - Total labels count, sheets needed estimate

## Technical Changes Needed

### Canvas Improvements
- Add proper zoom/pan (mouse wheel zoom, space+drag to pan)
- Snap to grid (configurable grid size)
- Snap to other elements (smart guides)
- Keyboard shortcuts: Delete, Ctrl+Z/Y, Ctrl+S, Ctrl+D (duplicate), arrow keys for nudge
- Multi-select with shift+click
- Copy/paste elements

### Element Properties
- Store ALL element data in a clean model (not fabric.js custom properties hacks)
- Maintain a parallel data model: CanvasElement[] that maps to fabric objects
- On any fabric object change (move, resize), sync back to data model
- On data model change (property panel edit), update fabric object

### Dynamic Data
- Elements with isDynamic=true show {{fieldName}} as placeholder text/content
- When printing: substitute actual CSV values per row
- For QR/barcode: regenerate the code image with the substituted value

### Serialization
- Save full canvas state: element positions, sizes, properties, dynamic bindings
- Export/import designs as JSON
- Generate thumbnail on save (canvas.toDataURL())

### Grid Preview Component (formats)
- Use SVG instead of canvas for the sheet grid previews — lighter, crisper, more responsive
- Show actual proportional layout of labels on sheet

## Colors & Styling
Build your own palette:
- Background: #09090b (zinc-950)
- Surface: #18181b (zinc-900) 
- Border: #27272a (zinc-800)
- Accent: #6366f1 (indigo-500) — more distinctive than generic blue
- Text primary: #fafafa
- Text secondary: #a1a1aa (zinc-400)
- Canvas background: #0a0a0a
- Label artboard: #ffffff
- Selection: #6366f1 with opacity
- Rulers: subtle, #27272a background with #52525b tick marks

Rounded corners: 8px for panels, 6px for inputs, 4px for small elements.
Font: Inter or system-ui. Monospace for dimension values.

## DO NOT:
- Copy the screenshot layout verbatim
- Use emoji as icons (use proper SVG icons — install lucide-react)
- Make it look like a settings dashboard
- Use fat sidebars — keep them slim and focused
- Add descriptions/subtitles under every heading

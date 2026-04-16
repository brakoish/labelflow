import { create } from 'zustand';
import {
  LabelFormat,
  LabelDesign,
  CanvasElement,
  ToolType,
  CanvasState,
  HistoryState,
  PrintSettings
} from './types';

// LocalStorage keys
const FORMATS_KEY = 'labelflow_formats';
const DESIGNS_KEY = 'labelflow_designs';

// LocalStorage helpers
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// Designer Store - for the main canvas workspace
interface DesignerStore {
  // Current design state
  currentDesign: LabelDesign | null;
  currentFormat: LabelFormat | null;
  selectedElementIds: string[];
  activeTool: ToolType;
  canvasState: CanvasState;
  history: HistoryState;
  printSettings: PrintSettings;
  cursorPosition: { x: number; y: number };

  // Actions
  setCurrentDesign: (design: LabelDesign | null) => void;
  setCurrentFormat: (format: LabelFormat | null) => void;
  setSelectedElements: (ids: string[]) => void;
  setActiveTool: (tool: ToolType) => void;
  setCanvasState: (state: Partial<CanvasState>) => void;
  setCursorPosition: (pos: { x: number; y: number }) => void;

  // Element operations
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  deleteSelectedElements: () => void;
  duplicateElement: (id: string) => void;

  // History operations
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Design operations
  saveCurrentDesign: (thumbnail?: string) => void;
  updateDesignName: (name: string) => void;
}

export const useDesignerStore = create<DesignerStore>((set, get) => ({
  currentDesign: null,
  currentFormat: null,
  selectedElementIds: [],
  activeTool: 'select',
  canvasState: {
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
    showRulers: true,
    snapToGrid: true,
    gridSize: 0.125, // 1/8 inch
  },
  history: {
    past: [],
    present: [],
    future: [],
  },
  printSettings: {
    mode: 'sheet',
    safeMargin: 0.125,
    dpi: 300,
    darkness: 50,
    printSpeed: 4,
    mediaType: 'direct',
  },
  cursorPosition: { x: 0, y: 0 },

  setCurrentDesign: (design) => set({ currentDesign: design }),

  setCurrentFormat: (format) => set({ currentFormat: format }),

  setSelectedElements: (ids) => set({ selectedElementIds: ids }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setCanvasState: (state) => set((prev) => ({
    canvasState: { ...prev.canvasState, ...state }
  })),

  setCursorPosition: (pos) => set({ cursorPosition: pos }),

  addElement: (element) => {
    const { currentDesign } = get();
    if (!currentDesign) return;

    const updatedDesign = {
      ...currentDesign,
      elements: [...currentDesign.elements, element],
      updatedAt: new Date().toISOString(),
    };

    set({ currentDesign: updatedDesign });
    get().pushHistory();
  },

  updateElement: (id, updates) => {
    const { currentDesign } = get();
    if (!currentDesign) return;

    const updatedDesign = {
      ...currentDesign,
      elements: currentDesign.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      ),
      updatedAt: new Date().toISOString(),
    };

    set({ currentDesign: updatedDesign });
  },

  deleteElement: (id) => {
    const { currentDesign } = get();
    if (!currentDesign) return;

    const updatedDesign = {
      ...currentDesign,
      elements: currentDesign.elements.filter(el => el.id !== id),
      updatedAt: new Date().toISOString(),
    };

    set({
      currentDesign: updatedDesign,
      selectedElementIds: get().selectedElementIds.filter(eid => eid !== id)
    });
    get().pushHistory();
  },

  deleteSelectedElements: () => {
    const { selectedElementIds, currentDesign } = get();
    if (!currentDesign || selectedElementIds.length === 0) return;

    const updatedDesign = {
      ...currentDesign,
      elements: currentDesign.elements.filter(el => !selectedElementIds.includes(el.id)),
      updatedAt: new Date().toISOString(),
    };

    set({
      currentDesign: updatedDesign,
      selectedElementIds: []
    });
    get().pushHistory();
  },

  duplicateElement: (id) => {
    const { currentDesign } = get();
    if (!currentDesign) return;

    const element = currentDesign.elements.find(el => el.id === id);
    if (!element) return;

    const newElement: CanvasElement = {
      ...element,
      id: crypto.randomUUID(),
      x: element.x + 0.125,
      y: element.y + 0.125,
    };

    get().addElement(newElement);
  },

  pushHistory: () => {
    const { currentDesign, history } = get();
    if (!currentDesign) return;

    set({
      history: {
        past: [...history.past, history.present],
        present: currentDesign.elements,
        future: [],
      }
    });
  },

  undo: () => {
    const { history, currentDesign } = get();
    if (!currentDesign || history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    set({
      currentDesign: {
        ...currentDesign,
        elements: previous,
      },
      history: {
        past: newPast,
        present: previous,
        future: [history.present, ...history.future],
      }
    });
  },

  redo: () => {
    const { history, currentDesign } = get();
    if (!currentDesign || history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    set({
      currentDesign: {
        ...currentDesign,
        elements: next,
      },
      history: {
        past: [...history.past, history.present],
        present: next,
        future: newFuture,
      }
    });
  },

  saveCurrentDesign: (thumbnail) => {
    const { currentDesign } = get();
    if (!currentDesign) return;

    const designToSave = thumbnail ? { ...currentDesign, thumbnail } : currentDesign;
    const designs = loadFromStorage<LabelDesign[]>(DESIGNS_KEY, []);
    const index = designs.findIndex(d => d.id === designToSave.id);

    if (index >= 0) {
      designs[index] = designToSave;
    } else {
      designs.push(designToSave);
    }

    saveToStorage(DESIGNS_KEY, designs);
    set({ currentDesign: designToSave });
  },

  updateDesignName: (name) => {
    const { currentDesign } = get();
    if (!currentDesign) return;

    set({
      currentDesign: {
        ...currentDesign,
        name,
        updatedAt: new Date().toISOString(),
      }
    });
  },
}));

// Formats Store - for managing label formats
interface FormatsStore {
  formats: LabelFormat[];
  loadFormats: () => void;
  saveFormat: (format: LabelFormat) => void;
  deleteFormat: (id: string) => void;
  getFormatById: (id: string) => LabelFormat | undefined;
}

export const useFormatsStore = create<FormatsStore>((set, get) => ({
  formats: [],

  loadFormats: () => {
    const formats = loadFromStorage<LabelFormat[]>(FORMATS_KEY, []);

    // Initialize with defaults if empty
    if (formats.length === 0) {
      const now = new Date().toISOString();
      const defaultFormats: LabelFormat[] = [
        // === THERMAL ROLLS ===
        {
          id: 'thermal-2x1',
          name: '2" × 1" Thermal Roll',
          description: 'Standard product label',
          type: 'thermal',
          labelWidth: 2,
          labelHeight: 1,
          dpi: 203,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'thermal-1x0.5',
          name: '1" × 0.5" Thermal Roll',
          description: 'Small item label',
          type: 'thermal',
          labelWidth: 1,
          labelHeight: 0.5,
          dpi: 203,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'thermal-4x6',
          name: '4" × 6" Thermal Roll',
          description: 'Shipping label',
          type: 'thermal',
          labelWidth: 4,
          labelHeight: 6,
          dpi: 203,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'thermal-2.25x1.25',
          name: '2.25" × 1.25" Thermal Roll',
          description: 'Jewelry/retail label',
          type: 'thermal',
          labelWidth: 2.25,
          labelHeight: 1.25,
          dpi: 203,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'thermal-3x2',
          name: '3" × 2" Thermal Roll',
          description: 'Medium product label',
          type: 'thermal',
          labelWidth: 3,
          labelHeight: 2,
          dpi: 203,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'thermal-0.5x0.5-3across',
          name: '0.5" × 0.5" Thermal Roll (3 across)',
          description: 'Small round dots',
          type: 'thermal',
          labelWidth: 0.5,
          labelHeight: 0.5,
          labelsAcross: 3,
          dpi: 203,
          createdAt: now,
          updatedAt: now,
        },
        // === SHEET LABELS ===
        {
          id: 'avery-5160',
          name: 'Avery 5160',
          description: '2.625" × 1" (30 per sheet)',
          type: 'sheet',
          labelWidth: 2.625,
          labelHeight: 1,
          sheetWidth: 8.5,
          sheetHeight: 11,
          columns: 3,
          rows: 10,
          labelsPerSheet: 30,
          topMargin: 0.5,
          sideMargin: 0.1875,
          horizontalGap: 0.125,
          verticalGap: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'avery-5163',
          name: 'Avery 5163',
          description: '4" × 2" (10 per sheet)',
          type: 'sheet',
          labelWidth: 4,
          labelHeight: 2,
          sheetWidth: 8.5,
          sheetHeight: 11,
          columns: 2,
          rows: 5,
          labelsPerSheet: 10,
          topMargin: 0.5,
          sideMargin: 0.15625,
          horizontalGap: 0.1875,
          verticalGap: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'avery-5167',
          name: 'Avery 5167',
          description: '1.75" × 0.5" (80 per sheet)',
          type: 'sheet',
          labelWidth: 1.75,
          labelHeight: 0.5,
          sheetWidth: 8.5,
          sheetHeight: 11,
          columns: 4,
          rows: 20,
          labelsPerSheet: 80,
          topMargin: 0.5,
          sideMargin: 0.28125,
          horizontalGap: 0.3125,
          verticalGap: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'avery-8164',
          name: 'Avery 8164',
          description: '4" × 3.33" (6 per sheet)',
          type: 'sheet',
          labelWidth: 4,
          labelHeight: 3.33,
          sheetWidth: 8.5,
          sheetHeight: 11,
          columns: 2,
          rows: 3,
          labelsPerSheet: 6,
          topMargin: 0.5,
          sideMargin: 0.15625,
          horizontalGap: 0.1875,
          verticalGap: 0.01,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'ol-2050',
          name: 'OL2050',
          description: '0.5" × 0.5" (221 per sheet)',
          type: 'sheet',
          labelWidth: 0.5,
          labelHeight: 0.5,
          sheetWidth: 8.5,
          sheetHeight: 11,
          columns: 13,
          rows: 17,
          labelsPerSheet: 221,
          topMargin: 0.5,
          sideMargin: 0.3125,
          horizontalGap: 0.125,
          verticalGap: 0.125,
          createdAt: now,
          updatedAt: now,
        },
      ];
      saveToStorage(FORMATS_KEY, defaultFormats);
      set({ formats: defaultFormats });
    } else {
      set({ formats });
    }
  },

  saveFormat: (format) => {
    const { formats } = get();
    const index = formats.findIndex(f => f.id === format.id);

    let updatedFormats: LabelFormat[];
    if (index >= 0) {
      updatedFormats = [...formats];
      updatedFormats[index] = format;
    } else {
      updatedFormats = [...formats, format];
    }

    saveToStorage(FORMATS_KEY, updatedFormats);
    set({ formats: updatedFormats });
  },

  deleteFormat: (id) => {
    const updatedFormats = get().formats.filter(f => f.id !== id);
    saveToStorage(FORMATS_KEY, updatedFormats);
    set({ formats: updatedFormats });
  },

  getFormatById: (id) => {
    return get().formats.find(f => f.id === id);
  },
}));

// Designs Store - for managing saved designs
interface DesignsStore {
  designs: LabelDesign[];
  loadDesigns: () => void;
  deleteDesign: (id: string) => void;
  getDesignById: (id: string) => LabelDesign | undefined;
}

export const useDesignsStore = create<DesignsStore>((set, get) => ({
  designs: [],

  loadDesigns: () => {
    const designs = loadFromStorage<LabelDesign[]>(DESIGNS_KEY, []);
    set({ designs });
  },

  deleteDesign: (id) => {
    const updatedDesigns = get().designs.filter(d => d.id !== id);
    saveToStorage(DESIGNS_KEY, updatedDesigns);
    set({ designs: updatedDesigns });
  },

  getDesignById: (id) => {
    return get().designs.find(d => d.id === id);
  },
}));

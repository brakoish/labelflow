import { LabelFormat, LabelDesign } from './types';

const FORMATS_KEY = 'labelflow_formats';
const DESIGNS_KEY = 'labelflow_designs';

// Format storage functions
export function getFormats(): LabelFormat[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(FORMATS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveFormat(format: LabelFormat): void {
  const formats = getFormats();
  const index = formats.findIndex(f => f.id === format.id);

  if (index >= 0) {
    formats[index] = format;
  } else {
    formats.push(format);
  }

  localStorage.setItem(FORMATS_KEY, JSON.stringify(formats));
}

export function deleteFormat(id: string): void {
  const formats = getFormats().filter(f => f.id !== id);
  localStorage.setItem(FORMATS_KEY, JSON.stringify(formats));
}

export function getFormatById(id: string): LabelFormat | undefined {
  return getFormats().find(f => f.id === id);
}

// Design storage functions
export function getDesigns(): LabelDesign[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(DESIGNS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveDesign(design: LabelDesign): void {
  const designs = getDesigns();
  const index = designs.findIndex(d => d.id === design.id);

  if (index >= 0) {
    designs[index] = design;
  } else {
    designs.push(design);
  }

  localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
}

export function deleteDesign(id: string): void {
  const designs = getDesigns().filter(d => d.id !== id);
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
}

export function getDesignById(id: string): LabelDesign | undefined {
  return getDesigns().find(d => d.id === id);
}

// Initialize with default formats if none exist
export function initializeDefaultFormats(): void {
  const formats = getFormats();
  if (formats.length === 0) {
    const now = new Date().toISOString();

    const defaultFormats: LabelFormat[] = [
      {
        id: 'avery-5160',
        name: 'Avery 5160',
        description: '2.625" × 1"',
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
        id: 'ol2050',
        name: 'OL2050',
        description: '0.5" × 0.5"',
        type: 'sheet',
        labelWidth: 0.5,
        labelHeight: 0.5,
        sheetWidth: 8.5,
        sheetHeight: 11,
        columns: 13,
        rows: 17,
        labelsPerSheet: 221,
        topMargin: 0.25,
        sideMargin: 0.25,
        horizontalGap: 0.125,
        verticalGap: 0.125,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ol1067',
        name: 'OL1067',
        description: '1.5" × 0.75"',
        type: 'sheet',
        labelWidth: 1.5,
        labelHeight: 0.75,
        sheetWidth: 8.5,
        sheetHeight: 11,
        columns: 5,
        rows: 12,
        labelsPerSheet: 60,
        topMargin: 0.3125,
        sideMargin: 0.25,
        horizontalGap: 0.125,
        verticalGap: 0.125,
        createdAt: now,
        updatedAt: now,
      },
    ];

    localStorage.setItem(FORMATS_KEY, JSON.stringify(defaultFormats));
  }
}

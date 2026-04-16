'use client';

import { useDesignerStore } from '@/lib/store';
import { CanvasElement } from '@/lib/types';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function PropertiesPanel() {
  const { currentDesign, selectedElementIds, updateElement } = useDesignerStore();

  if (!currentDesign) {
    return <div className="w-72 bg-zinc-900 border-l border-zinc-800" />;
  }

  const selectedElement =
    selectedElementIds.length === 1
      ? currentDesign.elements.find((el) => el.id === selectedElementIds[0])
      : null;

  return (
    <div className="w-72 bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
      {selectedElement ? (
        <ElementProperties element={selectedElement} onUpdate={updateElement} />
      ) : (
        <PrintSettings />
      )}
    </div>
  );
}

function ElementProperties({
  element,
  onUpdate,
}: {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}) {
  const [collapsed, setCollapsed] = useState({
    position: false,
    appearance: false,
    dynamic: false,
  });

  const updateField = (field: keyof CanvasElement, value: any) => {
    onUpdate(element.id, { [field]: value });

    // Trigger canvas refresh by dispatching a custom event
    window.dispatchEvent(new CustomEvent('element-updated', {
      detail: { id: element.id, field, value }
    }));
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-100 capitalize">{element.type}</h3>

      {/* Position & Size */}
      <Section
        title="Position & Size"
        collapsed={collapsed.position}
        onToggle={() => setCollapsed((s) => ({ ...s, position: !s.position }))}
      >
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="X" value={element.x} onChange={(v) => updateField('x', v)} unit="in" />
          <NumberInput label="Y" value={element.y} onChange={(v) => updateField('y', v)} unit="in" />
          <NumberInput label="W" value={element.width} onChange={(v) => updateField('width', v)} unit="in" />
          <NumberInput label="H" value={element.height} onChange={(v) => updateField('height', v)} unit="in" />
        </div>
        <NumberInput
          label="Rotation"
          value={element.rotation || 0}
          onChange={(v) => updateField('rotation', v)}
          unit="°"
        />
      </Section>

      {/* Type-specific properties */}
      {element.type === 'text' && (
        <Section
          title="Text Properties"
          collapsed={collapsed.appearance}
          onToggle={() => setCollapsed((s) => ({ ...s, appearance: !s.appearance }))}
        >
          <TextInput
            label="Text"
            value={element.text || ''}
            onChange={(v) => updateField('text', v)}
            multiline
          />
          <SelectInput
            label="Font Family"
            value={element.fontFamily || 'Arial'}
            onChange={(v) => updateField('fontFamily', v)}
            options={['Arial', 'Helvetica', 'Times New Roman', 'Courier', 'monospace']}
          />
          <NumberInput
            label="Font Size"
            value={element.fontSize || 12}
            onChange={(v) => updateField('fontSize', v)}
            unit="pt"
          />
          <SelectInput
            label="Weight"
            value={element.fontWeight || 'normal'}
            onChange={(v) => updateField('fontWeight', v)}
            options={['normal', 'bold']}
          />
          <SelectInput
            label="Align"
            value={element.textAlign || 'left'}
            onChange={(v) => updateField('textAlign', v as any)}
            options={['left', 'center', 'right']}
          />
          <ColorInput label="Color" value={element.color || '#000000'} onChange={(v) => updateField('color', v)} />
        </Section>
      )}

      {element.type === 'qr' && (
        <Section
          title="QR Code Properties"
          collapsed={collapsed.appearance}
          onToggle={() => setCollapsed((s) => ({ ...s, appearance: !s.appearance }))}
        >
          <TextInput label="Data" value={element.qrData || ''} onChange={(v) => updateField('qrData', v)} />
          <SelectInput
            label="Error Correction"
            value={element.qrErrorCorrection || 'M'}
            onChange={(v) => updateField('qrErrorCorrection', v)}
            options={['L', 'M', 'Q', 'H']}
          />
        </Section>
      )}

      {element.type === 'barcode' && (
        <Section
          title="Barcode Properties"
          collapsed={collapsed.appearance}
          onToggle={() => setCollapsed((s) => ({ ...s, appearance: !s.appearance }))}
        >
          <TextInput label="Data" value={element.barcodeData || ''} onChange={(v) => updateField('barcodeData', v)} />
          <SelectInput
            label="Format"
            value={element.barcodeFormat || 'CODE128'}
            onChange={(v) => updateField('barcodeFormat', v)}
            options={['CODE128', 'CODE39', 'EAN13', 'UPC']}
          />
          <CheckboxInput
            label="Show Text"
            checked={element.showBarcodeText !== false}
            onChange={(v) => updateField('showBarcodeText', v)}
          />
        </Section>
      )}

      {element.type === 'shape' && (
        <Section
          title="Shape Properties"
          collapsed={collapsed.appearance}
          onToggle={() => setCollapsed((s) => ({ ...s, appearance: !s.appearance }))}
        >
          <ColorInput label="Fill" value={element.fillColor || 'transparent'} onChange={(v) => updateField('fillColor', v)} />
          <ColorInput label="Stroke" value={element.strokeColor || '#000000'} onChange={(v) => updateField('strokeColor', v)} />
          <NumberInput
            label="Stroke Width"
            value={element.strokeWidth || 1}
            onChange={(v) => updateField('strokeWidth', v)}
            unit="px"
          />
          {element.shapeType === 'rect' && (
            <NumberInput
              label="Corner Radius"
              value={element.cornerRadius || 0}
              onChange={(v) => updateField('cornerRadius', v)}
              unit="px"
            />
          )}
        </Section>
      )}

      {/* Dynamic Data */}
      <Section
        title="Dynamic Data"
        collapsed={collapsed.dynamic}
        onToggle={() => setCollapsed((s) => ({ ...s, dynamic: !s.dynamic }))}
      >
        <CheckboxInput
          label="Use dynamic data"
          checked={element.isDynamic || false}
          onChange={(v) => updateField('isDynamic', v)}
        />
        {element.isDynamic && (
          <>
            <TextInput
              label="Field Name"
              value={element.fieldName || ''}
              onChange={(v) => updateField('fieldName', v)}
              placeholder="e.g. name, sku, price"
            />
            <div className="text-xs text-zinc-500 mt-1">
              Use <span className="font-mono bg-zinc-800 px-1 rounded">{'{{' + (element.fieldName || 'fieldName') + '}}'}</span> in CSV
            </div>
          </>
        )}
      </Section>
    </div>
  );
}

function PrintSettings() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-100">Print Settings</h3>
      <div className="space-y-3">
        <NumberInput label="DPI" value={300} onChange={() => {}} />
        <NumberInput label="Darkness" value={50} onChange={() => {}} unit="%" />
        <NumberInput label="Speed" value={4} onChange={() => {}} unit="ips" />
        <SelectInput
          label="Media Type"
          value="direct"
          onChange={() => {}}
          options={['direct', 'transfer']}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-zinc-800 pt-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-xs font-semibold text-zinc-300 mb-3 hover:text-zinc-100"
      >
        {title}
        <ChevronRight size={14} className={`transition-transform ${!collapsed ? 'rotate-90' : ''}`} />
      </button>
      {!collapsed && <div className="space-y-3">{children}</div>}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 bg-zinc-800 text-sm text-zinc-100 border border-zinc-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500 font-mono"
        />
        {unit && <span className="text-xs text-zinc-500 w-8">{unit}</span>}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const Component = multiline ? 'textarea' : 'input';

  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <Component
        type={multiline ? undefined : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        className="w-full bg-zinc-800 text-sm text-zinc-100 border border-zinc-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500 resize-none"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 text-sm text-zinc-100 border border-zinc-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-zinc-800 text-sm text-zinc-100 border border-zinc-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500 font-mono"
        />
      </div>
    </div>
  );
}

function CheckboxInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 bg-zinc-800 border border-zinc-700 rounded accent-indigo-500"
      />
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}

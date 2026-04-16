import { LabelFormat } from '@/lib/types';

interface FormatGridPreviewProps {
  format: LabelFormat;
  className?: string;
}

export default function FormatGridPreview({ format, className = '' }: FormatGridPreviewProps) {
  if (format.type !== 'sheet' || !format.columns || !format.rows || !format.sheetWidth || !format.sheetHeight) {
    return null;
  }

  const {
    columns,
    rows,
    sheetWidth,
    sheetHeight,
    labelWidth,
    labelHeight,
    topMargin = 0,
    sideMargin = 0,
    horizontalGap = 0,
    verticalGap = 0
  } = format;

  // Calculate scale to fit in preview
  const previewWidth = 300;
  const previewHeight = (sheetHeight / sheetWidth) * previewWidth;
  const scale = previewWidth / sheetWidth;

  return (
    <div className={`relative bg-white ${className}`} style={{ width: previewWidth, height: previewHeight }}>
      <svg width={previewWidth} height={previewHeight} className="absolute inset-0">
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: columns }).map((_, col) => {
            const x = (sideMargin + col * (labelWidth + horizontalGap)) * scale;
            const y = (topMargin + row * (labelHeight + verticalGap)) * scale;
            const w = labelWidth * scale;
            const h = labelHeight * scale;

            return (
              <rect
                key={`${row}-${col}`}
                x={x}
                y={y}
                width={w}
                height={h}
                fill="#DBEAFE"
                stroke="#3B82F6"
                strokeWidth="1"
                rx="2"
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

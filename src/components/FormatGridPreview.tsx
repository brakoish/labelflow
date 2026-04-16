'use client';

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

  // Scale factor for SVG preview
  const scale = 20; // pixels per inch
  const svgWidth = sheetWidth * scale;
  const svgHeight = sheetHeight * scale;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto max-w-[180px] mx-auto"
        style={{ aspectRatio: `${sheetWidth}/${sheetHeight}` }}
      >
        {/* Sheet background */}
        <rect width={svgWidth} height={svgHeight} fill="#ffffff" stroke="#27272a" strokeWidth="1" />

        {/* Labels grid */}
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
                fill="none"
                stroke="#6366f1"
                strokeWidth="0.8"
                strokeDasharray="2,1"
                rx="1"
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

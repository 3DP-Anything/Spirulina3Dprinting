import React from 'react';

interface PdfIconProps {
  className?: string;
  strokeWidth?: number | string;
}

/**
 * Crisp PDF Document Icon for toolbars and buttons.
 * Displays a document sheet with folded corner and clean PDF styling.
 */
export const PdfIcon: React.FC<PdfIconProps> = ({ className = 'w-4 h-4', strokeWidth = 1.5 }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Document outline with folded top-right corner */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      
      {/* "PDF" badge lines / text styling */}
      <path d="M9 13v4" />
      <path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9" />
      <path d="M13 13v4" />
      <path d="M13 13h1a2 2 0 0 1 0 4h-1" />
      <path d="M17 13h2" />
      <path d="M17 15h1.5" />
      <path d="M17 13v4" />
    </svg>
  );
};

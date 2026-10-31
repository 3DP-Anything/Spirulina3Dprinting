import React from 'react';

interface ScrewdriverSpannerIconProps {
  className?: string;
}

/**
 * Crossed Screwdriver and Spanner (Wrench) maintenance & repair icon.
 */
export const ScrewdriverSpannerIcon: React.FC<ScrewdriverSpannerIconProps> = ({
  className = 'w-4 h-4',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Spanner / Wrench: Diagonal from bottom-left to top-right */}
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />

      {/* Screwdriver: Diagonal from top-left to bottom-right */}
      {/* Screwdriver tip */}
      <path d="M4.5 4.5 L6.5 2.5 L8.5 4.5 L6.5 6.5 Z" />
      {/* Screwdriver shaft */}
      <path d="M6.5 6.5 L12 12" />
      {/* Screwdriver handle */}
      <path d="M12.5 10.5 L14 9 L20 15 L18.5 16.5 L17 18 L11 12 Z" />
      <path d="M14.5 12.5 L17.5 15.5" />
    </svg>
  );
};

import React from 'react';

export interface CauldronIconProps {
  className?: string;
  size?: number;
}

/**
 * CauldronIcon component
 * Designed to match the stroke, weight, and visual language of Lucide icons (24x24 viewBox).
 * Depicts a bubbling paste cauldron with side handles and tripod feet.
 */
export const CauldronIcon: React.FC<CauldronIconProps> = ({
  className = 'w-4 h-4',
  size = 24,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Paste bubbles rising above rim */}
      <circle cx="8.5" cy="4.5" r="1.2" />
      <circle cx="14" cy="3.5" r="1" />
      
      {/* Cauldron rim */}
      <path d="M4 8.5h16" />
      
      {/* Bulbous pot body */}
      <path d="M4.5 8.5C4.5 14.5 7.8 19 12 19s7.5-4.5 7.5-10.5" />
      
      {/* Cauldron side handles */}
      <path d="M4.5 11.5a2.5 2.5 0 0 0 0 4" />
      <path d="M19.5 11.5a2.5 2.5 0 0 1 0 4" />
      
      {/* Base tripod legs */}
      <path d="m6.5 18.5-2 3.5" />
      <path d="m17.5 18.5 2 3.5" />
    </svg>
  );
};

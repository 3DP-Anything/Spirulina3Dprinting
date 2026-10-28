import React from 'react';
import logoUrl from '../../Project-Logo1.svg';

export function ProjectLogoAnimated({ size = 80 }: { size?: number }) {
  const height = size * 0.8; // Aspect ratio is 50x40
  return (
    <img
      src={logoUrl}
      style={{ width: size, height: height, display: 'block' }}
      className="select-none pointer-events-none object-contain"
      alt="Project Logo"
      referrerPolicy="no-referrer"
    />
  );
}

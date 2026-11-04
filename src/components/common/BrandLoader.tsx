import React from 'react';

interface BrandLoaderProps {
  size?: number;
  className?: string;
}

/** Brand preloader: load.png spinning 360° (Tailwind animate-spin). */
export const BrandLoader: React.FC<BrandLoaderProps> = ({ size = 64, className = '' }) => (
  <img
    src="/load.png"
    alt="Loading"
    width={size}
    height={size}
    draggable={false}
    className={`animate-spin object-contain select-none ${className}`}
    style={{ width: size, height: size }}
  />
);

export default BrandLoader;

import React from 'react';

interface LogoProps {
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8", animate = false }) => {
  // III logo: three lowercase "i" letters with dots on top
  // Based on brand guidelines: dot (square) on top, stem below, with proper spacing
  return (
    <svg 
      viewBox="0 0 100 60" 
      fill="currentColor" 
      className={`${className} ${animate ? 'hover:text-iii-accent transition-colors duration-300' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* First i */}
      <rect x="15" y="0" width="10" height="10" /> {/* dot */}
      <rect x="15" y="16" width="10" height="44" /> {/* stem */}
      
      {/* Second i */}
      <rect x="45" y="0" width="10" height="10" /> {/* dot */}
      <rect x="45" y="16" width="10" height="44" /> {/* stem */}
      
      {/* Third i */}
      <rect x="75" y="0" width="10" height="10" /> {/* dot */}
      <rect x="75" y="16" width="10" height="44" /> {/* stem */}
    </svg>
  );
};

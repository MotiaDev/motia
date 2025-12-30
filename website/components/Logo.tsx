import React from 'react';

interface LogoProps {
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8", animate = false }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="currentColor" 
      className={`${className} ${animate ? 'hover:text-iii-accent transition-colors duration-300' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="20" y="10" width="15" height="80" />
      <rect x="42.5" y="10" width="15" height="80" />
      <rect x="65" y="10" width="15" height="80" />
    </svg>
  );
};

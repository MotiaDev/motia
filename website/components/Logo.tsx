import React from 'react';

interface LogoProps {
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8", animate = false }) => {
  // iii logo based on brand grid: 4x dot, 2x gap, 12x stem = 18x total height
  // Width of each bar: 4x, spacing between bars: 4x
  // Total width: 4x + 4x + 4x + 4x + 4x = 20x (3 bars + 2 gaps)
  const x = 4; // base unit
  const dotSize = x;        // 4 units
  const gap = x / 2;        // 2 units  
  const stemHeight = x * 3; // 12 units
  const barWidth = x;       // 4 units
  const barSpacing = x;     // 4 units between bars
  
  return (
    <svg 
      viewBox="0 0 20 18" 
      fill="currentColor" 
      className={`${className} ${animate ? 'hover:text-iii-accent transition-colors duration-300' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* First i */}
      <rect x="0" y="0" width={barWidth} height={dotSize} />
      <rect x="0" y={dotSize + gap} width={barWidth} height={stemHeight} />
      
      {/* Second i */}
      <rect x={barWidth + barSpacing} y="0" width={barWidth} height={dotSize} />
      <rect x={barWidth + barSpacing} y={dotSize + gap} width={barWidth} height={stemHeight} />
      
      {/* Third i */}
      <rect x={(barWidth + barSpacing) * 2} y="0" width={barWidth} height={dotSize} />
      <rect x={(barWidth + barSpacing) * 2} y={dotSize + gap} width={barWidth} height={stemHeight} />
    </svg>
  );
};

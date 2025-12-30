import React from 'react';

interface LogoProps {
  className?: string;
  highlightIndex?: number; // 0, 1, 2 to highlight individual i's (for hover animation)
  highlightCount?: number; // 1, 2, 3 to highlight first N i's (for click lock)
  accentColor?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "h-8", 
  highlightIndex,
  highlightCount,
  accentColor = 'fill-iii-accent'
}) => {
  // iii logo based on brand grid: 4x dot, 2x gap, 12x stem = 18x total height
  const x = 4;
  const dotSize = x;
  const gap = x / 2;
  const stemHeight = x * 3;
  const barWidth = x;
  const barSpacing = x;

  const getBarClass = (index: number) => {
    // If highlightCount is set, highlight first N bars
    if (highlightCount !== undefined && index < highlightCount) {
      return `${accentColor} transition-all duration-150`;
    }
    // If highlightIndex is set, highlight only that specific bar
    if (highlightIndex !== undefined && highlightIndex === index) {
      return `${accentColor} transition-all duration-150`;
    }
    return 'fill-current transition-all duration-150';
  };
  
  return (
    <svg 
      viewBox="0 0 20 18" 
      className={`${className} transition-transform duration-150`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* First i */}
      <rect className={getBarClass(0)} x="0" y="0" width={barWidth} height={dotSize} />
      <rect className={getBarClass(0)} x="0" y={dotSize + gap} width={barWidth} height={stemHeight} />
      
      {/* Second i */}
      <rect className={getBarClass(1)} x={barWidth + barSpacing} y="0" width={barWidth} height={dotSize} />
      <rect className={getBarClass(1)} x={barWidth + barSpacing} y={dotSize + gap} width={barWidth} height={stemHeight} />
      
      {/* Third i */}
      <rect className={getBarClass(2)} x={(barWidth + barSpacing) * 2} y="0" width={barWidth} height={dotSize} />
      <rect className={getBarClass(2)} x={(barWidth + barSpacing) * 2} y={dotSize + gap} width={barWidth} height={stemHeight} />
    </svg>
  );
};

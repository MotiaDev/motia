import React, { useState, useEffect } from 'react';

const rotatingWords = ['SYSTEMS', 'APIS', 'WORKFLOWS', 'AGENTS', 'QUEUES', 'STREAMS', 'JOBS'];

// Block data with fragmented and unified positions
const blocks = [
  // Row 0 (dots)
  { label: 'Redis', fragX: -140, fragY: -90, fragRotate: -15, row: 0, col: 0 },
  { label: 'Express', fragX: 20, fragY: -110, fragRotate: 12, row: 0, col: 1 },
  { label: 'Temporal', fragX: 160, fragY: -70, fragRotate: -8, row: 0, col: 2 },
  // Row 1
  { label: 'Postgres', fragX: -180, fragY: -20, fragRotate: 18, row: 1, col: 0 },
  { label: 'FastAPI', fragX: -40, fragY: 10, fragRotate: -20, row: 1, col: 1 },
  { label: 'Celery', fragX: 130, fragY: -10, fragRotate: 10, row: 1, col: 2 },
  // Row 2
  { label: 'Kafka', fragX: -120, fragY: 60, fragRotate: -12, row: 2, col: 0 },
  { label: 'gRPC', fragX: 50, fragY: 80, fragRotate: 22, row: 2, col: 1 },
  { label: 'BullMQ', fragX: 180, fragY: 50, fragRotate: -18, row: 2, col: 2 },
  // Row 3
  { label: 'RabbitMQ', fragX: -160, fragY: 130, fragRotate: 8, row: 3, col: 0 },
  { label: 'GraphQL', fragX: -20, fragY: 140, fragRotate: -14, row: 3, col: 1 },
  { label: 'Cron', fragX: 140, fragY: 120, fragRotate: 16, row: 3, col: 2 },
];

// Calculate unified grid positions
const GRID_GAP = 16; // Horizontal gap between columns
const BLOCK_WIDTH = 95;
const BLOCK_HEIGHT = 40;
const ROW_GAP = 12; // Vertical gap between rows
const DOT_GAP = 20; // Extra gap after first row (dots)

const getUnifiedPosition = (row: number, col: number) => {
  const x = (col - 1) * (BLOCK_WIDTH + GRID_GAP);
  const extraY = row > 0 ? DOT_GAP : 0;
  const y = (row - 1.5) * (BLOCK_HEIGHT + ROW_GAP) + extraY;
  return { x, y };
};

interface FractureAnimationProps {
  isDarkMode?: boolean;
}

export const FractureAnimation: React.FC<FractureAnimationProps> = ({ isDarkMode = true }) => {
  const [isUnified, setIsUnified] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [isWordAnimating, setIsWordAnimating] = useState(false);

  // Rotating word effect
  useEffect(() => {
    if (!isUnified) return;
    
    const interval = setInterval(() => {
      setIsWordAnimating(true);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsWordAnimating(false);
      }, 200);
    }, 2000);

    return () => clearInterval(interval);
  }, [isUnified]);

  // Auto-animate on scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setTimeout(() => {
              setIsUnified(true);
              setHasAnimated(true);
            }, 500);
          }
        });
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('fracture-animation');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [hasAnimated]);

  // Theme colors
  const bgColor = isDarkMode ? 'bg-iii-black' : 'bg-iii-light';
  const textColor = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';
  
  // Block colors - proper theme support
  const blockBg = isDarkMode ? 'bg-iii-dark/90' : 'bg-white';
  const blockBorder = isDarkMode ? 'border-iii-medium/30' : 'border-gray-300';
  const blockBorderUnified = isDarkMode ? 'border-iii-accent/50' : 'border-iii-accent-light/50';
  const blockText = isDarkMode ? 'text-iii-medium' : 'text-gray-500';
  const blockTextUnified = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';

  return (
    <div id="fracture-animation" className={`w-full ${bgColor} py-16 md:py-24 overflow-hidden`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[10px] md:text-xs text-iii-medium tracking-[0.2em] uppercase mb-2">
            {isUnified ? 'Unified by iii' : 'The Great Fracture'}
          </p>
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter mb-3 ${textColor}`}>
            {isUnified ? (
              <>
                ONE DAEMON. <span className={accentColor}>INFINITE</span>{' '}
                <span className={`inline-block w-[100px] sm:w-[120px] md:w-[160px] text-left ${accentColor}`}>
                  <span className={`inline-block transition-all duration-200 ${isWordAnimating ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'}`}>
                    {rotatingWords[wordIndex]}.
                  </span>
                </span>
              </>
            ) : (
              <>FRAGMENTED <span className="text-iii-medium">INFRASTRUCTURE</span></>
            )}
          </h2>
          <p className="text-xs md:text-sm text-iii-medium max-w-md mx-auto">
            {isUnified 
              ? 'All your infrastructure, unified under a single runtime.'
              : 'Databases, queues, APIs, jobs—all requiring different tools and glue code.'
            }
          </p>
        </div>

        {/* Animation container */}
        <div className="relative h-[300px] md:h-[350px] flex items-center justify-center">
          {/* Connection lines (visible when unified) */}
          <svg 
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${isUnified ? 'opacity-30' : 'opacity-0'}`}
            style={{ pointerEvents: 'none' }}
          >
            {[-1, 0, 1].map((col) => {
              const x = 50 + col * 12;
              return (
                <line
                  key={col}
                  x1={`${x}%`}
                  y1="10%"
                  x2={`${x}%`}
                  y2="90%"
                  stroke={isDarkMode ? '#F3F724' : '#2563eb'}
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
              );
            })}
          </svg>

          {/* Blocks - same elements, different positions */}
          {blocks.map((block, index) => {
            const unified = getUnifiedPosition(block.row, block.col);
            const x = isUnified ? unified.x : block.fragX;
            const y = isUnified ? unified.y : block.fragY;
            const rotate = isUnified ? 0 : block.fragRotate;
            const scale = isUnified ? 1 : 0.9;

            return (
              <div
                key={block.label}
                className={`
                  absolute left-1/2 top-1/2 
                  px-3 py-2 md:px-4 md:py-2.5 
                  rounded-lg border shadow-sm
                  transition-all duration-700 ease-out
                  min-w-[70px] md:min-w-[85px] text-center
                  ${isUnified ? blockBorderUnified : blockBorder}
                  ${blockBg}
                `}
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotate}deg) scale(${scale})`,
                  transitionDelay: `${index * 30}ms`,
                  zIndex: isUnified ? 10 : blocks.length - index,
                }}
              >
                <span className={`text-[10px] md:text-xs font-mono font-medium whitespace-nowrap transition-colors duration-500 ${
                  isUnified ? blockTextUnified : blockText
                }`}>
                  {block.label}
                </span>
              </div>
            );
          })}

          {/* iii logo overlay */}
          <div 
            className={`
              absolute inset-0 flex items-center justify-center pointer-events-none
              transition-opacity duration-700 delay-200
              ${isUnified ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <div className={`text-[80px] md:text-[120px] font-black ${accentColor} opacity-5`}>
              iii
            </div>
          </div>
        </div>

        {/* Toggle */}
        <div 
          className="text-center mt-6 cursor-pointer group"
          onClick={() => setIsUnified(!isUnified)}
        >
          <p className="text-[10px] md:text-xs text-iii-medium/50 group-hover:text-iii-medium transition-colors">
            {isUnified ? '← click to show fracture' : 'click to unify →'}
          </p>
        </div>

        {/* Bottom label */}
        <div className="text-center mt-8">
          <p className={`text-xs md:text-sm font-semibold transition-colors duration-500 ${isUnified ? accentColor : 'text-iii-medium'}`}>
            {isUnified ? 'Stop building glue. Start building logic.' : '12 tools. 12 configs. 12 failure points.'}
          </p>
        </div>
      </div>
    </div>
  );
};

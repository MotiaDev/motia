import React, { useState, useEffect } from 'react';

const rotatingWords = ['SYSTEMS', 'APIS', 'WORKFLOWS', 'AGENTS', 'QUEUES', 'STREAMS', 'JOBS'];

const stackLayers = [
  { label: 'AI AGENTS', items: ['Copilots', 'Chatbots', 'Autonomous'], before: 'Separate ML infra' },
  { label: 'FRAMEWORKS', items: ['Motia', 'Express', 'FastAPI'], before: 'Different runtimes' },
  { label: 'WORKFLOWS', items: ['ETL', 'Pipelines', 'Orchestration'], before: 'Custom orchestrators' },
  { label: 'SERVICES', items: ['APIs', 'Queues', 'Streams'], before: 'Glued together' },
];

interface StackVisualProps {
  isDarkMode?: boolean;
}

export const StackVisual: React.FC<StackVisualProps> = ({ isDarkMode = true }) => {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [isWordAnimating, setIsWordAnimating] = useState(false);

  // Rotating word animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsWordAnimating(true);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsWordAnimating(false);
      }, 200);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const textPrimary = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const cardBg = isDarkMode ? 'bg-iii-dark/50' : 'bg-white/50';
  const cardBorder = isDarkMode ? 'border-iii-medium/30' : 'border-iii-medium/20';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 lg:py-16">
      {/* Animated Heading */}
      <div className="text-center mb-6 md:mb-10">
        <p className="text-[10px] md:text-xs text-iii-medium tracking-[0.2em] uppercase mb-2">
          Unified by iii
        </p>
        <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter mb-3 ${textPrimary}`}>
          ONE DAEMON. <span className={accentColor}>INFINITE</span>{' '}
          <span className={`inline-block w-[100px] sm:w-[120px] md:w-[160px] text-left ${accentColor}`}>
            <span className={`inline-block transition-all duration-200 ${isWordAnimating ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'}`}>
              {rotatingWords[wordIndex]}.
            </span>
          </span>
        </h2>
        <p className="text-xs md:text-sm text-iii-medium max-w-md mx-auto">
          All your infrastructure, unified under a single runtime.
        </p>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Top label */}
        <div className="relative w-full max-w-xs md:max-w-md mb-4">
          <div className={`text-center text-[10px] md:text-xs font-bold tracking-widest mb-2 ${textPrimary}`}>
            WHAT YOU BUILD
          </div>
          <svg viewBox="0 0 200 20" className="w-full h-4 md:h-6 text-iii-medium">
            <path
              d="M 10 18 Q 10 2, 30 2 L 170 2 Q 190 2, 190 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line x1="100" y1="2" x2="100" y2="0" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* Stack layers */}
        <div className="w-full max-w-xs md:max-w-md space-y-1 md:space-y-2">
          {stackLayers.map((layer, index) => (
            <div
              key={layer.label}
              className={`relative group cursor-pointer transition-all duration-300 ${
                hoveredLayer === index ? 'scale-105 z-10' : 'scale-100'
              }`}
              onMouseEnter={() => setHoveredLayer(index)}
              onMouseLeave={() => setHoveredLayer(null)}
            >
              {/* Layer block */}
              <div
                className={`
                  relative px-4 py-3 md:px-6 md:py-4 
                  border-2 rounded-sm
                  transition-all duration-300
                  ${hoveredLayer === index 
                    ? isDarkMode 
                      ? 'bg-iii-dark border-iii-accent shadow-[0_0_20px_rgba(243,247,36,0.2)]'
                      : 'bg-white border-iii-accent-light shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                    : `${cardBg} ${cardBorder} hover:border-iii-medium/60`
                  }
                `}
                style={{
                  marginLeft: `${(stackLayers.length - index - 1) * 8}px`,
                  marginRight: `${(stackLayers.length - index - 1) * 8}px`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] md:text-xs font-bold tracking-wider ${
                    hoveredLayer === index 
                      ? accentColor
                      : textPrimary
                  }`}>
                    {layer.label}
                  </span>
                  <div className="flex gap-1 md:gap-2">
                    {layer.items.map((item, i) => (
                      <span
                        key={i}
                        className={`text-[8px] md:text-[10px] px-1.5 py-0.5 rounded border ${
                          hoveredLayer === index
                            ? isDarkMode 
                              ? 'border-iii-accent/50 text-iii-accent bg-iii-accent/10'
                              : 'border-iii-accent-light/50 text-iii-accent-light bg-iii-accent-light/10'
                            : `${cardBorder} text-iii-medium ${isDarkMode ? 'bg-iii-black/50' : 'bg-white/50'}`
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Connection lines */}
                {index < stackLayers.length - 1 && (
                  <div className="absolute left-1/2 -bottom-2 w-px h-2 bg-iii-medium/30" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Arrow pointing to iii */}
        <div className="relative w-full max-w-xs md:max-w-md mt-4 mb-2">
          <svg viewBox="0 0 200 30" className={`w-full h-6 md:h-8 ${accentColor}`}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
              </marker>
            </defs>
            <line
              x1="170"
              y1="5"
              x2="130"
              y2="25"
              stroke="currentColor"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        </div>

        {/* iii Foundation */}
        <div className="relative w-full max-w-sm md:max-w-lg">
          <div className="relative">
            {/* Main iii block */}
            <div className={`relative px-6 py-6 md:px-10 md:py-8 bg-gradient-to-b border-2 rounded-sm ${
              isDarkMode 
                ? 'from-iii-dark to-iii-black border-iii-accent shadow-[0_0_40px_rgba(243,247,36,0.15)]' 
                : 'from-white to-iii-light border-iii-accent-light shadow-[0_0_40px_rgba(37,99,235,0.15)]'
            }`}>
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(243,247,36,0.05),transparent_70%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_70%)]'}`} />
              
              {/* iii Logo - brand proportions: 4x dot, 2x gap, 12x stem */}
              <div className="relative flex flex-col items-center gap-3">
                <svg 
                  viewBox="0 0 20 18" 
                  className={`w-16 h-14 md:w-24 md:h-20 ${textPrimary}`}
                  fill="currentColor"
                >
                  {/* First i */}
                  <rect x="0" y="0" width="4" height="4" />
                  <rect x="0" y="6" width="4" height="12" />
                  {/* Second i */}
                  <rect x="8" y="0" width="4" height="4" />
                  <rect x="8" y="6" width="4" height="12" />
                  {/* Third i */}
                  <rect x="16" y="0" width="4" height="4" />
                  <rect x="16" y="6" width="4" height="12" />
                </svg>
                <div className="text-center">
                  <div className={`text-[10px] md:text-xs ${accentColor} tracking-[0.2em] uppercase font-bold`}>
                    The Daemon
                  </div>
                  <div className="text-[8px] md:text-[10px] text-iii-medium mt-1">
                    One binary. One daemon.
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className={`absolute top-2 left-2 w-2 h-2 border-l-2 border-t-2 ${isDarkMode ? 'border-iii-accent/50' : 'border-iii-accent-light/50'}`} />
              <div className={`absolute top-2 right-2 w-2 h-2 border-r-2 border-t-2 ${isDarkMode ? 'border-iii-accent/50' : 'border-iii-accent-light/50'}`} />
              <div className={`absolute bottom-2 left-2 w-2 h-2 border-l-2 border-b-2 ${isDarkMode ? 'border-iii-accent/50' : 'border-iii-accent-light/50'}`} />
              <div className={`absolute bottom-2 right-2 w-2 h-2 border-r-2 border-b-2 ${isDarkMode ? 'border-iii-accent/50' : 'border-iii-accent-light/50'}`} />
            </div>

            {/* Base platform layers */}
            <div className={`mt-1 mx-2 h-2 md:h-3 border rounded-b-sm ${isDarkMode ? 'bg-iii-dark/80 border-iii-medium/20' : 'bg-iii-medium/20 border-iii-medium/10'}`} />
            <div className={`mt-0.5 mx-4 h-1.5 md:h-2 border rounded-b-sm ${isDarkMode ? 'bg-iii-dark/60 border-iii-medium/10' : 'bg-iii-medium/15 border-iii-medium/5'}`} />
            <div className={`mt-0.5 mx-6 h-1 md:h-1.5 rounded-b-sm ${isDarkMode ? 'bg-iii-dark/40' : 'bg-iii-medium/10'}`} />
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-8 text-center space-y-2">
          <p className={`text-xs md:text-sm ${accentColor} font-semibold`}>
            Stop building glue. Start building logic.
          </p>
          <p className="text-[10px] md:text-xs text-iii-medium/60 tracking-wider">
            Context · Trigger · Logic
          </p>
        </div>
      </div>
    </div>
  );
};

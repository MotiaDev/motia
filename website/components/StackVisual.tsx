import React, { useState } from 'react';

const stackLayers = [
  { label: 'AI AGENTS', items: ['Copilots', 'Chatbots', 'Autonomous'] },
  { label: 'FRAMEWORKS', items: ['Motia', 'Express', 'FastAPI'] },
  { label: 'WORKFLOWS', items: ['ETL', 'Pipelines', 'Orchestration'] },
  { label: 'SERVICES', items: ['APIs', 'Queues', 'Streams'] },
];

export const StackVisual: React.FC = () => {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tighter mb-3">
          EVERYTHING RUNS ON <span className="text-iii-accent">iii</span>
        </h2>
        <p className="text-xs md:text-sm text-iii-medium max-w-md mx-auto">
          One engine. Infinite possibilities. Build anything on the universal runtime.
        </p>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Top bracket - "YOUR SOFTWARE" */}
        <div className="relative w-full max-w-xs md:max-w-md mb-4">
          <div className="text-center text-xs md:text-sm font-bold tracking-widest text-iii-light mb-2">
            YOUR SOFTWARE
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
                    ? 'bg-iii-dark border-iii-accent shadow-[0_0_20px_rgba(0,255,136,0.2)]' 
                    : 'bg-iii-dark/50 border-iii-medium/30 hover:border-iii-medium/60'
                  }
                `}
                style={{
                  marginLeft: `${(stackLayers.length - index - 1) * 8}px`,
                  marginRight: `${(stackLayers.length - index - 1) * 8}px`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] md:text-xs font-bold tracking-wider ${
                    hoveredLayer === index ? 'text-iii-accent' : 'text-iii-light'
                  }`}>
                    {layer.label}
                  </span>
                  <div className="flex gap-1 md:gap-2">
                    {layer.items.map((item, i) => (
                      <span
                        key={i}
                        className={`text-[8px] md:text-[10px] px-1.5 py-0.5 rounded border ${
                          hoveredLayer === index
                            ? 'border-iii-accent/50 text-iii-accent bg-iii-accent/10'
                            : 'border-iii-dark text-iii-medium bg-iii-black/50'
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

        {/* Arrow pointing to III */}
        <div className="relative w-full max-w-xs md:max-w-md mt-4 mb-2">
          <svg viewBox="0 0 200 30" className="w-full h-6 md:h-8 text-iii-accent">
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

        {/* III Foundation */}
        <div className="relative w-full max-w-sm md:max-w-lg">
          <div className="relative">
            {/* Main III block */}
            <div className="relative px-6 py-6 md:px-10 md:py-8 bg-gradient-to-b from-iii-dark to-iii-black border-2 border-iii-accent rounded-sm shadow-[0_0_40px_rgba(0,255,136,0.15)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,136,0.05),transparent_70%)]" />
              
              {/* iii Logo - three i's with dots */}
              <div className="relative flex flex-col items-center gap-3">
                <svg 
                  viewBox="0 0 100 60" 
                  className="w-20 h-12 md:w-28 md:h-16 text-iii-accent"
                  fill="currentColor"
                >
                  {/* First i */}
                  <rect x="15" y="0" width="10" height="10" />
                  <rect x="15" y="16" width="10" height="44" />
                  {/* Second i */}
                  <rect x="45" y="0" width="10" height="10" />
                  <rect x="45" y="16" width="10" height="44" />
                  {/* Third i */}
                  <rect x="75" y="0" width="10" height="10" />
                  <rect x="75" y="16" width="10" height="44" />
                </svg>
                <div className="text-[10px] md:text-xs text-iii-medium tracking-[0.3em] uppercase">
                  The Universal Runtime
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-2 left-2 w-2 h-2 border-l-2 border-t-2 border-iii-accent/50" />
              <div className="absolute top-2 right-2 w-2 h-2 border-r-2 border-t-2 border-iii-accent/50" />
              <div className="absolute bottom-2 left-2 w-2 h-2 border-l-2 border-b-2 border-iii-accent/50" />
              <div className="absolute bottom-2 right-2 w-2 h-2 border-r-2 border-b-2 border-iii-accent/50" />
            </div>

            {/* Base platform layers */}
            <div className="mt-1 mx-2 h-2 md:h-3 bg-iii-dark/80 border border-iii-medium/20 rounded-b-sm" />
            <div className="mt-0.5 mx-4 h-1.5 md:h-2 bg-iii-dark/60 border border-iii-medium/10 rounded-b-sm" />
            <div className="mt-0.5 mx-6 h-1 md:h-1.5 bg-iii-dark/40 rounded-b-sm" />
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-8 text-center">
          <p className="text-[10px] md:text-xs text-iii-medium/70 tracking-wider">
            APIs • JOBS • QUEUES • STREAMS • WORKFLOWS • AI AGENTS
          </p>
        </div>
      </div>
    </div>
  );
};


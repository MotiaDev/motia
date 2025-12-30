import React, { useState } from 'react';
import { Cpu, Zap, Network, Share2, Workflow, Database, Terminal } from 'lucide-react';

export const FeatureBento: React.FC = () => {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-12 mt-12 md:mt-24 pb-12 md:pb-24">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 auto-rows-[minmax(140px,auto)] md:auto-rows-[minmax(180px,auto)]">
        
        <div 
          className="col-span-1 md:col-span-4 lg:col-span-4 row-span-1 md:row-span-2 group relative p-5 md:p-8 rounded-lg md:rounded-xl bg-iii-dark/30 border border-iii-medium/30 hover:border-iii-light/50 transition-all duration-500 overflow-hidden"
          onMouseEnter={() => setActiveCard('engine')}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-iii-dark/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div className="flex justify-between items-start">
              <div className="p-2 md:p-3 bg-iii-black border border-iii-medium/30 rounded-lg">
                <Cpu className="w-5 h-5 md:w-8 md:h-8 text-iii-accent" />
              </div>
              <div className="px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-iii-medium/30 bg-iii-black/50 text-[8px] md:text-[10px] uppercase tracking-widest text-iii-medium group-hover:text-iii-light transition-colors">
                BSL 1.1 KERNEL
              </div>
            </div>
            <div className="space-y-2 md:space-y-4">
              <h3 className="text-xl md:text-3xl font-semibold text-iii-light tracking-tight">The Universal Runtime</h3>
              <p className="text-xs md:text-base text-iii-medium max-w-lg leading-relaxed group-hover:text-gray-300 transition-colors">
                The binary that manages durability, history, and scheduling. Abstracts databases, queues, and streams uniformly.
              </p>
              <div className="pt-2 md:pt-4 flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-xs font-mono text-iii-medium">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${activeCard === 'engine' ? 'bg-green-500 animate-pulse' : 'bg-iii-medium'}`} />
                  <span>DURABLE</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${activeCard === 'engine' ? 'bg-green-500 animate-pulse delay-75' : 'bg-iii-medium'}`} />
                  <span>POLYGLOT</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:block absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
            <div className="grid grid-cols-8 gap-1 p-4 transform rotate-12 scale-150 origin-bottom-right">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className={`h-8 w-8 rounded-sm bg-iii-light transition-all duration-300 ${activeCard === 'engine' ? 'bg-iii-accent scale-90' : ''}`} style={{ opacity: Math.random() }} />
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 md:row-span-2 group relative p-4 md:p-6 rounded-lg md:rounded-xl bg-iii-dark/20 border border-iii-medium/30 hover:border-iii-accent/30 transition-all duration-300 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-iii-accent/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100" />
          <div className="relative z-10">
            <div className="p-1.5 md:p-2 w-fit bg-iii-black border border-iii-medium/30 rounded-lg mb-3 md:mb-6">
              <Share2 className="w-4 h-4 md:w-6 md:h-6 text-iii-light" />
            </div>
            <h3 className="text-base md:text-xl font-semibold text-iii-light mb-1 md:mb-2">Adapters</h3>
            <p className="text-[10px] md:text-sm text-iii-medium leading-relaxed mb-3 md:mb-6 hidden sm:block">
              Community connectors for databases, LLMs, and APIs.
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-1 gap-1.5 md:gap-2">
            {['Postgres', 'OpenAI', 'Stripe', 'Redis'].map((tech, i) => (
              <div key={tech} className="flex items-center justify-between px-2 py-1.5 md:px-3 md:py-2 bg-iii-black/50 border border-iii-medium/20 rounded hover:border-iii-light/30 transition-colors group/item">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Database className="w-2.5 h-2.5 md:w-3 md:h-3 text-iii-medium group-hover/item:text-iii-accent" />
                  <span className="text-[10px] md:text-xs text-iii-light font-mono">{tech}</span>
                </div>
                <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${i % 2 === 0 ? 'bg-green-500' : 'bg-iii-medium'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 group relative p-4 md:p-6 rounded-lg md:rounded-xl bg-iii-dark/20 border border-iii-medium/30 hover:border-green-500/30 transition-all duration-300">
          <div className="flex justify-between items-start mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-iii-black border border-iii-medium/30 rounded-lg">
              <Terminal className="w-4 h-4 md:w-5 md:h-5 text-iii-light group-hover:text-green-400 transition-colors" />
            </div>
            <div className="text-[8px] md:text-[10px] text-green-400 font-mono uppercase tracking-wider border border-green-500/30 px-1.5 py-0.5 md:px-2 rounded bg-green-500/10">
              Apache 2.0
            </div>
          </div>
          <h3 className="text-sm md:text-lg font-semibold text-iii-light mb-1">SDKs & Frameworks</h3>
          <p className="text-[10px] md:text-xs text-iii-medium hidden sm:block">
            Apache 2.0 libraries for protocol message generation.
          </p>
          <div className="mt-2 md:mt-4 flex flex-wrap gap-1.5 md:gap-2">
            {['@iii/client', 'iii-py', 'iii-go'].map(pkg => (
              <code key={pkg} className="px-1.5 py-0.5 md:px-2 md:py-1 bg-iii-black border border-iii-medium/30 rounded text-[9px] md:text-[10px] text-iii-light font-mono hover:border-iii-light/50 cursor-pointer">
                {pkg}
              </code>
            ))}
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 group relative p-4 md:p-6 rounded-lg md:rounded-xl bg-iii-dark/20 border border-iii-medium/30 hover:border-iii-light/50 transition-all duration-300">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div className="p-1.5 md:p-2 bg-iii-black border border-iii-medium/30 rounded-lg">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-iii-light group-hover:text-iii-accent transition-colors" />
            </div>
            <h3 className="text-sm md:text-lg font-semibold text-iii-light">Implementation</h3>
          </div>
          <p className="text-[10px] md:text-xs text-iii-medium mb-2 md:mb-3">
            Register functions that execute anywhere.
          </p>
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-iii-medium/10">
            <div className="text-[9px] md:text-[10px] text-iii-medium uppercase tracking-wider">Remote Functions</div>
            <Workflow className="w-3 h-3 md:w-4 md:h-4 text-iii-medium group-hover:text-iii-light transition-colors" />
          </div>
        </div>

        <div className="col-span-1 md:col-span-4 lg:col-span-6 row-span-1 group relative p-4 md:p-6 rounded-lg md:rounded-xl bg-iii-dark/20 border border-iii-medium/30 hover:border-iii-light/50 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6">
          <div className="flex flex-col gap-1.5 md:gap-2 max-w-xl">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-iii-black border border-iii-medium/30 rounded-lg">
                <Network className="w-4 h-4 md:w-5 md:h-5 text-iii-light" />
              </div>
              <h3 className="text-sm md:text-lg font-semibold text-iii-light">Invocation Layer</h3>
            </div>
            <p className="text-[10px] md:text-sm text-iii-medium">
              Configure triggers (API, Event, Cron) and link them to functions.
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-70 md:opacity-50 group-hover:opacity-100 transition-opacity text-[9px] md:text-xs overflow-x-auto w-full md:w-auto">
            <div className="px-2 py-1 md:px-3 md:py-1.5 rounded border border-iii-medium/30 bg-iii-black font-mono text-iii-light whitespace-nowrap">Trigger</div>
            <div className="h-px w-4 md:w-8 bg-iii-medium flex-shrink-0"></div>
            <div className="px-2 py-1 md:px-3 md:py-1.5 rounded border border-iii-medium/30 bg-iii-black font-mono text-iii-light whitespace-nowrap">Engine</div>
            <div className="h-px w-4 md:w-8 bg-iii-medium flex-shrink-0"></div>
            <div className="px-2 py-1 md:px-3 md:py-1.5 rounded border border-iii-medium/30 bg-iii-black font-mono text-iii-light whitespace-nowrap">Worker</div>
          </div>
        </div>
      </div>
    </div>
  );
};

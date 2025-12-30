import React from 'react';
import { X, Zap, Layers, Globe, ArrowRight, AlertTriangle } from 'lucide-react';

interface ManifestoModalProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

export const ManifestoModal: React.FC<ManifestoModalProps> = ({ onClose, isDarkMode = true }) => {
  const bgColor = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-iii-medium/20' : 'border-gray-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';
  const accentBg = isDarkMode ? 'bg-iii-accent/5' : 'bg-iii-accent-light/5';
  const accentBorder = isDarkMode ? 'border-iii-accent/20' : 'border-iii-accent-light/20';
  const sectionBorder = isDarkMode ? 'border-gray-800' : 'border-gray-100';

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-2xl ${bgColor} border ${borderColor} shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] rounded-lg`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${accentBg} px-4 sm:px-6 py-3 sm:py-4 border-b ${accentBorder} flex items-center justify-between shrink-0`}>
          <div className={`flex items-center gap-2 sm:gap-3 ${accentColor}`}>
            <span className="text-lg sm:text-xl font-black">iii</span>
            <h2 className="font-mono font-bold tracking-wider text-[10px] sm:text-xs">MANIFESTO</h2>
          </div>
          <button 
            onClick={onClose} 
            className={`${textSecondary} hover:text-white transition-colors p-1`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-5 sm:space-y-6 md:space-y-8">
          
          {/* Title */}
          <div className="text-center space-y-1 sm:space-y-2">
            <p className={`text-[10px] sm:text-xs ${textSecondary} tracking-[0.2em] sm:tracking-[0.3em] uppercase`}>Toward a</p>
            <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${textPrimary}`}>
              Unified Physics of Computation
            </h3>
          </div>

          {/* The Great Fracture */}
          <div className={`space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t ${sectionBorder}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertTriangle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${accentColor} shrink-0`} />
              <h4 className={`text-xs sm:text-sm font-bold tracking-wide ${textPrimary}`}>THE GREAT FRACTURE</h4>
            </div>
            <p className={`text-xs sm:text-sm ${textSecondary} leading-6 sm:leading-7`}>
              Software architecture has broken into shards. Servers for requests. Workers for tasks. Consumers for streams.
            </p>
            <p className={`text-xs sm:text-sm ${textPrimary} leading-6 sm:leading-7 font-medium`}>
              Three distinct architectures for the exact same act: Running Code.
            </p>
            <p className={`text-xs sm:text-sm ${textSecondary} leading-6 sm:leading-7`}>
              We've spent a decade building glue—writing YAML, managing connection pools, constructing fragile bridges between silos.
            </p>
          </div>

          {/* Causality is Universal */}
          <div className={`space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t ${sectionBorder}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${accentColor} shrink-0`} />
              <h4 className={`text-xs sm:text-sm font-bold tracking-wide ${textPrimary}`}>CAUSALITY IS UNIVERSAL</h4>
            </div>
            <p className={`text-xs sm:text-sm ${textSecondary} leading-6 sm:leading-7`}>
              The distinction between an HTTP Request, a Database Mutation, and a System Timer is a lie. 
              Mathematically, they are identical:
            </p>
            <p className={`text-sm sm:text-base ${accentColor} font-semibold`}>
              An Initiation Signal.
            </p>
            <p className={`text-xs sm:text-sm ${textSecondary} leading-6 sm:leading-7`}>
              Code should not care <em className={textPrimary}>why</em> it runs. Not <em className={textPrimary}>where</em> it runs. 
              Only <em className={textPrimary}>what</em> it must do.
            </p>
          </div>

          {/* One Binary */}
          <div className={`space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t ${sectionBorder}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <Layers className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${accentColor} shrink-0`} />
              <h4 className={`text-xs sm:text-sm font-bold tracking-wide ${textPrimary}`}>ONE BINARY. INFINITE SYSTEMS.</h4>
            </div>
            <p className={`text-xs sm:text-sm ${textSecondary} leading-6 sm:leading-7`}>
              iii is not a framework—it is a daemon. A persistent system that runs anywhere: laptop, container, or bare metal.
            </p>
            <div className={`text-xs sm:text-sm space-y-1.5 sm:space-y-2 pl-3 sm:pl-4 border-l-2 ${accentBorder} ${textSecondary}`}>
              <div className="leading-5 sm:leading-6"><span className={textPrimary}>Context</span> — Connections, State, Hardware.</div>
              <div className="leading-5 sm:leading-6"><span className={textPrimary}>Initiation</span> — Triggers, Streams, Events.</div>
              <div className="leading-5 sm:leading-6"><span className={textPrimary}>Implementation</span> — Your Logic.</div>
            </div>
          </div>

          {/* Self-Assembling */}
          <div className={`space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t ${sectionBorder}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <Globe className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${accentColor} shrink-0`} />
              <h4 className={`text-xs sm:text-sm font-bold tracking-wide ${textPrimary}`}>SELF-ASSEMBLING INFRASTRUCTURE</h4>
            </div>
            <p className={`text-xs sm:text-sm ${textSecondary} leading-6 sm:leading-7`}>
              No cold starts. No VPC peering. No black boxes. A mesh where code discovers code, 
              state is injected instantly, and network topology is invisible.
            </p>
          </div>

          {/* Declaration */}
          <div className={`p-3 sm:p-4 md:p-5 border ${accentBorder} ${accentBg} rounded-lg`}>
            <div className="flex items-start gap-3 sm:gap-4">
              <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 ${accentColor} mt-0.5 shrink-0`} />
              <div className="space-y-2 sm:space-y-3">
                <p className={`text-xs sm:text-sm font-bold ${textPrimary}`}>
                  THE DECLARATION
                </p>
                <p className={`text-xs sm:text-sm ${textSecondary} leading-6 sm:leading-7`}>
                  We are building the Operating System for Causality. A single binary with the power of an infinite distributed system.
                </p>
                <p className={`text-sm sm:text-base ${accentColor} font-semibold`}>
                  Stop building glue. Start building logic.
                </p>
              </div>
            </div>
          </div>

          {/* Closing */}
          <p className={`text-center text-[10px] sm:text-xs ${textSecondary} tracking-[0.15em] sm:tracking-[0.2em] uppercase pt-2 sm:pt-4`}>
            iii — Context · Trigger · Logic
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Zap, Layers, Globe, ArrowRight, AlertTriangle } from 'lucide-react';

interface ManifestoModalProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

export const ManifestoModal: React.FC<ManifestoModalProps> = ({ onClose, isDarkMode = true }) => {
  const bgColor = isDarkMode ? 'bg-iii-dark' : 'bg-white';
  const borderColor = isDarkMode ? 'border-iii-medium/30' : 'border-iii-medium/20';
  const textPrimary = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const textSecondary = isDarkMode ? 'text-iii-medium' : 'text-gray-600';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';
  const accentBg = isDarkMode ? 'bg-iii-accent/10' : 'bg-iii-accent-light/10';
  const accentBorder = isDarkMode ? 'border-iii-accent/30' : 'border-iii-accent-light/30';

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-iii-black/90 backdrop-blur-md p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-2xl ${bgColor} border ${borderColor} shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${accentBg} px-6 py-4 border-b ${accentBorder} flex items-center justify-between shrink-0`}>
          <div className={`flex items-center gap-3 ${accentColor}`}>
            <span className="text-xl font-black">iii</span>
            <h2 className="font-mono font-bold tracking-wider text-xs md:text-sm">TOWARD A UNIFIED PHYSICS OF COMPUTATION</h2>
          </div>
          <button 
            onClick={onClose} 
            className={`${textSecondary} hover:${textPrimary} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* The Great Fracture */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${accentColor}`} />
              <h3 className={`text-sm font-bold tracking-wider ${textPrimary}`}>THE GREAT FRACTURE</h3>
            </div>
            <p className={`text-sm ${textSecondary} leading-relaxed`}>
              Software architecture has broken into shards. Servers for requests. Workers for tasks. Consumers for streams. 
              <span className={textPrimary}> Three distinct architectures for the exact same act: Running Code.</span>
            </p>
            <p className={`text-sm ${textSecondary} leading-relaxed`}>
              We've spent a decade building glue—writing YAML, managing connection pools, constructing fragile bridges between silos.
            </p>
          </div>

          {/* The Core Truth */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${accentColor}`} />
              <h3 className={`text-sm font-bold tracking-wider ${textPrimary}`}>CAUSALITY IS UNIVERSAL</h3>
            </div>
            <p className={`text-sm ${textSecondary} leading-relaxed`}>
              The distinction between an HTTP Request, a Database Mutation, and a System Timer is a lie. 
              Mathematically, they are identical: <span className={accentColor}>An Initiation Signal.</span>
            </p>
            <p className={`text-sm ${textSecondary} leading-relaxed`}>
              Code should not care <em>why</em> it is running. It should not care <em>where</em> it is running. 
              It should only care <em>what</em> it must do.
            </p>
          </div>

          {/* One Binary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className={`w-4 h-4 ${accentColor}`} />
              <h3 className={`text-sm font-bold tracking-wider ${textPrimary}`}>ONE BINARY. INFINITE SYSTEMS.</h3>
            </div>
            <p className={`text-sm ${textSecondary} leading-relaxed`}>
              iii is not a framework—it is a daemon. A persistent system that runs anywhere: laptop, container, or bare metal.
            </p>
            <div className={`text-xs ${textSecondary} space-y-1 pt-2 pl-4 border-l-2 ${accentBorder}`}>
              <div>It holds the <span className={textPrimary}>Context</span> — Connections, State, Hardware.</div>
              <div>It manages the <span className={textPrimary}>Initiation</span> — Triggers, Streams, Events.</div>
              <div>It tethers the <span className={textPrimary}>Implementation</span> — Your Logic.</div>
            </div>
          </div>

          {/* Self-Assembling */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className={`w-4 h-4 ${accentColor}`} />
              <h3 className={`text-sm font-bold tracking-wider ${textPrimary}`}>SELF-ASSEMBLING INFRASTRUCTURE</h3>
            </div>
            <p className={`text-sm ${textSecondary} leading-relaxed`}>
              No cold starts. No VPC peering. No black boxes. A mesh where code discovers code, 
              state is injected instantly, and network topology is invisible.
            </p>
          </div>

          {/* Declaration */}
          <div className={`p-4 border-2 ${accentBorder} ${accentBg} rounded-lg`}>
            <div className="flex items-start gap-3">
              <ArrowRight className={`w-5 h-5 ${accentColor} mt-0.5 flex-shrink-0`} />
              <div className="space-y-2">
                <p className={`text-sm font-bold ${textPrimary}`}>
                  THE DECLARATION
                </p>
                <p className={`text-sm ${textSecondary} leading-relaxed`}>
                  We are building the Operating System for Causality. A single binary with the power of an infinite distributed system.
                </p>
                <p className={`text-sm ${accentColor} font-semibold`}>
                  Stop building glue. Start building logic.
                </p>
              </div>
            </div>
          </div>

          {/* Closing */}
          <p className={`text-center text-xs ${textSecondary} tracking-widest uppercase`}>
            iii <span className={accentColor}>—</span> Context <span className={accentColor}>·</span> Trigger <span className={accentColor}>·</span> Logic
          </p>
        </div>
      </div>
    </div>
  );
};

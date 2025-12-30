import React from 'react';
import { X, Zap, Layers, Globe, ArrowRight } from 'lucide-react';

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

  const principles = [
    {
      icon: Zap,
      title: "SELF-REGISTERING WORKERS",
      text: "Workers connect via WebSocket and declare their capabilities. The engine maintains a live registry. Zero configuration required."
    },
    {
      icon: Layers,
      title: "PERSISTENT CONTEXT",
      text: "The daemon maintains state, connection pools, and execution history. Functions access shared context without setup."
    },
    {
      icon: Globe,
      title: "UNIFIED EXECUTION",
      text: "APIs, cron, events, and streams—all handled by a single Rust binary. One deployment. One control plane."
    }
  ];

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
            <h2 className="font-mono font-bold tracking-wider">MANIFESTO</h2>
          </div>
          <button 
            onClick={onClose} 
            className={`${textSecondary} hover:${textPrimary} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          {/* Opening Statement */}
          <div className="space-y-4">
            <h3 className={`text-2xl md:text-3xl font-bold tracking-tighter ${textPrimary}`}>
              Intelligent<br />
              <span className={accentColor}>Invocation Interface</span>
            </h3>
            <p className={`text-sm md:text-base ${textSecondary} leading-relaxed`}>
              A single binary that orchestrates distributed systems. 
              Workers self-register. Functions invoke across languages. No config required.
            </p>
            <div className={`text-xs md:text-sm ${textSecondary} space-y-1 pt-2`}>
              <div><span className={accentColor}>I</span>ntelligent → The Daemon. Discovery, routing, context injection.</div>
              <div><span className={accentColor}>I</span>nvocation → The Trigger. Any event causes code to run.</div>
              <div><span className={accentColor}>I</span>nterface → The SDK. The surface your logic plugs into.</div>
            </div>
          </div>

          {/* Core Principles */}
          <div className="space-y-4">
            {principles.map((principle, index) => (
              <div 
                key={index}
                className={`p-4 border ${borderColor} rounded-lg space-y-2 transition-all hover:border-iii-medium/50`}
              >
                <div className="flex items-center gap-2">
                  <principle.icon className={`w-4 h-4 ${accentColor}`} />
                  <span className={`text-xs font-bold tracking-wider ${textPrimary}`}>
                    {principle.title}
                  </span>
                </div>
                <p className={`text-sm ${textSecondary} leading-relaxed`}>
                  {principle.text}
                </p>
              </div>
            ))}
          </div>

          {/* The Promise */}
          <div className={`p-4 border-2 ${accentBorder} ${accentBg} rounded-lg`}>
            <div className="flex items-start gap-3">
              <ArrowRight className={`w-5 h-5 ${accentColor} mt-0.5 flex-shrink-0`} />
              <div className="space-y-2">
                <p className={`text-sm font-bold ${textPrimary}`}>
                  WHAT YOU GET
                </p>
                <p className={`text-sm ${textSecondary} leading-relaxed`}>
                  A Rust daemon that runs anywhere. Workers in any language. 
                  Polyglot function invocation over WebSocket. 
                  <span className={`${accentColor} font-semibold`}> One binary. Zero config.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Closing */}
          <p className={`text-center text-xs ${textSecondary} tracking-widest uppercase`}>
            Deploy daemon <span className={accentColor}>→</span> Spawn workers <span className={accentColor}>→</span> Build anything
          </p>
        </div>
      </div>
    </div>
  );
};


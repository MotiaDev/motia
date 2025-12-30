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
      title: "SPLIT THE STACK",
      text: "Logic is ephemeral. Compute is eternal. Pay for thinking by the millisecond, pay for muscle by the hour."
    },
    {
      icon: Layers,
      title: "VIRTUAL LOCALITY",
      text: "Write await ctx.gpu.resize(image). The GPU is 3,000 miles away. Your code doesn't know. It doesn't care."
    },
    {
      icon: Globe,
      title: "ZERO CONFIG",
      text: "No service registries. No load balancers. No VPNs. Deploy code. It finds itself."
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
              The Universal<br />
              <span className={accentColor}>Orchestration Fabric</span>
            </h3>
            <p className={`text-sm md:text-base ${textSecondary} leading-relaxed`}>
              We built iii because distributed systems are broken. Not technically—architecturally. 
              Teams over-provision GPUs for lightweight API calls. They expose databases to the internet 
              just to reach them from serverless. They write glue code between services that should just work.
            </p>
            <p className={`text-sm md:text-base ${accentColor} font-semibold`}>
              iii is the missing layer.
            </p>
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
                  THE PROMISE
                </p>
                <p className={`text-sm ${textSecondary} leading-relaxed`}>
                  Your infrastructure becomes portable. Your code becomes simple. 
                  Your cloud bill becomes sane. This is not another framework. 
                  This is the runtime beneath all frameworks.
                </p>
              </div>
            </div>
          </div>

          {/* Closing */}
          <p className={`text-center text-xs ${textSecondary} tracking-widest uppercase`}>
            Innovate <span className={accentColor}>→</span> Implement <span className={accentColor}>→</span> Iterate
          </p>
        </div>
      </div>
    </div>
  );
};


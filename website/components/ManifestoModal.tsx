import React from 'react';
import { X, Cpu, Zap, Brain, Cloud } from 'lucide-react';

interface ManifestoModalProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

const shifts = [
  {
    icon: Cpu,
    title: "INFRASTRUCTURE MUST BE SOFTWARE, NOT CONFIGURATION",
    problem: "Static configuration (YAML, Terraform) is a map of a territory that is constantly changing. It is brittle and inherently outdated.",
    future: "Infrastructure must be active. A binary that self-assembles, discovers peers, and routes traffic dynamically. You should not \"architect\" a network; you should spin up nodes and let the network grow."
  },
  {
    icon: Zap,
    title: "THE END OF INTEGRATION LOGIC",
    problem: "Developers waste billions of hours writing adapters to normalize data between services.",
    future: "Universal Causality. A database mutation, an HTTP request, a Cron schedule, and an AI intent are all just \"Triggers.\" The runtime handles the integration; you handle the logic."
  },
  {
    icon: Brain,
    title: "INTELLIGENCE IS JUST ANOTHER WORKER",
    problem: "We treat AI Agents and Standard Code as separate magisteria, running on different stacks with different rules.",
    future: "The Unified Cognitive Substrate. Deterministic code and Probabilistic Agents run on the same control plane, sharing state, logging, and security context."
  },
  {
    icon: Cloud,
    title: "THE CLOUD IS A UTILITY, NOT AN ECOSYSTEM",
    problem: "Cloud providers lock us into proprietary APIs to rent our own data back to us.",
    future: "Sovereign Execution. The logic lives inside your binary, not their dashboard. AWS and Azure are demoted to what they truly are: interchangeable providers of electricity and raw compute."
  }
];

export const ManifestoModal: React.FC<ManifestoModalProps> = ({ onClose, isDarkMode = true }) => {
  const bgColor = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-iii-medium/20' : 'border-gray-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';
  const accentBg = isDarkMode ? 'bg-iii-accent/5' : 'bg-iii-accent-light/5';
  const accentBorder = isDarkMode ? 'border-iii-accent/20' : 'border-iii-accent-light/20';
  const sectionBorder = isDarkMode ? 'border-gray-800' : 'border-gray-100';
  const dimText = isDarkMode ? 'text-gray-500' : 'text-gray-400';

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
            <h2 className="font-mono font-bold tracking-wider text-[10px] sm:text-xs">MANIFESTO FOR UNIVERSAL EXECUTION</h2>
          </div>
          <button 
            onClick={onClose} 
            className={`${textSecondary} hover:text-white transition-colors p-1`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 sm:space-y-8">
          
          {/* Opening */}
          <div className="space-y-3 sm:space-y-4">
            <p className={`text-xs sm:text-sm ${textSecondary} leading-6 sm:leading-7`}>
              The modern stack has become <span className={textPrimary}>10% application logic</span> and <span className={textPrimary}>90% logistics</span>. 
              We spend our days wrestling with IAM roles, configuring VPC peering, and writing glue code.
            </p>
            <p className={`text-xs sm:text-sm ${dimText} leading-6 sm:leading-7 italic`}>
              We are acting as digital plumbers when we should be architects.
            </p>
            <p className={`text-xs sm:text-sm ${textSecondary} leading-6 sm:leading-7`}>
              <span className={accentColor}>iii</span> represents a fundamental rejection of this complexity. 
              The network, the infrastructure, and the capability layer: abstracted by a single, universal kernel.
            </p>
          </div>

          {/* Four Shifts */}
          <div className={`pt-4 sm:pt-6 border-t ${sectionBorder}`}>
            <p className={`text-[10px] sm:text-xs ${textSecondary} tracking-[0.2em] uppercase mb-4 sm:mb-6`}>
              We hold these four shifts to be self-evident
            </p>
            
            <div className="space-y-4 sm:space-y-5">
              {shifts.map((shift, index) => (
                <div 
                  key={index}
                  className={`p-3 sm:p-4 border ${sectionBorder} rounded-lg space-y-2 sm:space-y-3`}
                >
                  <div className="flex items-center gap-2">
                    <shift.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${accentColor} shrink-0`} />
                    <span className={`text-[10px] sm:text-xs font-bold tracking-wide ${textPrimary}`}>
                      {index + 1}. {shift.title}
                    </span>
                  </div>
                  <p className={`text-[10px] sm:text-xs ${dimText} leading-5 sm:leading-6 line-through decoration-1`}>
                    {shift.problem}
                  </p>
                  <p className={`text-[10px] sm:text-xs ${textSecondary} leading-5 sm:leading-6`}>
                    <span className={accentColor}>→</span> {shift.future}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Commitment */}
          <div className={`p-4 sm:p-5 border-2 ${accentBorder} ${accentBg} rounded-lg`}>
            <p className={`text-xs sm:text-sm font-bold ${textPrimary} mb-2 sm:mb-3`}>
              THE COMMITMENT
            </p>
            <p className={`text-xs sm:text-sm ${textSecondary} leading-6 sm:leading-7 mb-3 sm:mb-4`}>
              iii is not a platform; it is a protocol. A promise that if you define your logic within this kernel, 
              it will run anywhere, from a Raspberry Pi to an H100 cluster, without a single line of code change.
            </p>
            <p className={`text-sm sm:text-base ${accentColor} font-bold`}>
              Stop building the pipe. Just flow the water.
            </p>
          </div>

          {/* Closing */}
          <p className={`text-center text-[10px] sm:text-xs ${textSecondary} tracking-[0.15em] sm:tracking-[0.2em] uppercase pt-2`}>
            iii / The Universal Kernel
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Network, X, Box, Layers, Cpu } from 'lucide-react';

interface ProtocolModalProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

export const ProtocolModal: React.FC<ProtocolModalProps> = ({ onClose, isDarkMode = true }) => {
  const bgOverlay = isDarkMode ? 'bg-iii-black/90' : 'bg-white/90';
  const bgCard = isDarkMode ? 'bg-iii-dark' : 'bg-white';
  const borderColor = isDarkMode ? 'border-iii-accent/30' : 'border-iii-black/20';
  const headerBg = isDarkMode ? 'bg-iii-accent/10' : 'bg-iii-light';
  const headerBorder = isDarkMode ? 'border-iii-accent/20' : 'border-iii-black/10';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';
  const textPrimary = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const codeBg = isDarkMode ? 'bg-black/30' : 'bg-iii-light';
  const footerBg = isDarkMode ? 'bg-iii-black/50' : 'bg-iii-light/50';
  const accentBorder = isDarkMode ? 'border-iii-accent/50' : 'border-iii-accent-light/30';

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-md p-4 animate-fade-in ${bgOverlay}`} onClick={onClose}>
      <div className={`w-full max-w-2xl border shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] ${bgCard} ${borderColor}`} onClick={e => e.stopPropagation()}>
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${headerBg} ${headerBorder}`}>
          <div className={`flex items-center gap-3 ${accentColor}`}>
            <Network className="w-5 h-5" />
            <h2 className="font-mono font-bold tracking-wider">SYSTEM ARCHITECTURE</h2>
          </div>
          <button onClick={onClose} className={`text-iii-medium transition-colors ${isDarkMode ? 'hover:text-iii-light' : 'hover:text-iii-black'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${textPrimary}`}>
              <Cpu className={`w-5 h-5 ${accentColor}`} />
              <h3 className="font-bold text-lg">THE ENGINE (BSL 1.1)</h3>
            </div>
            <div className="pl-7 space-y-2">
              <p className="text-sm text-iii-medium leading-relaxed">
                The binary executable that manages durability, history, and scheduling. This is the "Core" that guarantees execution correctness.
              </p>
              <div className={`text-xs font-mono text-iii-medium p-2 border-l-2 ${codeBg} ${accentBorder}`}>
                STATUS: PROPRIETARY<br/>
                ROLE: DURABILITY & SCHEDULING
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${textPrimary}`}>
              <Box className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-lg">SDKs & FRAMEWORKS (Apache 2.0)</h3>
            </div>
            <div className="pl-7 space-y-2">
              <p className="text-sm text-iii-medium leading-relaxed">
                Libraries for Agents and Workflows. Grants rights to generate protocol messages (Intents/Interrupts) but does not execute backend logic.
              </p>
              <div className={`text-xs font-mono text-iii-medium p-2 border-l-2 border-blue-500/50 ${codeBg}`}>
                OPEN ECOSYSTEM<br/>
                Allows the community to adopt syntax freely.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${textPrimary}`}>
              <Layers className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-lg">ADAPTERS (Apache 2.0)</h3>
            </div>
            <div className="pl-7 space-y-2">
              <p className="text-sm text-iii-medium leading-relaxed">
                Community-built connectors (Databases, LLMs, APIs). These components do not touch the Durable Execution Method.
              </p>
              <div className={`text-xs font-mono text-iii-medium p-2 border-l-2 border-green-500/50 ${codeBg}`}>
                ROLE: EXTENSIBILITY LAYER<br/>
                Powers a massive integration ecosystem.
              </div>
            </div>
          </div>
        </div>
        
        <div className={`p-4 border-t border-iii-medium/20 shrink-0 flex justify-between items-center text-xs text-iii-medium font-mono ${footerBg}`}>
          <span>iii-protocol-v1.0.spec</span>
          <span className={`animate-pulse ${accentColor}`}>SYSTEM_LOCKED</span>
        </div>
      </div>
    </div>
  );
};

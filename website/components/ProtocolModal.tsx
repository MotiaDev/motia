import React from 'react';
import { Network, X, Box, Layers, Cpu } from 'lucide-react';

interface ProtocolModalProps {
  onClose: () => void;
}

export const ProtocolModal: React.FC<ProtocolModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-iii-black/90 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-iii-dark border border-iii-accent/30 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="bg-iii-accent/10 px-6 py-4 border-b border-iii-accent/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-iii-accent">
            <Network className="w-5 h-5" />
            <h2 className="font-mono font-bold tracking-wider">SYSTEM ARCHITECTURE</h2>
          </div>
          <button onClick={onClose} className="text-iii-medium hover:text-iii-light transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-iii-light">
              <Cpu className="w-5 h-5 text-iii-accent" />
              <h3 className="font-bold text-lg">THE ENGINE (BSL 1.1)</h3>
            </div>
            <div className="pl-7 space-y-2">
              <p className="text-sm text-iii-medium leading-relaxed">
                The binary executable that manages durability, history, and scheduling. This is the "Core" that guarantees execution correctness.
              </p>
              <div className="text-xs font-mono text-iii-medium bg-black/30 p-2 border-l-2 border-iii-accent/50">
                STATUS: PROPRIETARY<br/>
                ROLE: DURABILITY & SCHEDULING
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-iii-light">
              <Box className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-lg">SDKs & FRAMEWORKS (Apache 2.0)</h3>
            </div>
            <div className="pl-7 space-y-2">
              <p className="text-sm text-iii-medium leading-relaxed">
                Libraries for Agents and Workflows. Grants rights to generate protocol messages (Intents/Interrupts) but does not execute backend logic.
              </p>
              <div className="text-xs font-mono text-iii-medium bg-black/30 p-2 border-l-2 border-blue-400/50">
                OPEN ECOSYSTEM<br/>
                Allows the community to adopt syntax freely.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-iii-light">
              <Layers className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-lg">ADAPTERS (Apache 2.0)</h3>
            </div>
            <div className="pl-7 space-y-2">
              <p className="text-sm text-iii-medium leading-relaxed">
                Community-built connectors (Databases, LLMs, APIs). These components do not touch the Durable Execution Method.
              </p>
              <div className="text-xs font-mono text-iii-medium bg-black/30 p-2 border-l-2 border-green-400/50">
                ROLE: EXTENSIBILITY LAYER<br/>
                Powers a massive integration ecosystem.
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-iii-medium/20 bg-iii-black/50 shrink-0 flex justify-between items-center text-xs text-iii-medium font-mono">
          <span>iii-protocol-v1.0.spec</span>
          <span className="text-iii-accent animate-pulse">SYSTEM_LOCKED</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Logo } from './components/Logo';
import { Terminal } from './components/Terminal';
import { GridBackground } from './components/GridBackground';
import { VisualArrow } from './components/VisualArrow';
import { ProtocolModal } from './components/ProtocolModal';
import { FeatureBento } from './components/FeatureBento';
import { KeySequence } from './types';
import { ArrowRight, Copy, Check, Terminal as TerminalIcon, Shield } from 'lucide-react';

const App: React.FC = () => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);
  const [isGodMode, setIsGodMode] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [installCmd] = useState("npm install @iii/client");
  const [bslBlink, setBslBlink] = useState(false);

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    if (e.detail === 3) setShowTerminal(true);
  }, []);

  const handleBslClick = () => {
    setBslBlink(true);
    setTimeout(() => setBslBlink(false), 1000);
    if (Math.random() > 0.9) setShowTerminal(true);
  };

  useEffect(() => {
    let keyBuffer: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      keyBuffer.push(e.key);
      if (keyBuffer.length > 20) keyBuffer = keyBuffer.slice(-20);

      const recentKeys = keyBuffer.slice(-3).join('');
      if (recentKeys === KeySequence.III) setShowTerminal(true);

      const fullHistory = keyBuffer.join('');
      if (fullHistory.includes(KeySequence.KONAMI)) {
        setIsGodMode(true);
        setShowTerminal(true);
        keyBuffer = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail('');
    }, 1200);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCmd);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleManifestoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.classList.add('animate-glitch');
    setTimeout(() => el.classList.remove('animate-glitch'), 500);
  };

  return (
    <div className={`min-h-screen bg-iii-black text-iii-light font-mono selection:bg-iii-accent selection:text-iii-black relative flex flex-col ${isGodMode ? 'selection:bg-red-500' : ''}`}>
      <GridBackground />

      <nav className="relative z-10 w-full px-4 py-4 md:px-12 md:py-6 flex justify-between items-center border-b border-iii-dark/50 bg-iii-black/80 backdrop-blur-sm">
        <div className="cursor-pointer" onClick={handleLogoClick}>
          <Logo className={`h-6 md:h-10 ${isGodMode ? 'text-red-500' : 'text-iii-light'}`} animate={true} />
        </div>
        <div className="flex gap-3 md:gap-6 text-[10px] md:text-sm text-iii-medium font-semibold tracking-tight">
          <a href="#" onClick={handleManifestoClick} className="hover:text-iii-light transition-colors hidden md:block">MANIFESTO</a>
          <button onClick={() => setShowProtocol(true)} className="hover:text-iii-accent transition-colors uppercase">PROTOCOL</button>
          <div className="relative group cursor-not-allowed hidden sm:block">
            <span className="text-iii-dark group-hover:text-iii-medium transition-colors">DOCS</span>
            <div className="absolute top-full right-0 mt-2 w-max px-2 py-1 bg-iii-dark border border-iii-medium text-iii-light text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              EARLY ACCESS ONLY
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative z-10 flex flex-col items-center pt-12 md:pt-24 pb-8 md:pb-12 w-full">
        <div className="px-4 md:px-12 max-w-7xl mx-auto w-full flex flex-col gap-4 md:gap-8">
          <div className="flex flex-col items-start gap-4 md:gap-6 max-w-5xl">
            <button 
              onClick={handleBslClick}
              className={`inline-flex items-center gap-2 px-2.5 py-1 border rounded-full backdrop-blur text-[10px] md:text-xs transition-all duration-300 group ${
                bslBlink 
                  ? 'bg-red-500/20 border-red-500 text-red-500 scale-105' 
                  : 'border-iii-medium/30 bg-iii-dark/30 text-iii-accent hover:border-iii-accent/50'
              } animate-fade-in-up`}
            >
              <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bslBlink ? 'bg-red-500' : 'bg-iii-accent'}`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 ${bslBlink ? 'bg-red-500' : 'bg-iii-accent'}`}></span>
              </span>
              <span className="font-mono tracking-wider">{isGodMode ? 'BSL ACTIVE' : 'KERNEL ONLINE'}</span>
            </button>

            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95]">
              THE RUNTIME BENEATH<br />
              <span className="text-iii-medium">MODERN BACKENDS</span>
            </h1>

            <p className="text-xs md:text-base text-iii-medium max-w-xl leading-relaxed">
              One engine. One primitive. iii unifies APIs, jobs, queues, streams, 
              workflows, and AI agents into a single durable execution model.
            </p>

            <div className="hidden sm:flex items-center gap-3 py-2">
              <VisualArrow />
              <span className="text-[10px] md:text-xs text-iii-medium tracking-widest uppercase">Innovate &gt; Implement &gt; Iterate</span>
            </div>

            <div className="flex flex-col gap-4 md:gap-6 md:flex-row items-stretch md:items-center pt-2 md:pt-4 w-full">
              <div 
                className="group relative flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 bg-iii-dark/50 border border-iii-dark rounded hover:border-iii-medium transition-colors cursor-pointer w-full md:w-auto md:min-w-[280px]"
                onClick={copyToClipboard}
              >
                <TerminalIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-iii-medium group-hover:text-iii-accent transition-colors flex-shrink-0" />
                <code className="text-xs md:text-sm text-iii-light flex-1 truncate">{installCmd}</code>
                {copySuccess ? (
                  <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-iii-accent flex-shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 text-iii-medium group-hover:text-white transition-colors flex-shrink-0" />
                )}
              </div>

              <form onSubmit={handleEmailSubmit} className="flex items-center w-full md:w-auto">
                {isSubmitted ? (
                  <div className="flex items-center gap-2 text-iii-accent text-xs md:text-sm px-3 py-2.5 md:px-4 md:py-3 bg-iii-accent/10 border border-iii-accent/20 rounded w-full justify-center">
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="font-mono tracking-tight">ACCESS REQUESTED</span>
                  </div>
                ) : (
                  <div className="flex w-full border-b border-iii-medium focus-within:border-iii-accent transition-colors relative">
                    <input 
                      type="email" 
                      placeholder="EMAIL_FOR_ACCESS" 
                      className="bg-transparent outline-none text-xs md:text-sm py-2.5 md:py-3 px-1 w-full md:w-64 placeholder-iii-medium/50 font-mono"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-iii-light hover:text-iii-accent disabled:opacity-50 transition-colors p-1.5 md:p-2"
                    >
                      {isSubmitting ? '...' : <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        <FeatureBento />
      </main>

      <footer className="relative z-10 w-full px-4 py-6 md:px-12 md:py-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-t border-iii-dark/30 bg-iii-black text-[9px] md:text-[10px] text-iii-medium font-mono">
        <div className="max-w-sm md:max-w-md space-y-1.5 md:space-y-2">
          <div className="flex items-center gap-1.5 md:gap-2 text-iii-light/50">
            <Shield className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <p className="tracking-wider">III PROTOCOL CC-BY-ND 4.0</p>
          </div>
          <p className="leading-relaxed hidden md:block">
            Defining the universal runtime for distributed execution. 
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-0.5 md:gap-1">
          <span className="uppercase tracking-widest text-iii-light">© 2025 III, INC.</span>
          <span className="opacity-50">v0.1.0-alpha</span>
        </div>
      </footer>

      {showTerminal && <Terminal onClose={() => setShowTerminal(false)} isGodMode={isGodMode} />}
      {showProtocol && <ProtocolModal onClose={() => setShowProtocol(false)} />}
    </div>
  );
};

export default App;

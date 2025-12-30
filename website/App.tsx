import React, { useState, useEffect, useCallback } from 'react';
import { Logo } from './components/Logo';
import { Terminal } from './components/Terminal';
import { GridBackground } from './components/GridBackground';
import { VisualArrow } from './components/VisualArrow';
import { ProtocolModal } from './components/ProtocolModal';
import { FeatureBento } from './components/FeatureBento';
import { StackVisual } from './components/StackVisual';
import { KeySequence } from './types';
import { ArrowRight, Copy, Check, Terminal as TerminalIcon, Sun, Moon } from 'lucide-react';

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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [hoverAnimIndex, setHoverAnimIndex] = useState(-1);
  const [showGodModeUnlock, setShowGodModeUnlock] = useState(false);
  const clickResetTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Hover animation - sequential highlight
  useEffect(() => {
    if (!isLogoHovered || logoClickCount > 0) {
      setHoverAnimIndex(-1);
      return;
    }
    
    let index = 0;
    const interval = setInterval(() => {
      setHoverAnimIndex(index % 3);
      index++;
    }, 200);
    
    return () => clearInterval(interval);
  }, [isLogoHovered, logoClickCount]);

  // Click handler - each click locks another "i"
  const handleLogoClick = useCallback(() => {
    // Clear any existing reset timer
    if (clickResetTimerRef.current) {
      clearTimeout(clickResetTimerRef.current);
    }
    
    const newCount = logoClickCount + 1;
    
    if (newCount >= 3) {
      // Three clicks - all lit, open terminal
      setLogoClickCount(3);
      setTimeout(() => {
        setShowTerminal(true);
        setLogoClickCount(0); // Reset after opening
      }, 300);
    } else {
      setLogoClickCount(newCount);
      // Reset after 2 seconds of inactivity
      clickResetTimerRef.current = setTimeout(() => {
        setLogoClickCount(0);
      }, 2000);
    }
  }, [logoClickCount]);

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
        setShowGodModeUnlock(true);
        // Show unlock animation then open terminal
        setTimeout(() => {
          setShowGodModeUnlock(false);
          setShowTerminal(true);
        }, 2000);
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
    <div className={`min-h-screen font-mono selection:bg-iii-accent selection:text-iii-black relative flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-iii-black text-iii-light' 
        : 'bg-iii-light text-iii-black'
    } ${isGodMode ? 'selection:bg-red-500' : ''}`}>
      <GridBackground isDarkMode={isDarkMode} />

      <nav className={`relative z-10 w-full px-4 py-4 md:px-12 md:py-6 flex justify-between items-center border-b backdrop-blur-sm transition-colors duration-300 ${
          isDarkMode 
            ? 'border-iii-dark/50 bg-iii-black/80' 
            : 'border-iii-medium/20 bg-iii-light/80'
        }`}>
        <div 
          className="cursor-pointer" 
          onClick={handleLogoClick}
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
        >
          <Logo 
            className={`h-6 md:h-10 ${isGodMode ? 'text-red-500' : isDarkMode ? 'text-iii-light' : 'text-iii-black'}`} 
            highlightCount={logoClickCount > 0 ? logoClickCount : undefined}
            highlightIndex={logoClickCount === 0 ? hoverAnimIndex : undefined}
            accentColor={isGodMode ? 'fill-red-500' : isDarkMode ? 'fill-iii-accent' : 'fill-iii-accent-light'}
          />
        </div>
        <div className="flex gap-3 md:gap-6 text-[10px] md:text-sm text-iii-medium font-semibold tracking-tight items-center">
          <a href="#" onClick={handleManifestoClick} className={`transition-colors hidden md:block ${isDarkMode ? 'hover:text-iii-light' : 'hover:text-iii-black'}`}>MANIFESTO</a>
          <button onClick={() => setShowProtocol(true)} className={`transition-colors uppercase ${isDarkMode ? 'hover:text-iii-accent' : 'hover:text-iii-accent-light'}`}>PROTOCOL</button>
          <div className="relative group cursor-not-allowed hidden sm:block">
            <span className={`transition-colors ${isDarkMode ? 'text-iii-dark group-hover:text-iii-medium' : 'text-iii-medium/50 group-hover:text-iii-medium'}`}>DOCS</span>
            <div className={`absolute top-full right-0 mt-2 w-max px-2 py-1 border text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
              isDarkMode ? 'bg-iii-dark border-iii-medium text-iii-light' : 'bg-white border-iii-medium/30 text-iii-black'
            }`}>
              EARLY ACCESS ONLY
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode 
                ? 'hover:bg-iii-dark text-iii-medium hover:text-iii-light' 
                : 'hover:bg-iii-medium/10 text-iii-medium hover:text-iii-black'
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      <main className="flex-1 relative z-10 flex flex-col items-center pt-12 md:pt-24 pb-8 md:pb-12 w-full">
        <div className="px-4 md:px-12 max-w-7xl mx-auto w-full flex flex-col gap-4 md:gap-8">
          <div className="flex flex-col items-start gap-4 md:gap-6 max-w-5xl">
            <button 
              onClick={handleBslClick}
              className={`inline-flex items-center gap-2 px-2.5 py-1 border rounded-full backdrop-blur text-[10px] md:text-xs transition-all duration-300 group animate-fade-in-up ${
                bslBlink 
                  ? 'bg-red-500/20 border-red-500 text-red-500 scale-105' 
                  : isDarkMode
                    ? 'border-iii-medium/30 bg-iii-dark/30 text-iii-accent hover:border-iii-accent/50'
                    : 'border-iii-accent-light/30 bg-white/50 text-iii-accent-light hover:border-iii-accent-light/50'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bslBlink ? 'bg-red-500' : isDarkMode ? 'bg-iii-accent' : 'bg-iii-accent-light'}`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 ${bslBlink ? 'bg-red-500' : isDarkMode ? 'bg-iii-accent' : 'bg-iii-accent-light'}`}></span>
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
              <VisualArrow isDarkMode={isDarkMode} />
              <span className="text-[10px] md:text-xs text-iii-medium tracking-widest uppercase">Innovate &gt; Implement &gt; Iterate</span>
            </div>

            <div className="flex flex-col gap-4 md:gap-6 md:flex-row items-stretch md:items-center pt-2 md:pt-4 w-full">
              <div 
                className={`group relative flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 border rounded hover:border-iii-medium transition-colors cursor-pointer w-full md:w-auto md:min-w-[280px] ${
                  isDarkMode 
                    ? 'bg-iii-dark/50 border-iii-dark' 
                    : 'bg-white/50 border-iii-medium/30'
                }`}
                onClick={copyToClipboard}
              >
                <TerminalIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 text-iii-medium transition-colors flex-shrink-0 ${isDarkMode ? 'group-hover:text-iii-accent' : 'group-hover:text-iii-accent-light'}`} />
                <code className={`text-xs md:text-sm flex-1 truncate ${isDarkMode ? 'text-iii-light' : 'text-iii-black'}`}>{installCmd}</code>
                {copySuccess ? (
                  <Check className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 ${isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light'}`} />
                ) : (
                  <Copy className={`w-3.5 h-3.5 md:w-4 md:h-4 text-iii-medium transition-colors flex-shrink-0 ${isDarkMode ? 'group-hover:text-white' : 'group-hover:text-iii-black'}`} />
                )}
              </div>

              <form onSubmit={handleEmailSubmit} className="flex items-center w-full md:w-auto">
                {isSubmitted ? (
                  <div className={`flex items-center gap-2 text-xs md:text-sm px-3 py-2.5 md:px-4 md:py-3 border rounded w-full justify-center ${
                    isDarkMode 
                      ? 'text-iii-accent bg-iii-accent/10 border-iii-accent/20' 
                      : 'text-iii-accent-light bg-iii-accent-light/10 border-iii-accent-light/20'
                  }`}>
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="font-mono tracking-tight">ACCESS REQUESTED</span>
                  </div>
                ) : (
                  <div className={`flex w-full border-b border-iii-medium transition-colors relative ${isDarkMode ? 'focus-within:border-iii-accent' : 'focus-within:border-iii-accent-light'}`}>
                    <input 
                      type="email" 
                      placeholder="EMAIL_FOR_ACCESS" 
                      className={`bg-transparent outline-none text-xs md:text-sm py-2.5 md:py-3 px-1 w-full md:w-64 placeholder-iii-medium/50 font-mono ${isDarkMode ? 'text-iii-light' : 'text-iii-black'}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 disabled:opacity-50 transition-colors p-1.5 md:p-2 ${isDarkMode ? 'text-iii-light hover:text-iii-accent' : 'text-iii-black hover:text-iii-accent-light'}`}
                    >
                      {isSubmitting ? '...' : <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        <FeatureBento isDarkMode={isDarkMode} />

        <StackVisual isDarkMode={isDarkMode} />
      </main>

      <footer className={`relative z-10 w-full px-4 py-6 md:px-12 md:py-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-t text-[9px] md:text-[10px] text-iii-medium font-mono transition-colors duration-300 ${
          isDarkMode 
            ? 'border-iii-dark/30 bg-iii-black' 
            : 'border-iii-medium/20 bg-iii-light'
        }`}>
        <div className="max-w-sm md:max-w-md space-y-1.5 md:space-y-2">
          <p className="leading-relaxed hidden md:block">
            Defining the universal runtime for distributed execution.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-0.5 md:gap-1">
          <span className={`uppercase tracking-widest ${isDarkMode ? 'text-iii-light' : 'text-iii-black'}`}>© 2025 III, INC.</span>
          <span className="opacity-50">v0.1.0-alpha</span>
        </div>
      </footer>

      {/* God Mode Unlock Animation */}
      {showGodModeUnlock && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-6xl md:text-8xl font-black text-red-500 mb-4 tracking-tighter animate-bounce">
              GOD MODE
            </div>
            <div className="text-xl md:text-2xl text-red-400 font-mono tracking-widest">
              UNLOCKED
            </div>
            <div className="mt-8 text-sm text-red-500/50 font-mono">
              ↑↑↓↓←→←→BA
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div 
                  key={i} 
                  className="w-3 h-3 bg-red-500 rounded-full animate-ping"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showTerminal && <Terminal onClose={() => setShowTerminal(false)} isGodMode={isGodMode} />}
      {showProtocol && <ProtocolModal onClose={() => setShowProtocol(false)} isDarkMode={isDarkMode} />}
    </div>
  );
};

export default App;

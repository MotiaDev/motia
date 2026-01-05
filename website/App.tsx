import React, { useState, useEffect, useCallback } from 'react';
import { Logo } from './components/Logo';
import { Terminal } from './components/Terminal';
import { GridBackground } from './components/GridBackground';
import { VisualArrow } from './components/VisualArrow';
import { ProtocolModal } from './components/ProtocolModal';
import { ManifestoModal } from './components/ManifestoModal';
import { FeatureBento } from './components/FeatureBento';
import { StackVisual } from './components/StackVisual';
import { FractureAnimation } from './components/FractureAnimation';
import { ModeToggle } from './components/ModeToggle';
import { MachineView } from './components/MachineView';
import { KeySequence } from './types';
import { ArrowRight, Copy, Check, Terminal as TerminalIcon, Sun, Moon } from 'lucide-react';
import { insertAccessRequest, checkAccessRequest } from './lib/supabase';

const App: React.FC = () => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);
  const [isGodMode, setIsGodMode] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(() => {
    // Check localStorage on initial load
    return localStorage.getItem('iii_access_requested') === 'true';
  });

  // Restore access state from localStorage on mount
  useEffect(() => {
    const hasAccess = localStorage.getItem('iii_access_requested') === 'true';
    if (hasAccess) {
      setIsSubmitted(true);
      // Optionally verify with Supabase in background (non-blocking)
      const storedEmail = localStorage.getItem('iii_access_email');
      if (storedEmail) {
        checkAccessRequest(storedEmail).catch(() => {
          // Silently fail - localStorage is source of truth for UX
        });
      }
    }
  }, []);
  const [copySuccess, setCopySuccess] = useState(false);
  const [installCmd] = useState("curl -fsSL https://raw.githubusercontent.com/MotiaDev/iii-engine/main/install.sh | sh");
  const [bslBlink, setBslBlink] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [hoverAnimIndex, setHoverAnimIndex] = useState(-1);
  const [showGodModeUnlock, setShowGodModeUnlock] = useState(false);
  const [showManifesto, setShowManifesto] = useState(false);
  const [isHumanMode, setIsHumanMode] = useState(true);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleMode = () => setIsHumanMode(!isHumanMode);

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
      // Clicks now hold forever until terminal opens
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
      // Normalize key - lowercase for letters, keep arrow keys as-is
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      keyBuffer.push(key);
      if (keyBuffer.length > 30) keyBuffer = keyBuffer.slice(-30);

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await insertAccessRequest(email);
      
      if (result.success) {
        setIsSubmitted(true);
        localStorage.setItem('iii_access_requested', 'true');
        localStorage.setItem('iii_access_email', email);
        setEmail('');
      } else {
        // Handle error silently or show a message
        console.error('Failed to submit email:', result.error);
        setIsSubmitted(true); // Still show success to user
        localStorage.setItem('iii_access_requested', 'true');
        localStorage.setItem('iii_access_email', email);
        setEmail('');
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      setIsSubmitted(true); // Still show success to user
      localStorage.setItem('iii_access_requested', 'true');
      localStorage.setItem('iii_access_email', email);
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCmd);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleManifestoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowManifesto(true);
  };

  // Machine mode - raw markdown/text dump for AI consumption
  // Easter eggs still work: Konami code, terminal access
  if (!isHumanMode) {
    return (
      <>
        <MachineView 
          onToggleMode={toggleMode} 
          onOpenTerminal={() => setShowTerminal(true)}
          isGodMode={isGodMode}
        />
        {showTerminal && <Terminal onClose={() => setShowTerminal(false)} isGodMode={isGodMode} />}
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
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`min-h-screen font-mono selection:bg-iii-accent selection:text-iii-black relative flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-iii-black text-iii-light' 
        : 'bg-iii-light text-iii-black'
    } ${isGodMode ? 'selection:bg-red-500' : ''}`}>
        {/* <GridBackground isDarkMode={isDarkMode} /> */}

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
        <div className="flex gap-2 md:gap-4 text-[10px] md:text-sm text-iii-medium font-semibold tracking-tight items-center">
          <ModeToggle isHumanMode={isHumanMode} onToggle={toggleMode} isDarkMode={isDarkMode} />
          <div className="hidden md:block w-px h-4 bg-iii-medium/30" />
          <a href="#" onClick={handleManifestoClick} className={`transition-colors hidden md:block ${isDarkMode ? 'hover:text-iii-light' : 'hover:text-iii-black'}`}>MANIFESTO</a>
          <button onClick={() => setShowProtocol(true)} className={`transition-colors uppercase ${isDarkMode ? 'hover:text-iii-accent' : 'hover:text-iii-accent-light'}`}>PROTOCOL</button>
          {isSubmitted ? (
            <a 
              href={import.meta.env.VITE_DOCS_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`transition-colors uppercase hidden sm:block ${isDarkMode ? 'text-iii-accent hover:text-iii-light' : 'text-iii-accent-light hover:text-iii-black'}`}
            >
              DOCS
            </a>
          ) : (
            <div className="relative group cursor-not-allowed hidden sm:block">
              <span className={`transition-colors ${isDarkMode ? 'text-iii-dark group-hover:text-iii-medium' : 'text-iii-medium/50 group-hover:text-iii-medium'}`}>DOCS</span>
              <div className={`absolute top-full right-0 mt-2 w-max px-2 py-1 border text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                isDarkMode ? 'bg-iii-dark border-iii-medium text-iii-light' : 'bg-white border-iii-medium/30 text-iii-black'
              }`}>
                EARLY ACCESS ONLY
              </div>
            </div>
          )}
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
              onClick={handleLogoClick}
              className={`inline-flex items-center gap-2 px-2.5 py-1 border rounded-full backdrop-blur text-[10px] md:text-xs transition-all duration-300 group animate-fade-in-up cursor-pointer ${
                bslBlink 
                  ? 'bg-red-500/20 border-red-500 text-red-500 scale-105' 
                  : isDarkMode
                    ? 'border-iii-medium/30 bg-iii-dark/30 text-iii-accent hover:border-iii-accent/50'
                    : 'border-iii-accent-light/30 bg-white/50 text-iii-accent-light hover:border-iii-accent-light/50'
              }`}
            >
              {/* Three dots that sync with logo highlighting */}
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((i) => {
                  const isLit = logoClickCount > i || (logoClickCount === 0 && hoverAnimIndex >= i);
                  const baseColor = bslBlink ? 'bg-red-500' : isDarkMode ? 'bg-iii-accent' : 'bg-iii-accent-light';
                  const dimColor = isDarkMode ? 'bg-iii-medium/40' : 'bg-iii-medium/30';
                  
                  return (
                    <span key={i} className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                      {isLit && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${baseColor}`} 
                          style={{ animationDelay: `${i * 100}ms` }}
                        />
                      )}
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 transition-colors duration-200 ${isLit ? baseColor : dimColor}`} />
                    </span>
                  );
                })}
              </span>
              <span className="font-mono tracking-wider">{isGodMode ? 'GOD MODE' : 'KERNEL ONLINE'}</span>
            </button>

            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95]">
              ONE BINARY.<br />
              <span className="text-iii-medium">INFINITE SYSTEMS.</span>
            </h1>

            <p className="text-xs md:text-base text-iii-medium max-w-xl leading-relaxed">
              No service mesh. No config files. No load balancers. 
              <span className={isDarkMode ? 'text-iii-light' : 'text-iii-black'}> Workers self-assemble. Functions call remote GPUs like local imports.</span> The entire control plane in a single daemon.
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

        {/* Side by side on large screens */}
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8 xl:gap-12">
            <div className="w-full lg:w-1/2">
              <FractureAnimation isDarkMode={isDarkMode} />
            </div>
            <div className="w-full lg:w-1/2">
              <StackVisual isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>
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
      {showManifesto && <ManifestoModal onClose={() => setShowManifesto(false)} isDarkMode={isDarkMode} />}
    </div>
  );
};

export default App;

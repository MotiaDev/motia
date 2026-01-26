import React, { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { ModeToggle } from "./ModeToggle";
import { Check, Terminal as TerminalIcon, Sun, Moon } from "lucide-react";

interface NavbarProps {
  isDarkMode: boolean;
  isGodMode?: boolean;
  isHumanMode: boolean;
  isSubmitted: boolean;
  onToggleTheme: () => void;
  onToggleMode: () => void;
  onLogoClick?: () => void;
  onManifestoClick?: (e: React.MouseEvent) => void;
  onProtocolClick?: () => void;
  logoClickCount?: number;
  isLogoHovered?: boolean;
  hoverAnimIndex?: number;
  onLogoMouseEnter?: () => void;
  onLogoMouseLeave?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDarkMode,
  isGodMode = false,
  isHumanMode,
  isSubmitted,
  onToggleTheme,
  onToggleMode,
  onLogoClick,
  onManifestoClick,
  onProtocolClick,
  logoClickCount = 0,
  isLogoHovered = false,
  hoverAnimIndex = -1,
  onLogoMouseEnter,
  onLogoMouseLeave,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [installCopied, setInstallCopied] = useState(false);
  const installCmd = "curl -fsSL iii.sh/install.sh | sh";

  // Track scroll position for navbar shrinking
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleInstallClick = () => {
    navigator.clipboard.writeText(installCmd);
    setInstallCopied(true);
    setTimeout(() => setInstallCopied(false), 3000);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 w-full px-4 md:px-12 flex justify-between items-center border-b backdrop-blur-lg transition-all duration-300 ${
        isScrolled ? "py-2 md:py-2" : "py-4 md:py-6"
      } ${
        isDarkMode
          ? "border-iii-light bg-iii-black/90"
          : "border-iii-dark bg-iii-light/90"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className="cursor-pointer"
          onClick={onLogoClick}
          onMouseEnter={onLogoMouseEnter}
          onMouseLeave={onLogoMouseLeave}
        >
          <Logo
            className={`transition-all duration-300 ${
              isScrolled ? "h-5 md:h-7" : "h-6 md:h-10"
            } ${
              isGodMode
                ? "text-red-500"
                : isDarkMode
                ? "text-iii-light"
                : "text-iii-black"
            }`}
            highlightCount={logoClickCount > 0 ? logoClickCount : undefined}
            highlightIndex={logoClickCount === 0 ? hoverAnimIndex : undefined}
            accentColor={
              isGodMode
                ? "fill-red-500"
                : isDarkMode
                ? "fill-iii-accent"
                : "fill-iii-accent-light"
            }
          />
        </div>
        {/* Human/Machine Toggle */}
        <div className="hidden sm:block">
          <ModeToggle
            isHumanMode={isHumanMode}
            onToggle={onToggleMode}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
      <div
        className={`flex gap-2 md:gap-4 text-[10px] md:text-sm ${
          isDarkMode ? "text-iii-light" : "text-iii-black"
        } font-semibold tracking-tight items-center`}
      >
        {/* Install CTA - medium/large screens only */}
        <button
          onClick={handleInstallClick}
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded border transition-all duration-300 font-mono text-xs ${
            installCopied
              ? isDarkMode
                ? "bg-iii-accent/20 border-iii-accent text-iii-accent"
                : "bg-iii-accent-light/20 border-iii-accent-light text-iii-accent-light"
              : isDarkMode
              ? "border-iii-light hover:bg-iii-light hover:text-iii-black"
              : "border-iii-dark hover:bg-iii-dark hover:text-iii-light"
          }`}
        >
          {installCopied ? (
            <>
              <Check className="w-3 h-3" />
              <span className="whitespace-nowrap">{installCmd}</span>
            </>
          ) : (
            <>
              <TerminalIcon className="w-3 h-3" />
              <span>install.sh</span>
            </>
          )}
        </button>
        {onManifestoClick && (
          <a
            href="#"
            onClick={onManifestoClick}
            className={`transition-colors hidden md:block ${
              isDarkMode ? "hover:text-iii-light" : "hover:text-iii-black"
            }`}
          >
            MANIFESTO
          </a>
        )}
        {onProtocolClick && (
          <button
            onClick={onProtocolClick}
            className={`transition-colors uppercase ${
              isDarkMode
                ? "hover:text-iii-accent"
                : "hover:text-iii-accent-light"
            }`}
          >
            PROTOCOL
          </button>
        )}
        {isSubmitted ? (
          <a
            href={import.meta.env.VITE_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors uppercase hidden sm:block ${
              isDarkMode
                ? "text-iii-accent hover:text-iii-light"
                : "text-iii-accent-light hover:text-iii-black"
            }`}
          >
            DOCS
          </a>
        ) : (
          <div className="relative group cursor-not-allowed hidden sm:block">
            <span
              className={`transition-colors ${
                isDarkMode
                  ? "text-iii-dark group-hover:text-iii-medium-dark"
                  : "text-iii-medium-light/50 group-hover:text-iii-medium-light"
              }`}
            >
              DOCS
            </span>
            <div
              className={`absolute top-full right-0 mt-2 w-max px-2 py-1 border text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                isDarkMode
                  ? "bg-iii-dark border-iii-light text-iii-light"
                  : "bg-white border-iii-dark text-iii-black"
              }`}
            >
              EARLY ACCESS ONLY
            </div>
          </div>
        )}
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode
              ? "hover:bg-iii-dark text-iii-medium-dark hover:text-iii-light"
              : "hover:bg-iii-medium-light/10 text-iii-medium-light hover:text-iii-black"
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </nav>
  );
};

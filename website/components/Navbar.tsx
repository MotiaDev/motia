import React, { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { ModeToggle } from "./ModeToggle";
import {
  Check,
  Terminal as TerminalIcon,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";

// Disabled: logo goes to homepage. Re-enable for 3-click terminal + hover animation.
const LOGO_TERMINAL_EASTER_EGG = false;

interface NavbarProps {
  isDarkMode: boolean;
  isGodMode?: boolean;
  isHumanMode: boolean;
  isSubmitted: boolean;
  onToggleTheme: () => void;
  onToggleMode: () => void;
  onLogoClick?: () => void;
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
  logoClickCount = 0,
  isLogoHovered = false,
  hoverAnimIndex = -1,
  onLogoMouseEnter,
  onLogoMouseLeave,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [installCopied, setInstallCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const installCmd = "curl -fsSL install.iii.dev | sh";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleInstallClick = () => {
    navigator.clipboard
      .writeText(installCmd)
      .then(() => {
        setInstallCopied(true);
        setTimeout(() => setInstallCopied(false), 3000);
      })
      .catch(() => {});
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 w-full px-3 sm:px-4 md:px-8 lg:px-12 flex justify-between items-center border-b backdrop-blur-lg transition-all duration-300 ${
          isScrolled ? "py-2" : "py-3 sm:py-4 md:py-6"
        } ${
          isDarkMode
            ? "border-iii-light/20 bg-iii-black/90"
            : "border-iii-dark/20 bg-iii-light/90"
        }`}
      >
        <div className="flex items-center gap-4">
          {(window.location.pathname === "/" ||
            window.location.pathname === "/ai") &&
          LOGO_TERMINAL_EASTER_EGG ? (
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
                highlightIndex={
                  logoClickCount === 0 ? hoverAnimIndex : undefined
                }
                accentColor={
                  isGodMode
                    ? "fill-red-500"
                    : isDarkMode
                      ? "fill-iii-accent"
                      : "fill-iii-accent-light"
                }
              />
            </div>
          ) : (
            <a href="/" className="cursor-pointer">
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
                accentColor={
                  isGodMode
                    ? "fill-red-500"
                    : isDarkMode
                      ? "fill-iii-accent"
                      : "fill-iii-accent-light"
                }
              />
            </a>
          )}
          {/* <div className="hidden sm:block">
            <ModeToggle
              isHumanMode={isHumanMode}
              onToggle={onToggleMode}
              isDarkMode={isDarkMode}
            />
          </div> */}
        </div>

        {/* Desktop Navigation */}
        <div
          className={`hidden md:flex gap-2 md:gap-4 text-[10px] md:text-sm ${
            isDarkMode ? "text-iii-light" : "text-iii-black"
          } font-semibold tracking-tight items-center`}
        >
          <button
            onClick={handleInstallClick}
            className={`hidden flex items-center gap-2 px-3 py-1.5 rounded border transition-all duration-300 font-mono text-xs ${
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
          <a
            href="/manifesto"
            className={`hidden transition-colors ${
              isDarkMode
                ? "hover:text-iii-accent"
                : "hover:text-iii-accent-light"
            }`}
          >
            MANIFESTO
          </a>
          <a
            href="/docs"
            className={`transition-colors uppercase ${
              isDarkMode
                ? "text-iii-accent hover:text-iii-light"
                : "text-iii-accent-light hover:text-iii-black"
            }`}
          >
            DOCS
          </a>
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

        {/* Mobile Navigation Controls */}
        <div className="flex md:hidden items-center gap-2">
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
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-iii-dark text-iii-light"
                : "hover:bg-iii-medium-light/10 text-iii-black"
            }`}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          <div
            className={`absolute top-0 right-0 h-full w-[280px] max-w-[85vw] p-6 border-l transition-transform duration-300 ${
              isDarkMode
                ? "bg-iii-black border-iii-light/20"
                : "bg-iii-light border-iii-dark/20"
            }`}
          >
            <div className="flex justify-between items-center mb-8">
              <span
                className={`text-sm font-bold tracking-wider ${
                  isDarkMode ? "text-iii-light" : "text-iii-black"
                }`}
              >
                MENU
              </span>
              <button
                onClick={closeMobileMenu}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "hover:bg-iii-dark text-iii-light"
                    : "hover:bg-iii-medium-light/10 text-iii-black"
                }`}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-4">
              <a
                href="/manifesto"
                onClick={closeMobileMenu}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                  isDarkMode
                    ? "border-iii-light/10 hover:border-iii-accent hover:text-iii-accent text-iii-light"
                    : "border-iii-dark/10 hover:border-iii-accent-light hover:text-iii-accent-light text-iii-black"
                }`}
              >
                MANIFESTO
              </a>
              <a
                href="/docs"
                onClick={closeMobileMenu}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                  isDarkMode
                    ? "border-iii-accent text-iii-accent hover:bg-iii-accent/10"
                    : "border-iii-accent-light text-iii-accent-light hover:bg-iii-accent-light/10"
                }`}
              >
                DOCS
              </a>

              <div className="my-4 border-t border-iii-medium/20" />

              <button
                onClick={() => {
                  handleInstallClick();
                }}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-mono transition-all ${
                  installCopied
                    ? isDarkMode
                      ? "bg-iii-accent/20 border-iii-accent text-iii-accent"
                      : "bg-iii-accent-light/20 border-iii-accent-light text-iii-accent-light"
                    : isDarkMode
                      ? "border-iii-light text-iii-light hover:bg-iii-light hover:text-iii-black"
                      : "border-iii-dark text-iii-black hover:bg-iii-dark hover:text-iii-light"
                }`}
              >
                {installCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <TerminalIcon className="w-4 h-4" />
                    <span>install.sh</span>
                  </>
                )}
              </button>

              <div className="mt-4">
                <ModeToggle
                  isHumanMode={isHumanMode}
                  onToggle={onToggleMode}
                  isDarkMode={isDarkMode}
                />
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

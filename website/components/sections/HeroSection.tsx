import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Copy,
  Check,
  Terminal as TerminalIcon,
} from "lucide-react";

const rotatingWords = [
  "ship faster",
  "write better",
  "scale easily",
  "debug quickly",
  "observe anything",
  "integrate",
];

const rotatingContexts = [
  "in any language",
  "on any cloud",
  "with any stack",
  "in multiple languages",
  "with any protocol",
  "via carrier pigeon",
];

const features = [
  { text: "A single control plane for your entire backend." },
  {
    text: "A single engine that manages your entire stack, and scales effortlessly.",
  },
  { text: "Instant observability throughout your entire backend." },
  { text: "Makes it impossible to ignore problems." },
  { text: "Anything you want it to be." },
];

const languageLogos = [
  { name: "TypeScript", icon: "🔷" },
  { name: "Python", icon: "🐍" },
  { name: "Go", icon: "🐹" },
  { name: "Rust", icon: "🦀" },
  { name: "Node.js", icon: "🟢" },
  { name: "Bun", icon: "🥟" },
];

const componentLogos = [
  { name: "PostgreSQL", icon: "🐘" },
  { name: "MongoDB", icon: "🍃" },
  { name: "Redis", icon: "🔴" },
  { name: "Kafka", icon: "📨" },
  { name: "GraphQL", icon: "◈" },
  { name: "gRPC", icon: "⚡" },
];

const cloudLogos = [
  { name: "AWS", icon: "☁️" },
  { name: "Google Cloud", icon: "🌐" },
  { name: "Azure", icon: "◆" },
  { name: "Cloudflare", icon: "🔶" },
  { name: "Vercel", icon: "▲" },
  { name: "Fly.io", icon: "🪁" },
];

interface HeroSectionProps {
  isDarkMode?: boolean;
}

export function HeroSection({ isDarkMode = true }: HeroSectionProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentContextIndex, setCurrentContextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isContextAnimating, setIsContextAnimating] = useState(false);

  // Install command state
  const [copySuccess, setCopySuccess] = useState(false);
  const [installCmd] = useState("curl -fsSL iii.sh/install.sh | sh");

  // Email form state
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(() => {
    return localStorage.getItem("iii_access_requested") === "true";
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCmd);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    // Simulate submission - in real app this would call the API
    setTimeout(() => {
      setIsSubmitted(true);
      localStorage.setItem("iii_access_requested", "true");
      localStorage.setItem("iii_access_email", email);
      setEmail("");
      setIsSubmitting(false);
    }, 500);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsAnimating(false);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsContextAnimating(true);
      setTimeout(() => {
        setCurrentContextIndex((prev) => (prev + 1) % rotatingContexts.length);
        setIsContextAnimating(false);
      }, 400);
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className={`relative min-h-[70vh] overflow-hidden font-mono transition-colors duration-300 ${
        isDarkMode ? "text-iii-light" : "text-iii-black"
      }`}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16">
        <div className="flex flex-col items-center text-center">
          {/* Content */}
          <div className="space-y-8 max-w-4xl">
            {/* Main headline */}
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight tracking-tighter">
                <span
                  className={isDarkMode ? "text-iii-light" : "text-iii-black"}
                >
                  The best way to
                </span>
                <br />
                <span
                  className={`inline-block whitespace-nowrap min-w-[280px] md:min-w-[360px] lg:min-w-[440px] bg-gradient-to-r from-iii-warn via-iii-warn to-iii-alert bg-clip-text text-transparent transition-all duration-500 ease-in-out ${
                    isAnimating
                      ? "opacity-0 translate-y-5 scale-80"
                      : "opacity-100 translate-y-0 scale-100"
                  }`}
                  style={{ fontSize: "clamp(2rem, 5vw, inherit)" }}
                >
                  {rotatingWords[currentWordIndex]}
                </span>
                <br />
                <span
                  className={`inline-block whitespace-nowrap min-w-[280px] md:min-w-[360px] lg:min-w-[440px] bg-gradient-to-r from-iii-success via-iii-info to-iii-success bg-clip-text text-transparent transition-all duration-500 ease-in-out ${
                    isContextAnimating
                      ? "opacity-0 -translate-y-3 scale-90"
                      : "opacity-100 translate-y-0 scale-100"
                  }`}
                  style={{ fontSize: "clamp(2rem, 5vw, inherit)" }}
                >
                  {rotatingContexts[currentContextIndex]}
                </span>
              </h1>
            </div>

            {/* Feature checklist */}
            <ul className="space-y-3 text-left inline-block">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                      isDarkMode ? "bg-iii-accent/20" : "bg-iii-accent-light/20"
                    }`}
                  >
                    <svg
                      className={`w-3 h-3 ${
                        isDarkMode ? "text-iii-accent" : "text-iii-accent-light"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span className="text-iii-medium text-sm md:text-base">
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Install Command & Email Form */}
            <div className="flex flex-col gap-4 md:gap-6 md:flex-row items-stretch md:items-start pt-2 md:pt-4 w-full max-w-2xl">
              <div className="flex flex-col gap-1.5">
                <div
                  className={`group relative flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 border rounded hover:border-iii-medium transition-colors cursor-pointer w-full md:w-auto md:min-w-[280px] ${
                    isDarkMode
                      ? "bg-iii-dark/50 border-iii-dark"
                      : "bg-white/50 border-iii-medium/30"
                  }`}
                  onClick={copyToClipboard}
                >
                  <TerminalIcon
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 text-iii-medium transition-colors flex-shrink-0 ${
                      isDarkMode
                        ? "group-hover:text-iii-accent"
                        : "group-hover:text-iii-accent-light"
                    }`}
                  />
                  <code
                    className={`text-xs md:text-sm flex-1 truncate ${
                      isDarkMode ? "text-iii-light" : "text-iii-black"
                    }`}
                  >
                    {installCmd}
                  </code>
                  {copySuccess ? (
                    <Check
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 ${
                        isDarkMode ? "text-iii-accent" : "text-iii-accent-light"
                      }`}
                    />
                  ) : (
                    <Copy
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 text-iii-medium transition-colors flex-shrink-0 ${
                        isDarkMode
                          ? "group-hover:text-white"
                          : "group-hover:text-iii-black"
                      }`}
                    />
                  )}
                </div>
                <a
                  href="https://motia.dev/docs"
                  target="_blank"
                  className={`inline-flex items-center gap-1.5 text-[14px] md:text-md transition-colors ${
                    isDarkMode
                      ? "text-iii-medium hover:text-iii-accent"
                      : "text-iii-medium hover:text-iii-accent-light"
                  }`}
                >
                  Learn more
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>

              <form
                onSubmit={handleEmailSubmit}
                className="flex items-center w-full md:w-auto"
              >
                {isSubmitted ? (
                  <div
                    className={`flex items-center gap-2 text-xs md:text-sm px-3 py-2.5 md:px-4 md:py-3 border rounded w-full justify-center ${
                      isDarkMode
                        ? "text-iii-accent bg-iii-accent/10 border-iii-accent/20"
                        : "text-iii-accent-light bg-iii-accent-light/10 border-iii-accent-light/20"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="font-mono tracking-tight">
                      ACCESS REQUESTED
                    </span>
                  </div>
                ) : (
                  <div
                    className={`flex w-full border-b border-iii-medium transition-colors relative ${
                      isDarkMode
                        ? "focus-within:border-iii-accent"
                        : "focus-within:border-iii-accent-light"
                    }`}
                  >
                    <input
                      type="email"
                      placeholder="EMAIL_FOR_ACCESS"
                      className={`bg-transparent outline-none text-xs md:text-sm py-2.5 md:py-3 px-1 w-full md:w-64 placeholder-iii-medium/50 font-mono ${
                        isDarkMode ? "text-iii-light" : "text-iii-black"
                      }`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 disabled:opacity-50 transition-colors p-1.5 md:p-2 ${
                        isDarkMode
                          ? "text-iii-light hover:text-iii-accent"
                          : "text-iii-black hover:text-iii-accent-light"
                      }`}
                    >
                      {isSubmitting ? (
                        "..."
                      ) : (
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Tech logos section */}
            <div className="pt-8 space-y-6 w-full max-w-3xl mx-auto">
              {/* Languages & Components row */}
              <div className="grid grid-cols-2 gap-8">
                {/* Languages - Left */}
                <div className="space-y-3">
                  <span className="text-xs text-iii-medium tracking-wider block text-center uppercase">
                    Any language
                  </span>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {languageLogos.map((logo, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                          isDarkMode
                            ? "bg-iii-dark border-iii-dark hover:border-iii-medium"
                            : "bg-white border-iii-medium/30 hover:border-iii-medium"
                        }`}
                        title={logo.name}
                      >
                        <span className="text-lg">{logo.icon}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Components - Right */}
                <div className="space-y-3">
                  <span className="text-xs text-iii-medium tracking-wider block text-center uppercase">
                    Every integration
                  </span>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {componentLogos.map((logo, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                          isDarkMode
                            ? "bg-iii-dark border-iii-dark hover:border-iii-medium"
                            : "bg-white border-iii-medium/30 hover:border-iii-medium"
                        }`}
                        title={logo.name}
                      >
                        <span className="text-lg">{logo.icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cloud providers - Center */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-1 h-px ${
                      isDarkMode ? "bg-iii-dark" : "bg-iii-medium/30"
                    }`}
                  />
                  <span className="text-xs text-iii-medium tracking-wider max-w-md text-center">
                    Any cloud, any compute, anything, you understand, we run
                    anything anywhere our engine doesn't care just use the right
                    adapter or write your own and it just works across your
                    entire application i cannot make this clearer.
                  </span>
                  <div
                    className={`flex-1 h-px ${
                      isDarkMode ? "bg-iii-dark" : "bg-iii-medium/30"
                    }`}
                  />
                </div>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {cloudLogos.map((logo, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                        isDarkMode
                          ? "bg-iii-dark border-iii-dark hover:border-iii-medium"
                          : "bg-white border-iii-medium/30 hover:border-iii-medium"
                      }`}
                      title={logo.name}
                    >
                      <span className="text-lg">{logo.icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

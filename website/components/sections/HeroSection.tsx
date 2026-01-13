import { useState, useEffect } from "react";

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
        isDarkMode
          ? "bg-iii-black text-iii-light"
          : "bg-iii-light text-iii-black"
      }`}
    >
      {/* Background gradient effects */}
      <div
        className={`absolute inset-0 transition-colors duration-300 ${
          isDarkMode
            ? "bg-gradient-to-b from-iii-black via-iii-black to-iii-dark/50"
            : "bg-gradient-to-b from-iii-light via-iii-light to-white"
        }`}
      />
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl bg-green-500/10" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl bg-emerald-500/5" />

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
                  className={`inline-block whitespace-nowrap min-w-[280px] md:min-w-[360px] lg:min-w-[440px] bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent transition-all duration-500 ease-in-out ${
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
                  className={`inline-block whitespace-nowrap min-w-[280px] md:min-w-[360px] lg:min-w-[440px] bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent transition-all duration-500 ease-in-out ${
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

            {/* CTA Button */}
            <div className="pt-4">
              <button
                className={`group inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-colors ${
                  isDarkMode
                    ? "bg-iii-light text-iii-black hover:bg-iii-medium"
                    : "bg-iii-black text-iii-light hover:bg-iii-dark"
                }`}
              >
                Get Started
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
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

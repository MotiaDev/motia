import React, { useState, useEffect } from "react";
import { Code2, Zap, Search, ArrowRight } from "lucide-react";

interface ThreePrimitivesSectionProps {
  isDarkMode: boolean;
}

const primitives = [
  {
    name: "Function",
    icon: Code2,
    tag: "01",
    oneLiner: "Any async handler. Any language. Globally addressable.",
    bullets: [
      "String ID routing",
      "Hot-swap at runtime",
      "Auto-cleanup on disconnect",
    ],
  },
  {
    name: "Trigger",
    icon: Zap,
    tag: "02",
    oneLiner: "HTTP, cron, events, state changes. One interface.",
    bullets: [
      "Condition-based routing",
      "Extensible at runtime",
      "No engine changes needed",
    ],
  },
  {
    name: "Discovery",
    icon: Search,
    tag: "03",
    oneLiner: "Zero-config. Workers see all functions system-wide.",
    bullets: [
      "Runtime self-awareness",
      "No service registry",
      "Dynamic topology",
    ],
  },
];

const replacedTools = [
  "Express",
  "Redis",
  "BullMQ",
  "Consul",
  "Temporal",
  "Kafka",
  "node-cron",
  "Datadog",
  "Socket.io",
  "Pino",
];

const stats = [
  { value: "18%", label: "overhead vs raw calls" },
  { value: "3", label: "polyglot SDKs" },
  { value: "1", label: "config file" },
];

export const ThreePrimitivesSection: React.FC<ThreePrimitivesSectionProps> = ({
  isDarkMode,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (hoveredIndex !== null) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [hoveredIndex]);

  const accentColor = isDarkMode ? "text-iii-accent" : "text-iii-accent-light";
  const accentBg = isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light";
  const textPrimary = isDarkMode ? "text-iii-light" : "text-iii-black";
  const textSecondary = isDarkMode ? "text-iii-light/70" : "text-iii-black/70";
  const textMuted = isDarkMode ? "text-iii-light/40" : "text-iii-black/40";
  const cardBg = isDarkMode ? "bg-iii-dark/30" : "bg-white/50";
  const cardBorder = isDarkMode ? "border-iii-light/10" : "border-iii-black/10";
  const accentRgb = isDarkMode ? "243,247,36" : "47,127,255";

  const currentHighlight = hoveredIndex !== null ? hoveredIndex : activeIndex;

  return (
    <section className={`relative overflow-hidden font-mono transition-colors duration-300 ${textPrimary}`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background: `radial-gradient(circle, rgba(${accentRgb},1) 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="text-center mb-10 md:mb-14">
          <p className={`text-[10px] uppercase tracking-[0.3em] mb-4 ${accentColor}`}>
            The foundation
          </p>
          <h2
            className={`text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold tracking-tighter font-chivo`}
          >
            Three primitives.{" "}
            <span className={accentColor}>Infinite backends.</span>
          </h2>
          <p className={`mt-4 text-xs md:text-sm max-w-md mx-auto leading-relaxed ${textSecondary}`}>
            React simplified frontend with Component and Context.
            <br />
            iii does the same for backend.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {primitives.map((p, i) => {
            const Icon = p.icon;
            const isActive = currentHighlight === i;
            return (
              <div
                key={p.name}
                className={`group relative border rounded-lg transition-all duration-500 cursor-default overflow-hidden ${cardBg} ${
                  isActive
                    ? isDarkMode
                      ? "border-iii-accent/30"
                      : "border-iii-accent-light/30"
                    : cardBorder
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {isActive && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                      background: `radial-gradient(ellipse at top, rgba(${accentRgb},1) 0%, transparent 60%)`,
                    }}
                  />
                )}

                <div className="relative p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-md flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? isDarkMode
                              ? "bg-iii-accent/10 shadow-[0_0_12px_rgba(243,247,36,0.1)]"
                              : "bg-iii-accent-light/10 shadow-[0_0_12px_rgba(47,127,255,0.1)]"
                            : isDarkMode
                              ? "bg-iii-light/5"
                              : "bg-iii-black/5"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 transition-colors duration-300 ${
                            isActive ? accentColor : textSecondary
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-[0.2em] font-bold ${accentColor}`}
                      >
                        {p.name}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono ${textMuted}`}>
                      {p.tag}
                    </span>
                  </div>

                  <p className={`text-sm leading-relaxed mb-0 ${textSecondary}`}>
                    {p.oneLiner}
                  </p>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      isActive
                        ? "max-h-40 opacity-100 mt-4"
                        : "max-h-0 opacity-0 mt-0"
                    }`}
                  >
                    <div
                      className={`space-y-2 border-t pt-3 ${cardBorder}`}
                    >
                      {p.bullets.map((b) => (
                        <div key={b} className="flex items-center gap-2.5">
                          <div
                            className={`w-1 h-1 rounded-full flex-shrink-0 ${accentBg} opacity-60`}
                          />
                          <span className={`text-xs ${textMuted}`}>
                            {b}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={`h-[2px] transition-all duration-500 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.4), transparent)`,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="hidden md:flex items-center justify-center gap-3 mt-6 mb-2">
          {["register", "bind", "discover"].map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && (
                <ArrowRight className={`w-3 h-3 ${textMuted}`} />
              )}
              <span
                className={`text-[10px] uppercase tracking-[0.15em] ${
                  currentHighlight === i ? accentColor : textMuted
                } transition-colors duration-300`}
              >
                {label}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="mt-8 md:mt-10 flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            {replacedTools.map((tool, i) => (
              <React.Fragment key={tool}>
                <span className={`text-[11px] line-through ${textMuted}`}>
                  {tool}
                </span>
                {i < replacedTools.length - 1 && (
                  <span className={`text-[8px] ${textMuted} opacity-30`}>
                    /
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`h-px w-6 ${accentBg} opacity-30`} />
            <span
              className={`text-xs font-bold tracking-[0.15em] uppercase ${accentColor}`}
            >
              one binary
            </span>
            <div className={`h-px w-6 ${accentBg} opacity-30`} />
          </div>
        </div>

        <div className="mt-10 md:mt-12 grid grid-cols-3 max-w-md mx-auto">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`text-center px-4 ${
                i < stats.length - 1
                  ? isDarkMode
                    ? "border-r border-iii-light/10"
                    : "border-r border-iii-black/10"
                  : ""
              }`}
              style={{
                animation: `statCount 0.4s ease-out ${i * 0.12}s both`,
              }}
            >
              <div
                className={`text-2xl md:text-3xl font-bold tracking-tight font-chivo ${accentColor}`}
              >
                {s.value}
              </div>
              <div className={`text-[10px] mt-1 leading-tight ${textMuted}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

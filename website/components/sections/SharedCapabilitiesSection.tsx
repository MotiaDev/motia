import React, { useState } from "react";
import { Database, Radio, Eye, Zap, ArrowRight } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";

interface SharedCapabilitiesSectionProps {
  isDarkMode?: boolean;
}

const capabilities = [
  {
    id: "state",
    icon: Database,
    title: "Shared State",
    subtitle: "Cross-language state access",
    description: "Python worker sets a value, Node.js worker reads it instantly — no Redis required.",
    colorKey: "accent",
    codeExample: {
      left: { lang: "Python", code: 'state.set("user:123", data)' },
      right: { lang: "Node.js", code: 'const data = await state.get("user:123")' },
    },
  },
  {
    id: "streaming",
    icon: Radio,
    title: "Real-time Streaming",
    subtitle: "Bidirectional data flows",
    description: "Stream data between workers in real-time. Process infinite sequences without buffering.",
    colorKey: "info",
    codeExample: {
      left: { lang: "Producer", code: 'stream.emit("data.chunk", chunk)' },
      right: { lang: "Consumer", code: 'stream.on("data.chunk", process)' },
    },
  },
  {
    id: "observability",
    icon: Eye,
    title: "Complete Observability",
    subtitle: "Auto-injected tracing",
    description: "Every invocation carries a trace ID. Logs and metrics flow automatically to your preferred backend.",
    colorKey: "success",
    codeExample: {
      left: { lang: "Any Worker", code: 'log.info("Processing", { traceId })' },
      right: { lang: "Engine", code: "// Auto-correlated across all workers" },
    },
  },
  {
    id: "events",
    icon: Zap,
    title: "Event Bus",
    subtitle: "Pub/sub between workers",
    description: "Publish events from any worker, subscribe from any other. No message queue configuration needed.",
    colorKey: "warn",
    codeExample: {
      left: { lang: "Publisher", code: 'events.emit("order.created", order)' },
      right: { lang: "Subscriber", code: 'events.on("order.created", notify)' },
    },
  },
];

const colorStyles = {
  accent: {
    dark: {
      bg: "bg-iii-accent/10",
      border: "border-iii-accent/30",
      text: "text-iii-accent",
      glow: "bg-iii-accent",
    },
    light: {
      bg: "bg-iii-accent-light/10",
      border: "border-iii-accent-light/30",
      text: "text-iii-accent-light",
      glow: "bg-iii-accent-light",
    },
  },
  info: {
    dark: {
      bg: "bg-iii-info/10",
      border: "border-iii-info/30",
      text: "text-iii-info",
      glow: "bg-iii-info",
    },
    light: {
      bg: "bg-[#0891b2]/10",
      border: "border-[#0891b2]/30",
      text: "text-[#0891b2]",
      glow: "bg-[#0891b2]",
    },
  },
  success: {
    dark: {
      bg: "bg-iii-success/10",
      border: "border-iii-success/30",
      text: "text-iii-success",
      glow: "bg-iii-success",
    },
    light: {
      bg: "bg-[#059669]/10",
      border: "border-[#059669]/30",
      text: "text-[#059669]",
      glow: "bg-[#059669]",
    },
  },
  warn: {
    dark: {
      bg: "bg-iii-warn/10",
      border: "border-iii-warn/30",
      text: "text-iii-warn",
      glow: "bg-iii-warn",
    },
    light: {
      bg: "bg-[#d97706]/10",
      border: "border-[#d97706]/30",
      text: "text-[#d97706]",
      glow: "bg-[#d97706]",
    },
  },
};

export function SharedCapabilitiesSection({ isDarkMode = true }: SharedCapabilitiesSectionProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const textPrimary = isDarkMode ? "text-iii-light" : "text-iii-black";
  const textSecondary = isDarkMode ? "text-iii-light/70" : "text-iii-black/70";
  const borderColor = isDarkMode ? "border-iii-light/10" : "border-iii-black/10";
  const bgCard = isDarkMode ? "bg-iii-dark/20" : "bg-white/40";
  const accentColor = isDarkMode ? "text-iii-accent" : "text-iii-accent-light";

  return (
    <section
      className={`relative overflow-hidden font-mono transition-colors duration-300 ${textPrimary}`}
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-iii-accent/30 bg-iii-accent/5 mb-6">
            <Database className={`w-4 h-4 ${accentColor}`} />
            <span className={`text-xs font-mono tracking-wider uppercase ${accentColor}`}>
              Shared Capabilities
            </span>
          </div>
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter leading-[1.1]">
            <span className="block sm:inline">Start building now.</span>{" "}
            <span className={`${accentColor} relative inline-block`}>
              Scale your way.
              <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-1.5 sm:h-2 opacity-30" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 4 Q50 0 100 4 T200 4" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </span>
          </h2>
          <p className={`text-sm md:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed ${textSecondary}`}>
            Built-in defaults get you running without thinking about architecture.
            When you outgrow them, swap in Redis, BullMQ, or whatever you prefer — the Engine works with your stack, not against it.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            const isHovered = hoveredCard === cap.id;
            const colors = colorStyles[cap.colorKey as keyof typeof colorStyles][isDarkMode ? "dark" : "light"];

            return (
              <div
                key={cap.id}
                className={`
                  relative p-5 md:p-6 lg:p-8 rounded-2xl border-2 transition-all duration-300
                  ${isHovered ? `${colors.border} ${colors.bg}` : `${borderColor} ${bgCard}`}
                  hover:translate-y-[-4px] cursor-pointer
                `}
                onMouseEnter={() => setHoveredCard(cap.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Glow effect on hover */}
                {isHovered && (
                  <div className={`absolute inset-0 rounded-2xl ${colors.glow} opacity-5 blur-xl pointer-events-none`} />
                )}

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`
                      p-3 rounded-xl transition-all duration-300
                      ${isHovered ? colors.bg : isDarkMode ? 'bg-iii-dark/50' : 'bg-white/50'}
                    `}>
                      <Icon className={`w-6 h-6 transition-colors duration-300 ${isHovered ? colors.text : textSecondary}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-base md:text-lg font-bold mb-1 ${textPrimary}`}>
                        {cap.title}
                      </h3>
                      <p className={`text-xs ${isHovered ? colors.text : textSecondary}`}>
                        {cap.subtitle}
                      </p>
                    </div>
                    {/* Number badge */}
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      font-bold text-xs transition-all duration-300
                      ${isHovered ? `${colors.bg} ${colors.text}` : `${isDarkMode ? 'bg-iii-dark/50' : 'bg-white/70'} ${textSecondary}`}
                    `}>
                      {String(capabilities.indexOf(cap) + 1).padStart(2, "0")}
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-xs md:text-sm leading-relaxed mb-4 ${textSecondary}`}>
                    {cap.description}
                  </p>

                  {/* Code Example */}
                  <div className={`
                    flex flex-col sm:flex-row items-stretch gap-3 p-3 rounded-xl
                    ${isDarkMode ? 'bg-iii-dark/40' : 'bg-white/60'}
                  `}>
                    {/* Left code */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] sm:text-xs mb-2 ${colors.text} font-bold uppercase tracking-wider`}>
                        {cap.codeExample.left.lang}
                      </div>
                      <div className={`rounded-lg overflow-x-auto ${isDarkMode ? 'bg-iii-black' : 'bg-iii-black/5'}`}>
                        <Highlight
                          theme={isDarkMode ? themes.nightOwl : themes.github}
                          code={cap.codeExample.left.code}
                          language="javascript"
                        >
                          {({ tokens, getTokenProps }) => (
                            <pre className="text-xs sm:text-sm font-mono px-3 py-2 whitespace-nowrap">
                              {tokens.map((line, i) => (
                                <span key={i}>
                                  {line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token })} />
                                  ))}
                                </span>
                              ))}
                            </pre>
                          )}
                        </Highlight>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center py-2 sm:py-0 sm:px-2">
                      <ArrowRight className={`w-4 h-4 ${colors.text} rotate-90 sm:rotate-0`} />
                    </div>

                    {/* Right code */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] sm:text-xs mb-2 ${colors.text} font-bold uppercase tracking-wider`}>
                        {cap.codeExample.right.lang}
                      </div>
                      <div className={`rounded-lg overflow-x-auto ${isDarkMode ? 'bg-iii-black' : 'bg-iii-black/5'}`}>
                        <Highlight
                          theme={isDarkMode ? themes.nightOwl : themes.github}
                          code={cap.codeExample.right.code}
                          language="javascript"
                        >
                          {({ tokens, getTokenProps }) => (
                            <pre className="text-xs sm:text-sm font-mono px-3 py-2 whitespace-nowrap">
                              {tokens.map((line, i) => (
                                <span key={i}>
                                  {line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token })} />
                                  ))}
                                </span>
                              ))}
                            </pre>
                          )}
                        </Highlight>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className={`
                  absolute bottom-0 left-4 right-4 h-[2px] rounded-full transition-all duration-300
                  ${isHovered ? `${colors.glow} opacity-100` : 'opacity-0'}
                `} />
              </div>
            );
          })}
        </div>

        {/* Bottom callout */}
        <div className="mt-8 md:mt-12 text-center">
          <div className={`
            inline-flex items-center gap-3 px-5 py-3 rounded-xl
            ${isDarkMode ? 'bg-iii-dark/40' : 'bg-white/60'}
            border ${borderColor}
          `}>
            <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-iii-accent' : 'bg-iii-accent-light'} animate-pulse`} />
            <span className={`text-xs md:text-sm ${textSecondary}`}>
              All capabilities available via the same{" "}
              <span className={accentColor}>iii protocol</span> —
              accessible from any language
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

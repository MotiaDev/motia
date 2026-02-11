import { useState } from "react";
import { Database, Layers, GitBranch, Users, Zap, Globe, Eye, Cloud, Clock, MessageSquare, Activity, Share2, Bot, ArrowRight } from "lucide-react";
import { Logo } from "../Logo";

interface EngineSectionProps {
  isDarkMode?: boolean;
}

const registries = [
  {
    id: "function",
    icon: GitBranch,
    name: "Function Registry",
    description: "Maps globally addressable function paths to executable handlers — local modules or remote workers.",
    details: [
      "Unique function paths (e.g., user.create, orders.process)",
      "Overwrite semantics for updates without caller changes",
      "Optional metadata and schema definitions",
      "Automatic cleanup on worker disconnect",
    ],
  },
  {
    id: "trigger",
    icon: Zap,
    name: "Trigger Registry",
    description: "Two-tier structure binding external events to function invocations.",
    details: [
      "Trigger Types: Categories (HTTP, cron, events, webhooks, AI intents)",
      "Trigger Instances: Concrete configs mapped to function paths",
      "Runtime extensibility — workers define new trigger types",
      "Domain-specific triggers without engine modification",
    ],
  },
  {
    id: "worker",
    icon: Users,
    name: "Worker Registry",
    description: "Tracks connected workers with bidirectional communication channels and lifecycle state.",
    details: [
      "Unique worker IDs for routing and coordination",
      "Bidirectional message channels (WebSocket)",
      "Active invocation tracking",
      "Graceful disconnect handling",
    ],
  },
];

// Worker languages removed
const capabilities = [
  {
    title: "Unified Invocation",
    description: "Local in-process and remote worker functions use the same invocation interface.",
    icon: "→",
  },
  {
    title: "Request-Response Correlation",
    description: "Unique invocation IDs enable synchronous-style semantics across async network boundaries.",
    icon: "⟳",
  },
  {
    title: "Lifecycle Management",
    description: "Automatic cleanup of functions, triggers, and pending invocations on worker disconnect.",
    icon: "◎",
  },
  {
    title: "Recursive Orchestration",
    description: "An engine can operate as a worker of another engine for federated architectures.",
    icon: "∞",
  },
];

const capabilityNodes = [
  {
    title: "HTTP + Webhooks",
    subtitle: "API triggers",
    icon: Globe,
    tone: "accent",
    side: "left",
  },
  {
    title: "Cron + Schedules",
    subtitle: "Timed execution",
    icon: Clock,
    tone: "warn",
    side: "left",
  },
  {
    title: "Queues + Events",
    subtitle: "Pub/Sub and topics",
    icon: MessageSquare,
    tone: "info",
    side: "left",
  },
  {
    title: "State + Cache",
    subtitle: "Shared context",
    icon: Database,
    tone: "success",
    side: "left",
  },
  {
    title: "Streaming",
    subtitle: "Realtime pipes",
    icon: Activity,
    tone: "info",
    side: "right",
  },
  {
    title: "Observability",
    subtitle: "Logs + traces",
    icon: Eye,
    tone: "accent",
    side: "right",
  },
  {
    title: "Workflows",
    subtitle: "Multi-step orchestration",
    icon: Share2,
    tone: "warn",
    side: "right",
  },
  {
    title: "AI Agents",
    subtitle: "Tool discovery",
    icon: Bot,
    tone: "alert",
    side: "right",
  },
];

export function EngineSection({ isDarkMode = true }: EngineSectionProps) {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const textPrimary = isDarkMode ? "text-iii-light" : "text-iii-black";
  const textSecondary = isDarkMode ? "text-iii-light/70" : "text-iii-black/70";
  const borderColor = isDarkMode ? "border-iii-light/10" : "border-iii-black/10";
  const bgCard = isDarkMode ? "bg-iii-dark/20" : "bg-white/40";
  const accentColor = isDarkMode ? "text-iii-accent" : "text-iii-accent-light";
  const accentBorder = isDarkMode ? "border-iii-accent" : "border-iii-accent-light";

  const toneClasses = {
    accent: {
      icon: isDarkMode ? "text-iii-accent" : "text-iii-accent-light",
      bg: isDarkMode ? "bg-iii-accent/10" : "bg-iii-accent-light/10",
      border: isDarkMode ? "border-iii-accent/20" : "border-iii-accent-light/20",
    },
    info: {
      icon: "text-iii-info",
      bg: "bg-iii-info/10",
      border: "border-iii-info/20",
    },
    warn: {
      icon: "text-iii-warn",
      bg: "bg-iii-warn/10",
      border: "border-iii-warn/20",
    },
    success: {
      icon: "text-iii-success",
      bg: "bg-iii-success/10",
      border: "border-iii-success/20",
    },
    alert: {
      icon: "text-iii-alert",
      bg: "bg-iii-alert/10",
      border: "border-iii-alert/20",
    },
  } as const;

  const leftNodes = capabilityNodes.filter((node) => node.side === "left");
  const rightNodes = capabilityNodes.filter((node) => node.side === "right");

  return (
    <section
      className={`relative overflow-hidden font-mono transition-colors duration-300 ${textPrimary}`}
    >
      {/* Subtle ambient glow decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-[0.02]"
          style={{
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
          }}
        />
      </div>
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-iii-accent/30 bg-iii-accent/5 mb-6">
            <Layers className={`w-4 h-4 ${accentColor}`} />
            <span className={`text-xs font-mono tracking-wider uppercase ${accentColor}`}>
              Architecture
            </span>
          </div>
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter leading-[1.1]">
            <span className="block sm:inline">Your stack,</span>{" "}
            <br className="hidden sm:block" />
            <span className={`${accentColor} relative inline-block`}>
              instantly unified.
              <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-1.5 sm:h-2 opacity-30" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 4 Q50 0 100 4 T200 4" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </span>
          </h2>
          <p className={`text-sm md:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed ${textSecondary}`}>
            Express, Flask, Spring — they all become part of your distributed architecture instantly.
            Connect internal services, third-party APIs, and new functions through one protocol.
          </p>
          {/* Key Pillars */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 pt-4 md:pt-6">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm md:text-base font-medium bg-iii-success/15 text-iii-success border border-iii-success/20">
              <Cloud className="w-4 h-4 md:w-5 md:h-5" />
              <span>Self-host / BYOC</span>
            </div>
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm md:text-base font-medium bg-iii-info/15 text-iii-info border border-iii-info/20">
              <Eye className="w-4 h-4 md:w-5 md:h-5" />
              <span>Complete Observability</span>
            </div>
            <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm md:text-base font-medium border ${isDarkMode ? 'bg-iii-accent/15 border-iii-accent/20' : 'bg-iii-accent-light/15 border-iii-accent-light/20'} ${accentColor}`}>
              <Globe className="w-4 h-4 md:w-5 md:h-5" />
              <span>Any Language, Anywhere</span>
            </div>
          </div>
        </div>

        {/* Three Registries - Side by Side */}
        <div className="mb-12 md:mb-16">
          <div className="text-center mb-8 md:mb-12">
            <h3 className={`text-xl md:text-2xl lg:text-3xl font-bold ${textPrimary}`}>
              Two core concepts
            </h3>
            <p className={`text-xs md:text-sm mt-2 ${textSecondary}`}>
              Register functions. Call them. The engine handles everything else.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {registries.map((registry) => {
              const Icon = registry.icon;
              return (
                <div
                  key={registry.id}
                  className={`
                    relative rounded-2xl overflow-hidden
                    ${isDarkMode ? 'bg-iii-dark/40' : 'bg-white/60'}
                    border ${borderColor}
                  `}
                >
                  <div className={`flex items-center gap-3 px-5 py-4 border-b ${borderColor}`}>
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                      <Icon className={`w-4 h-4 ${accentColor}`} />
                    </div>
                    <div className={`text-sm font-bold ${textPrimary}`}>{registry.name}</div>
                  </div>
                  <div className="p-5">
                    <p className={`text-xs md:text-sm leading-relaxed mb-4 ${textSecondary}`}>
                      {registry.description}
                    </p>
                    <div className="space-y-2">
                      {registry.details.map((detail, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-2 text-xs ${textPrimary}`}
                        >
                          <span className={`${accentColor} mt-0.5`}>+</span>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trigger Pattern - One Pattern, Infinite Possibilities */}
        <div className={`
          max-w-4xl mx-auto mb-12 md:mb-16 p-4 sm:p-6 rounded-2xl border-2
          ${isDarkMode
            ? "bg-iii-dark/30 border-iii-light/10"
            : "bg-white/50 border-iii-black/10"
          }
        `}>
          <div className="text-center mb-4">
            <h3 className={`text-sm sm:text-base md:text-lg font-bold ${textPrimary}`}>
              One Pattern. Infinite Possibilities.
            </h3>
            <p className={`text-xs mt-1 ${textSecondary}`}>
              Every external event simply becomes a trigger binding
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {[
              { trigger: "HTTP Trigger", binds: "POST /api/user", to: "create_user()" },
              { trigger: "Cron Trigger", binds: '"0 9 * * *"', to: "reports::daily()" },
              { trigger: "State Trigger", binds: "user.status", to: "notify_admin()" },
              { trigger: "Custom Trigger", binds: "payment.success", to: "send_receipt()" },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex flex-wrap items-center gap-2 p-3 rounded-xl text-[10px] sm:text-xs ${
                  isDarkMode ? "bg-iii-dark/50 border border-iii-light/10" : "bg-white/50 border border-iii-black/10"
                }`}
              >
                <span className={`font-bold ${accentColor}`}>
                  {item.trigger}
                </span>
                <ArrowRight className={`w-3 h-3 flex-shrink-0 ${isDarkMode ? "text-iii-light/40" : "text-iii-black/40"}`} />
                <span className={`font-mono ${isDarkMode ? "text-iii-light/80" : "text-iii-black/80"}`}>
                  {item.binds}
                </span>
                <ArrowRight className={`w-3 h-3 flex-shrink-0 ${isDarkMode ? "text-iii-light/40" : "text-iii-black/40"}`} />
                <span className={`font-mono ${accentColor}`}>
                  {item.to}
                </span>
              </div>
            ))}
          </div>

          <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-iii-light/10" : "border-iii-black/10"}`}>
            <p className={`text-center text-xs sm:text-sm ${textSecondary}`}>
              Simply{" "}
              <span className={`font-bold ${accentColor}`}>register functions</span>
              {" "}and{" "}
              <span className={`font-bold ${accentColor}`}>call them</span>.
            </p>
          </div>
        </div>

        {/* Engine Capabilities - Scrollable List */}
        <div className="mb-12 md:mb-16">
          <div className="text-center mb-6 md:mb-8">
            <h3 className={`text-xl md:text-2xl lg:text-3xl font-bold ${textPrimary}`}>
              Engine capabilities
            </h3>
            <p className={`text-xs md:text-sm mt-2 ${textSecondary}`}>
              Core primitives that compose into any backend pattern
            </p>
          </div>

          <div className="relative px-2">
            <div
              className="max-h-[360px] overflow-y-auto"
            >
              <div className={`border-t ${borderColor}`}>
                {capabilities.map((cap, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between gap-4 py-3 md:py-4 border-b ${borderColor}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`text-sm md:text-base font-mono ${textSecondary}`}>
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm md:text-base font-semibold ${textPrimary}`}>
                          {cap.title}
                        </div>
                        <div className={`text-[10px] md:text-xs ${textSecondary} truncate`}>
                          {cap.description}
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg md:text-xl ${textSecondary}`}>+</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Capability Map Diagram — Interactive */}
        <style>{`
          @keyframes dot-flow-right {
            0% { left: -6px; opacity: 0; }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { left: calc(100% - 6px); opacity: 0; }
          }
          @keyframes dot-flow-left {
            0% { right: -6px; opacity: 0; }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { right: calc(100% - 6px); opacity: 0; }
          }
          @keyframes dash-scroll {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -20; }
          }
          @keyframes engine-pulse {
            0%, 100% { box-shadow: 0 0 30px rgba(var(--pulse-rgb), 0.15); }
            50% { box-shadow: 0 0 60px rgba(var(--pulse-rgb), 0.35); }
          }
        `}</style>

        <div className={`relative p-6 sm:p-8 md:p-12 lg:p-16 rounded-2xl md:rounded-3xl border ${borderColor} ${bgCard} overflow-hidden`}>
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(${isDarkMode ? 'var(--color-light)' : 'var(--color-black)'} 1px, transparent 1px),
                linear-gradient(90deg, ${isDarkMode ? 'var(--color-light)' : 'var(--color-black)'} 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10">
            <div className="text-center mb-6 md:mb-10">
              <h3 className={`text-xl md:text-2xl font-mono font-bold tracking-tight ${textPrimary}`}>
                The Engine does it all
              </h3>
              <p className={`text-sm mt-3 font-mono ${textSecondary}`}>
                Events flow through the Engine to any worker, in any language
              </p>
            </div>

            {/* Mobile/Tablet: Engine + 2-col grid */}
            <div className="lg:hidden flex flex-col gap-6">
              <div className="relative flex items-center justify-center">
                <div className={`absolute -inset-4 rounded-3xl border ${isDarkMode ? "border-iii-accent/15" : "border-iii-accent-light/15"}`} />
                <div
                  className={`relative z-10 w-full max-w-md px-6 py-8 rounded-3xl border-2 ${accentBorder} ${isDarkMode ? "bg-iii-dark/70" : "bg-white/70"}`}
                  style={{ '--pulse-rgb': isDarkMode ? '168,85,247' : '126,34,206' } as React.CSSProperties}
                >
                  <Logo className={`h-3 mb-1 ${isDarkMode ? "text-iii-light/50" : "text-iii-black/50"}`} />
                  <div className={`text-2xl font-bold ${accentColor}`}>Engine</div>
                  <div className={`text-xs mt-2 ${textSecondary}`}>Orchestrates triggers, functions, and workers</div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono ${borderColor} ${isDarkMode ? "bg-iii-dark/40" : "bg-white/80"} ${textSecondary}`}>
                      Trigger &bull; Function &bull; Worker
                    </span>
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono ${borderColor} ${isDarkMode ? "bg-iii-light/5" : "bg-iii-light"} ${textSecondary}`}>
                      <Eye className="w-3 h-3" /> End-to-end tracing
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {capabilityNodes.map((node) => {
                  const Icon = node.icon;
                  const tone = toneClasses[node.tone as keyof typeof toneClasses];
                  return (
                    <div key={node.title} className={`rounded-xl border ${borderColor} ${bgCard} px-3 py-2.5 flex items-center gap-2.5`}>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${tone.border} ${tone.bg} flex-shrink-0`}>
                        <Icon className={`h-3.5 w-3.5 ${tone.icon}`} />
                      </div>
                      <div className="text-left min-w-0">
                        <div className={`text-xs font-semibold ${textPrimary} truncate`}>{node.title}</div>
                        <div className={`text-[10px] ${textSecondary} truncate`}>{node.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Interactive 5-column grid with connection lines */}
            <div
              className="hidden lg:grid items-center"
              style={{
                gridTemplateColumns: '1fr 120px 1.3fr 120px 1fr',
                gridTemplateRows: 'repeat(4, auto)',
                gap: '14px 0',
              }}
            >
              {/* Engine Center — spans all 4 rows */}
              <div
                className="flex items-center justify-center"
                style={{ gridColumn: '3', gridRow: '1 / 5' }}
              >
                <div className="relative">
                  <div className={`absolute -inset-5 rounded-3xl border transition-all duration-500 ${activeNode ? (isDarkMode ? 'border-iii-accent/30' : 'border-iii-accent-light/30') : (isDarkMode ? 'border-iii-accent/10' : 'border-iii-accent-light/10')}`} />
                  <div
                    className={`relative z-10 w-full px-8 py-10 rounded-3xl border-2 transition-all duration-500 ${accentBorder} ${isDarkMode ? "bg-iii-dark/70" : "bg-white/70"}`}
                    style={{
                      '--pulse-rgb': isDarkMode ? '168,85,247' : '126,34,206',
                      animation: activeNode ? 'engine-pulse 2s ease-in-out infinite' : 'none',
                    } as React.CSSProperties}
                  >
                    <Logo className={`h-3 mb-1 ${isDarkMode ? "text-iii-light/50" : "text-iii-black/50"}`} />
                    <div className={`text-3xl font-bold ${accentColor}`}>Engine</div>
                    <div className={`text-sm mt-2 ${textSecondary}`}>
                      Orchestrates triggers, functions, and workers
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono ${borderColor} ${isDarkMode ? "bg-iii-dark/40" : "bg-white/80"} ${textSecondary}`}>
                        Trigger &bull; Function &bull; Worker
                      </span>
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono ${borderColor} ${isDarkMode ? "bg-iii-light/5" : "bg-iii-light"} ${textSecondary}`}>
                        <Eye className="w-3 h-3" /> End-to-end tracing
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rows: left node → connector → [engine] → connector → right node */}
              {leftNodes.map((leftNode, i) => {
                const rightNode = rightNodes[i];
                const LeftIcon = leftNode.icon;
                const RightIcon = rightNode.icon;
                const leftTone = toneClasses[leftNode.tone as keyof typeof toneClasses];
                const rightTone = toneClasses[rightNode.tone as keyof typeof toneClasses];
                const leftActive = activeNode === leftNode.title;
                const rightActive = activeNode === rightNode.title;
                const row = i + 1;

                return (
                  <div key={i} className="contents">
                    {/* Left Node */}
                    <div
                      style={{ gridColumn: '1', gridRow: `${row}` }}
                      className="flex justify-end"
                      onMouseEnter={() => setActiveNode(leftNode.title)}
                      onMouseLeave={() => setActiveNode(null)}
                    >
                      <div className={`w-full max-w-[240px] rounded-xl border px-4 py-3 flex items-center gap-3 transition-all duration-300 cursor-default ${leftActive ? `${leftTone.border} scale-[1.03]` : `${borderColor} hover:border-iii-medium/30`} ${bgCard}`}>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border flex-shrink-0 transition-all duration-300 ${leftActive ? `${leftTone.border} ${leftTone.bg}` : `${leftTone.border} ${leftTone.bg}`}`}>
                          <LeftIcon className={`h-4 w-4 ${leftTone.icon}`} />
                        </div>
                        <div className="text-left min-w-0">
                          <div className={`text-xs font-semibold ${textPrimary} truncate`}>{leftNode.title}</div>
                          <div className={`text-[10px] ${textSecondary} truncate`}>{leftNode.subtitle}</div>
                        </div>
                      </div>
                    </div>

                    {/* Left Connector — dashed SVG line + animated dot */}
                    <div
                      style={{ gridColumn: '2', gridRow: `${row}` }}
                      className="relative flex items-center h-12"
                    >
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 48" preserveAspectRatio="none">
                        <line
                          x1="0" y1="24" x2="112" y2="24"
                          stroke={leftActive ? (isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)') : (isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')}
                          strokeWidth={leftActive ? "2" : "1.5"}
                          strokeDasharray="6 4"
                          style={{ animation: 'dash-scroll 1s linear infinite', transition: 'stroke 0.3s, stroke-width 0.3s' }}
                        />
                        <polygon
                          points="120,24 110,19 110,29"
                          fill={leftActive ? (isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)') : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')}
                          style={{ transition: 'fill 0.3s' }}
                        />
                      </svg>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
                        style={{
                          width: leftActive ? '10px' : '6px',
                          height: leftActive ? '10px' : '6px',
                          background: leftActive ? (isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)') : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                          boxShadow: leftActive ? `0 0 12px ${isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)'}` : 'none',
                          animation: `dot-flow-right ${leftActive ? '1s' : '2.5s'} linear infinite`,
                          animationDelay: `${i * 0.5}s`,
                        }}
                      />
                      {leftActive && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full"
                          style={{
                            background: isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)',
                            boxShadow: `0 0 12px ${isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)'}`,
                            animation: 'dot-flow-right 1s linear infinite',
                            animationDelay: '0.5s',
                          }}
                        />
                      )}
                    </div>

                    {/* Right Connector — dashed SVG line + animated dot */}
                    <div
                      style={{ gridColumn: '4', gridRow: `${row}` }}
                      className="relative flex items-center h-12"
                    >
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 48" preserveAspectRatio="none">
                        <line
                          x1="8" y1="24" x2="120" y2="24"
                          stroke={rightActive ? (isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)') : (isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')}
                          strokeWidth={rightActive ? "2" : "1.5"}
                          strokeDasharray="6 4"
                          style={{ animation: 'dash-scroll 1s linear infinite', transition: 'stroke 0.3s, stroke-width 0.3s' }}
                        />
                        <polygon
                          points="0,24 10,19 10,29"
                          fill={rightActive ? (isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)') : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')}
                          style={{ transition: 'fill 0.3s' }}
                        />
                      </svg>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
                        style={{
                          width: rightActive ? '10px' : '6px',
                          height: rightActive ? '10px' : '6px',
                          background: rightActive ? (isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)') : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                          boxShadow: rightActive ? `0 0 12px ${isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)'}` : 'none',
                          animation: `dot-flow-left ${rightActive ? '1s' : '2.5s'} linear infinite`,
                          animationDelay: `${i * 0.5}s`,
                        }}
                      />
                      {rightActive && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full"
                          style={{
                            background: isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)',
                            boxShadow: `0 0 12px ${isDarkMode ? 'var(--color-accent)' : 'var(--color-accent-light)'}`,
                            animation: 'dot-flow-left 1s linear infinite',
                            animationDelay: '0.5s',
                          }}
                        />
                      )}
                    </div>

                    {/* Right Node */}
                    <div
                      style={{ gridColumn: '5', gridRow: `${row}` }}
                      className="flex justify-start"
                      onMouseEnter={() => setActiveNode(rightNode.title)}
                      onMouseLeave={() => setActiveNode(null)}
                    >
                      <div className={`w-full max-w-[240px] rounded-xl border px-4 py-3 flex items-center gap-3 transition-all duration-300 cursor-default ${rightActive ? `${rightTone.border} scale-[1.03]` : `${borderColor} hover:border-iii-medium/30`} ${bgCard}`}>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border flex-shrink-0 transition-all duration-300 ${rightTone.border} ${rightTone.bg}`}>
                          <RightIcon className={`h-4 w-4 ${rightTone.icon}`} />
                        </div>
                        <div className="text-left min-w-0">
                          <div className={`text-xs font-semibold ${textPrimary} truncate`}>{rightNode.title}</div>
                          <div className={`text-[10px] ${textSecondary} truncate`}>{rightNode.subtitle}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { Network, Database, Eye, Clock, Shield, Code, GitBranch, Globe, Cpu, Lock, Plug, Boxes, Layers, Workflow, Server, Zap, Cloud, Route } from 'lucide-react';

interface ValuePropsProps {
  isDarkMode?: boolean;
}

interface Feature {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  size: 'small' | 'medium' | 'large' | 'wide' | 'tall';
  highlight?: boolean;
}

const features: Feature[] = [
  {
    id: 'kernel',
    name: 'Universal Execution Kernel',
    category: 'CORE',
    description: 'Lightweight runtime daemon hosting application logic. Manages event triggers, network connections, and resource context in a single binary.',
    icon: Cpu,
    size: 'large',
    highlight: true,
  },
  {
    id: 'workflow',
    name: 'Distributed Workflow Orchestration',
    category: 'ORCHESTRATION',
    description: 'Chains discrete functions across services. Native state propagation, conditional branching, and parallel execution.',
    icon: GitBranch,
    size: 'wide',
  },
  {
    id: 'bridge',
    name: 'Bidirectional Event Bridge',
    category: 'CORE',
    description: 'Persistent two-way data plane. Streams triggers, state, and logs across network boundaries.',
    icon: Network,
    size: 'medium',
  },
  {
    id: 'context',
    name: 'Transparent Context Proxy',
    category: 'RUNTIME',
    description: 'Exposes remote capabilities as local async functions. Abstracts network calls and serialization.',
    icon: Code,
    size: 'medium',
  },
  {
    id: 'queue',
    name: 'Event & Queueing',
    category: 'MODULES',
    description: 'Built-in message broker. Asynchronous job dispatch, retry logic, and dead-letter handling.',
    icon: Layers,
    size: 'small',
  },
  {
    id: 'logging',
    name: 'Unified Logging',
    category: 'OBSERVABILITY',
    description: 'Structured logging engine. Aggregates stdout/stderr with correlation IDs. Streams to centralized sinks.',
    icon: Eye,
    size: 'small',
  },
  {
    id: 'tracing',
    name: 'Distributed Tracing',
    category: 'OBSERVABILITY',
    description: 'OpenTelemetry instrumentation. Visualizes request lifecycle across edge, serverless, and local boundaries.',
    icon: Route,
    size: 'small',
  },
  {
    id: 'state',
    name: 'State Store',
    category: 'MODULES',
    description: 'Low-latency Key-Value store. Shares transient data across workers without external dependencies.',
    icon: Database,
    size: 'small',
  },
  {
    id: 'streaming',
    name: 'Real-Time Streaming',
    category: 'MODULES',
    description: 'Manages persistent WebSocket and SSE connections. Backend pushes updates without application-level state management.',
    icon: Zap,
    size: 'medium',
  },
  {
    id: 'database',
    name: 'Database Pooling',
    category: 'MODULES',
    description: 'Pooled database interface. Manages connection limits and authentication for transient serverless functions.',
    icon: Server,
    size: 'small',
  },
  {
    id: 'scheduler',
    name: 'Distributed Scheduler',
    category: 'MODULES',
    description: 'CRON and delayed interval triggers. Distributed leader election ensures exactly-once execution.',
    icon: Clock,
    size: 'small',
  },
  {
    id: 'secrets',
    name: 'Secrets & Config Manager',
    category: 'MODULES',
    description: 'Runtime injection of environment variables, API keys, and connection strings. Prevents hardcoded secrets.',
    icon: Lock,
    size: 'small',
  },
  {
    id: 'adapter',
    name: 'Modular Adapter Interface',
    category: 'EXTENSIBILITY',
    description: 'Build-time system for swapping backends. Compile custom modules into binary, extending ctx object capabilities.',
    icon: Plug,
    size: 'medium',
  },
  {
    id: 'discovery',
    name: 'Dynamic Worker Discovery',
    category: 'NETWORKING',
    description: 'Automatic control plane handshake. Dynamic routing table updates without static configuration.',
    icon: Boxes,
    size: 'small',
  },
  {
    id: 'polyglot',
    name: 'Polyglot Runtime Bridge',
    category: 'INTEROP',
    description: 'Direct typed communication between runtimes. Node.js calls Rust without manual API definitions.',
    icon: Globe,
    size: 'tall',
  },
  {
    id: 'embedding',
    name: 'Direct Framework Embedding',
    category: 'INTEROP',
    description: 'SDK integration for Express, Flask. Registers web applications as workers without sidecar processes.',
    icon: Code,
    size: 'small',
  },
  {
    id: 'triggers',
    name: 'Protocol-Agnostic Triggers',
    category: 'EVENTS',
    description: 'Normalizes HTTP, database mutations, timers into standard event objects. Single handler processes any trigger.',
    icon: Workflow,
    size: 'medium',
  },
  {
    id: 'sandbox',
    name: 'Native Runtime Sandboxing',
    category: 'SECURITY',
    description: 'Built-in isolation for untrusted code execution. No external virtualization or container tools required.',
    icon: Shield,
    size: 'small',
  },
  {
    id: 'agent-orchestration',
    name: 'Agent-Deterministic Orchestration',
    category: 'ORCHESTRATION',
    description: 'Unified control plane for deterministic code and probabilistic AI agents. Bidirectional triggering with shared state.',
    icon: GitBranch,
    size: 'wide',
  },
  {
    id: 'hybrid',
    name: 'Hybrid Execution Lifecycle',
    category: 'OPTIMIZATION',
    description: 'Orchestrates ephemeral serverless, edge functions, and long-lived servers based on workload requirements.',
    icon: Cloud,
    size: 'small',
  },
  {
    id: 'lazy',
    name: 'Lazy Resource Injection',
    category: 'OPTIMIZATION',
    description: 'Daemon maintains persistent connections. Passes DB pools and sockets to functions on-demand, eliminating overhead.',
    icon: Zap,
    size: 'small',
  },
  {
    id: 'tunnel',
    name: 'Secure Outbound Tunneling',
    category: 'NETWORKING',
    description: 'Exposes on-prem resources to edge functions via outbound WebSocket tunnels. Eliminates VPC peering.',
    icon: Network,
    size: 'small',
  },
  {
    id: 'overlay',
    name: 'Infrastructure Overlay',
    category: 'NETWORKING',
    description: 'Overlay network routing across providers. Workload migration between clouds and on-prem without re-architecture.',
    icon: Route,
    size: 'medium',
  },
  {
    id: 'routing',
    name: 'Heterogeneous Compute Routing',
    category: 'OPTIMIZATION',
    description: 'Routes coordination to edge, heavy compute to bare metal. Cost and performance profile optimization.',
    icon: Boxes,
    size: 'small',
  },
  {
    id: 'replay',
    name: 'Durable Execution Replay',
    category: 'RELIABILITY',
    description: 'Persists execution state and event history. Automatic retries and deterministic replay of interrupted workflows.',
    icon: Database,
    size: 'medium',
  },
];

const getSizeClasses = (size: string) => {
  return {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 md:col-span-1 row-span-1',
    large: 'col-span-1 md:col-span-2 md:row-span-2',
    wide: 'col-span-1 md:col-span-2 row-span-1',
    tall: 'col-span-1 md:row-span-2',
  }[size];
};

export const ValueProps: React.FC<ValuePropsProps> = ({ isDarkMode = true }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const textPrimary = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const textSecondary = isDarkMode ? 'text-iii-medium-dark' : 'text-iii-medium-light';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';
  const borderColor = isDarkMode ? 'border-iii-medium/20' : 'border-iii-medium/20';
  const hoverBorder = isDarkMode ? 'hover:border-iii-accent/50' : 'hover:border-iii-accent-light/50';
  const bgBase = isDarkMode ? 'bg-iii-black' : 'bg-iii-light';
  const bgCard = isDarkMode ? 'bg-iii-dark/30' : 'bg-white/30';
  const bgCardHover = isDarkMode ? 'bg-iii-dark/60' : 'bg-white/60';

  const categories = Array.from(new Set(features.map(f => f.category)));
  const filteredFeatures = features.filter(f => !activeCategory || f.category === activeCategory);

  return (
    <section className={`w-full ${bgBase} py-8 md:py-12`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-10">
          <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
            <div>
              <p className={`text-[10px] tracking-[0.3em] uppercase mb-2 md:mb-3 font-mono ${textSecondary}`}>
                /infrastructure/primitives
              </p>
              <h2 className={`text-2xl md:text-5xl font-black tracking-tighter ${textPrimary}`}>
                RUNTIME.<br/>
                <span className={accentColor}>INFRASTRUCTURE.</span>
              </h2>
            </div>

            <p className={`text-xs md:text-base max-w-2xl ${textSecondary}`}>
              Distributed execution infrastructure. Single binary. Zero external dependencies.
            </p>
          </div>

          {/* Category Filter - Horizontal Scroll on Mobile */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <div className="flex gap-2 min-w-max md:flex-wrap">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-1.5 text-xs font-mono border rounded-full transition-all whitespace-nowrap ${
                  activeCategory === null
                    ? isDarkMode
                      ? 'bg-iii-accent/20 border-iii-accent text-iii-accent'
                      : 'bg-iii-accent-light/20 border-iii-accent-light text-iii-accent-light'
                    : `${borderColor} ${textSecondary} hover:border-iii-medium/40`
                }`}
              >
                ALL
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                  className={`px-3 py-1.5 text-xs font-mono border rounded-full transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? isDarkMode
                        ? 'bg-iii-accent/20 border-iii-accent text-iii-accent'
                        : 'bg-iii-accent-light/20 border-iii-accent-light text-iii-accent-light'
                      : `${borderColor} ${textSecondary} hover:border-iii-medium/40`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bento Grid - Compact on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 auto-rows-[100px] md:auto-rows-[110px]">
          {filteredFeatures.map((feature) => {
              const Icon = feature.icon;
              const isHovered = hoveredId === feature.id;
              const isHighlight = feature.highlight;

              return (
                <div
                  key={feature.id}
                  className={`
                    group relative overflow-hidden
                    ${getSizeClasses(feature.size)}
                    border ${borderColor} ${hoverBorder}
                    rounded-lg md:rounded-xl
                    transition-all duration-300
                    cursor-pointer
                    ${isHovered ? bgCardHover : bgCard}
                    ${isHighlight ? 'md:col-span-2 md:row-span-2' : ''}
                  `}
                  onMouseEnter={() => setHoveredId(feature.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Background pattern */}
                  <div className={`absolute inset-0 opacity-[0.02] ${
                    isHovered ? 'opacity-[0.05]' : ''
                  } transition-opacity`}>
                    <div className="absolute inset-0" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${isDarkMode ? 'ffffff' : '000000'}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                  </div>

                  {/* Content */}
                  <div className={`relative h-full flex flex-col ${
                    isHighlight ? 'p-3 md:p-5' : 'p-3 md:p-4'
                  }`}>
                    {/* Category & Icon */}
                    <div className="flex items-start justify-between mb-1.5 md:mb-2">
                      <span className={`text-[7px] md:text-[8px] tracking-[0.2em] font-mono ${textSecondary} opacity-70`}>
                        {feature.category}
                      </span>
                      <div className={`p-1 md:p-1.5 rounded-lg transition-all ${
                        isHovered
                          ? isDarkMode ? 'bg-iii-accent/20' : 'bg-iii-accent-light/20'
                          : 'bg-transparent'
                      }`}>
                        <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${
                          isHovered ? accentColor : textSecondary
                        }`} />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="flex-1 overflow-hidden">
                      <h3 className={`font-bold line-clamp-2 transition-colors ${
                        isHighlight ? 'text-sm md:text-base' : 'text-xs md:text-sm'
                      } ${isHovered ? accentColor : textPrimary}`}>
                        {feature.name}
                      </h3>

                      {/* Description - Only show on large cards */}
                      {isHighlight && (
                        <p className={`text-[9px] md:text-[11px] leading-snug mt-1.5 md:mt-2 line-clamp-2 md:line-clamp-3 ${textSecondary}`}>
                          {feature.description}
                        </p>
                      )}
                    </div>

                    {/* Hover indicator */}
                    <div className={`absolute bottom-2 md:bottom-3 right-2 md:right-3 transition-opacity ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isDarkMode ? 'bg-iii-accent' : 'bg-iii-accent-light'
                      } animate-pulse`} />
                    </div>
                  </div>

                  {/* Accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 transition-all ${
                    isHovered
                      ? isDarkMode ? 'bg-iii-accent' : 'bg-iii-accent-light'
                      : 'bg-transparent'
                  }`} />
                </div>
              );
            })}
        </div>

        {/* Footer - Compact on Mobile */}
        <div className={`mt-4 md:mt-8 p-3 md:p-4 border ${borderColor} rounded-lg md:rounded-xl ${bgCard}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
            <p className={`text-xs md:text-sm font-mono ${textSecondary}`}>
              {features.length} infrastructure primitives. Single daemon. No external orchestration.
            </p>
            <div className={`text-xs font-mono ${textSecondary}`}>
              <span className={accentColor}>{filteredFeatures.length}</span> / <span className={accentColor}>{features.length}</span> modules
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

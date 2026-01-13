import React, { useState } from 'react';
import { Zap, Network, Database, Eye, Clock, Shield, Code, GitBranch, Globe } from 'lucide-react';

interface ValuePropsProps {
  isDarkMode?: boolean;
}

interface Feature {
  name: string;
  type: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const features: Feature[] = [
  {
    name: 'Universal Execution Kernel',
    type: 'Core Architecture',
    description: 'A lightweight, portable runtime daemon that acts as the primary host for application logic, abstracting infrastructure complexity by managing event triggers, network connections, and resource context in a single binary.',
    icon: Zap,
  },
  {
    name: 'Distributed Workflow Orchestration',
    type: 'Orchestration',
    description: 'Chains discrete functions from different services into coherent multi-step workflows, managing state propagation, conditional branching, and parallel execution patterns natively.',
    icon: GitBranch,
  },
  {
    name: 'Bidirectional Event Bridge',
    type: 'Core Architecture',
    description: 'The core communication layer that establishes a persistent, two-way data plane between the daemon and your code, enabling the seamless streaming of triggers, state, and logs across network boundaries.',
    icon: Network,
  },
  {
    name: 'Transparent Context Proxy',
    type: 'Runtime Utility',
    description: 'Exposes remote capabilities (state, DB, streams, etc) as local async functions within the runtime scope, abstracting network calls and serialization.',
    icon: Code,
  },
  {
    name: 'Unified Logging & Distributed Tracing',
    type: 'Observability',
    description: 'Structured logging engine that aggregates stdout/stderr from distributed workers with OpenTelemetry-compatible trace contexts, visualizing the full request lifecycle across all boundaries.',
    icon: Eye,
  },
  {
    name: 'State Store & Real-Time Streaming',
    type: 'Core Module',
    description: 'Lightweight, low-latency Key-Value store and persistent WebSocket/SSE connections for sharing transient data and pushing updates without managing connection state.',
    icon: Database,
  },
  {
    name: 'Distributed Scheduler',
    type: 'Core Module',
    description: 'Precision timing engine that triggers workflows based on CRON schedules or delayed intervals, managing distributed leader election to ensure tasks run exactly once across the mesh.',
    icon: Clock,
  },
  {
    name: 'Polyglot Runtime Bridge',
    type: 'Interoperability',
    description: 'Enables direct, typed communication between different runtimes (e.g., Node.js calling Rust) via the bridge, bypassing manual API definitions.',
    icon: Globe,
  },
  {
    name: 'Native Runtime Sandboxing',
    type: 'Security',
    description: 'Built-in isolation for local workers, allowing untrusted code execution without configuring external virtualization or container management tools.',
    icon: Shield,
  },
];

export const ValueProps: React.FC<ValuePropsProps> = ({ isDarkMode = true }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const textPrimary = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const textSecondary = isDarkMode ? 'text-iii-medium-dark' : 'text-iii-medium-light';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';
  const cardBg = isDarkMode ? 'bg-iii-dark/50' : 'bg-white/50';
  const cardBorder = isDarkMode ? 'border-iii-medium/30' : 'border-iii-medium/20';
  const hoverBorder = isDarkMode ? 'hover:border-iii-accent/50' : 'hover:border-iii-accent-light/50';

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
      {/* Header */}
      <div className="text-center mb-12 md:mb-16">
        <p className="text-[10px] md:text-xs text-iii-medium tracking-[0.2em] uppercase mb-3">
          Built for scale
        </p>
        <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter mb-4 ${textPrimary}`}>
          EVERYTHING YOU NEED. <span className={accentColor}>NOTHING YOU DON'T.</span>
        </h2>
        <p className={`text-sm md:text-base ${textSecondary} max-w-2xl mx-auto`}>
          From distributed orchestration to real-time streaming, iii provides a complete runtime infrastructure in a single binary.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {features.map((feature, index) => {
          const isExpanded = expandedIndex === index;
          const Icon = feature.icon;

          return (
            <div
              key={feature.name}
              className={`
                relative group cursor-pointer
                p-4 md:p-6 rounded-lg border transition-all duration-300
                ${cardBg} ${cardBorder} ${hoverBorder}
                ${isExpanded ? isDarkMode ? 'border-iii-accent bg-iii-dark' : 'border-iii-accent-light bg-white' : ''}
              `}
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
            >
              {/* Icon & Type Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded transition-colors ${
                  isExpanded
                    ? isDarkMode ? 'bg-iii-accent/20' : 'bg-iii-accent-light/20'
                    : isDarkMode ? 'bg-iii-black/50' : 'bg-iii-light/50'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isExpanded ? accentColor : textSecondary
                  }`} />
                </div>
                <span className={`text-[8px] md:text-[9px] px-2 py-1 rounded border uppercase tracking-wider ${
                  isExpanded
                    ? isDarkMode
                      ? 'border-iii-accent/50 text-iii-accent bg-iii-accent/10'
                      : 'border-iii-accent-light/50 text-iii-accent-light bg-iii-accent-light/10'
                    : `${cardBorder} ${textSecondary}`
                }`}>
                  {feature.type}
                </span>
              </div>

              {/* Title */}
              <h3 className={`text-sm md:text-base font-bold mb-2 transition-colors ${
                isExpanded ? accentColor : textPrimary
              }`}>
                {feature.name}
              </h3>

              {/* Description */}
              <p className={`text-xs md:text-sm leading-relaxed transition-all duration-300 ${
                isExpanded ? textPrimary : textSecondary
              } ${isExpanded ? 'line-clamp-none' : 'line-clamp-3'}`}>
                {feature.description}
              </p>

              {/* Expand indicator */}
              <div className={`mt-3 text-[10px] font-mono transition-opacity ${
                isExpanded ? 'opacity-0' : 'opacity-50 group-hover:opacity-100'
              } ${textSecondary}`}>
                Click to expand →
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Features List */}
      <div className="mt-12 md:mt-16 text-center">
        <p className={`text-xs ${textSecondary} mb-4`}>
          And more: Event & Queueing • Database Pooling • Secrets Manager • Dynamic Worker Discovery • Protocol-Agnostic Triggers • Durable Execution Replay
        </p>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Code, Boxes, Briefcase } from 'lucide-react';

interface PersonaValuePropsProps {
  isDarkMode?: boolean;
}

interface Benefit {
  title: string;
  engineer: string;
  architect: string;
  cto: string;
}

const benefits: Benefit[] = [
  {
    title: 'Stack Unification',
    engineer: 'Triggers and functions abstraction. Reduces context switching across tooling.',
    architect: 'Centralized dependency management. Single control plane for system coordination.',
    cto: 'Consolidated subscription view. Unified cost tracking across infrastructure.',
  },
  {
    title: 'Observability',
    engineer: 'Call stack error tracing. Record, modify, and replay execution paths.',
    architect: 'Zero-instrumentation distributed tracing. Request lifecycle visualization.',
    cto: 'TTR optimization. SLA monitoring with behavioral analytics.',
  },
  {
    title: 'Orchestration',
    engineer: 'Business logic focus. Eliminates integration layer development.',
    architect: 'Vendor-agnostic architecture. Hot deployments without downtime.',
    cto: 'Operational consolidation. Single orchestration provider.',
  },
  {
    title: 'Runtime Context',
    engineer: 'Sandboxed execution. Cross-language function calls without API layers.',
    architect: 'Function-level language selection. Component migration without system impact.',
    cto: 'Architectural flexibility. Rapid response to requirement changes.',
  },
];

const personas = [
  {
    id: 'engineer',
    name: 'Backend Engineer',
    icon: Code,
    description: 'Application logic development',
  },
  {
    id: 'architect',
    name: 'System Architect',
    icon: Boxes,
    description: 'Infrastructure design and integration',
  },
  {
    id: 'cto',
    name: 'CTO',
    icon: Briefcase,
    description: 'Technical strategy and operations',
  },
] as const;

type PersonaId = typeof personas[number]['id'];

const technicalBenefits = [
  'Framework agnostic',
  'Language agnostic',
  'Cloud agnostic',
  'Protocol agnostic',
  'Zero vendor lock-in',
  'Zero-downtime deployments',
];

export const PersonaValueProps: React.FC<PersonaValuePropsProps> = ({ isDarkMode = true }) => {
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('engineer');
  const [hoveredBenefit, setHoveredBenefit] = useState<number | null>(null);

  const textPrimary = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const textSecondary = isDarkMode ? 'text-iii-medium-dark' : 'text-iii-medium-light';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';
  const accentBg = isDarkMode ? 'bg-iii-accent' : 'bg-iii-accent-light';
  const accentBgLight = isDarkMode ? 'bg-iii-accent/20' : 'bg-iii-accent-light/20';
  const accentBgLighter = isDarkMode ? 'bg-iii-accent/5' : 'bg-iii-accent-light/5';
  const accentBorder = isDarkMode ? 'border-iii-accent/50' : 'border-iii-accent-light/50';
  const accentBorderLight = isDarkMode ? 'border-iii-accent/30' : 'border-iii-accent-light/30';
  const borderColor = isDarkMode ? 'border-iii-medium/20' : 'border-iii-medium/20';
  const bgBase = isDarkMode ? 'bg-iii-black' : 'bg-iii-light';
  const bgCard = isDarkMode ? 'bg-iii-dark/30' : 'bg-white/30';
  const bgCardHover = isDarkMode ? 'bg-iii-dark/60' : 'bg-white/60';

  const getValueForPersona = (benefit: Benefit): string => {
    switch (selectedPersona) {
      case 'engineer': return benefit.engineer;
      case 'architect': return benefit.architect;
      case 'cto': return benefit.cto;
    }
  };

  const selectedPersonaData = personas.find(p => p.id === selectedPersona)!;

  return (
    <section className={`w-full ${bgBase} py-8 md:py-24 border-t ${borderColor}`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-16">
          <p className={`text-[10px] tracking-[0.3em] uppercase mb-2 md:mb-3 font-mono ${textSecondary}`}>
            /roles
          </p>
          <h2 className={`text-2xl md:text-5xl font-black tracking-tighter mb-3 md:mb-4 ${textPrimary}`}>
            ROLE-SPECIFIC.<br/>
            <span className={accentColor}>IMPLEMENTATION.</span>
          </h2>
          <p className={`text-xs md:text-base max-w-2xl mx-auto ${textSecondary}`}>
            Infrastructure abstraction for engineers, architects, and technical leadership.
          </p>
        </div>

        {/* Mobile: Simplified static view - all roles visible */}
        <div className="md:hidden space-y-4">
          {personas.map((persona) => {
            const Icon = persona.icon;
            return (
              <div key={persona.id} className={`p-4 rounded-lg border ${borderColor} ${bgCard}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${accentBgLight}`}>
                    <Icon className={`w-5 h-5 ${accentColor}`} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${textPrimary}`}>{persona.name}</h3>
                    <p className={`text-[10px] font-mono ${textSecondary}`}>{persona.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className={`text-[11px] leading-relaxed ${textSecondary}`}>
                    <span className={`font-bold ${textPrimary}`}>Stack:</span> {benefits[0][persona.id as PersonaId]}
                  </div>
                  <div className={`text-[11px] leading-relaxed ${textSecondary}`}>
                    <span className={`font-bold ${textPrimary}`}>Observability:</span> {benefits[1][persona.id as PersonaId]}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Universal Benefits - Mobile */}
          <div className={`p-4 rounded-lg border ${borderColor} ${bgCard}`}>
            <h4 className={`text-xs font-mono mb-3 ${textSecondary}`}>UNIVERSAL:</h4>
            <div className="grid grid-cols-2 gap-2">
              {technicalBenefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${accentBg}`} />
                  <span className={`text-[10px] font-mono ${textSecondary}`}>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: Interactive role-switching layout */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
          {/* Persona Selector */}
          <div className="lg:col-span-4 space-y-2 md:space-y-3">
            {personas.map((persona) => {
              const Icon = persona.icon;
              const isSelected = selectedPersona === persona.id;
              const bgInactive = isDarkMode ? 'bg-iii-black/50' : 'bg-iii-light/50';
              const iconBgClass = isSelected ? accentBgLight : bgInactive;

              return (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`
                    w-full text-left p-4 md:p-6 rounded-lg md:rounded-xl border-2 transition-all duration-300
                    ${isSelected
                      ? `${borderColor.replace('/20', '/100')} ${bgCardHover}`
                      : `${borderColor} ${bgCard} hover:${bgCardHover}`
                    }
                  `}
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className={`p-2 md:p-3 rounded-lg transition-all ${iconBgClass}`}>
                      <Icon className={`w-6 h-6 transition-colors ${isSelected ? accentColor : textSecondary}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-base font-bold transition-colors ${isSelected ? accentColor : textPrimary}`}>
                          {persona.name}
                        </h3>
                        {isSelected && (
                          <div className={`w-2 h-2 rounded-full ${accentBg} animate-pulse`} />
                        )}
                      </div>

                      <p className={`text-xs font-mono ${isSelected ? textSecondary : `${textSecondary} opacity-70`}`}>
                        {persona.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Technical Benefits */}
            <div className={`p-6 rounded-xl border ${borderColor} ${bgCard}`}>
              <h4 className={`text-xs font-mono mb-3 ${textSecondary}`}>
                UNIVERSAL:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {technicalBenefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${accentBg}`} />
                    <span className={`text-[10px] font-mono ${textSecondary}`}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits Content */}
          <div className="lg:col-span-8 space-y-3 md:space-y-4">
            {/* Active Persona Banner */}
            <div className={`p-4 md:p-6 rounded-lg md:rounded-xl border-2 ${accentBorder} ${accentBgLighter}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-mono mb-1 ${textSecondary}`}>
                    CONTEXT:
                  </p>
                  <h3 className={`text-xl md:text-2xl font-bold ${accentColor}`}>
                    {selectedPersonaData.name}
                  </h3>
                </div>
                <span className={`text-3xl md:text-4xl font-mono font-bold ${accentColor}`}>&gt;</span>
              </div>
            </div>

            {/* Benefit Cards */}
            {benefits.map((benefit, index) => {
              const isHovered = hoveredBenefit === index;
              const accentBgVeryLight = isDarkMode ? 'bg-iii-accent/10' : 'bg-iii-accent-light/10';
              const badgeBorder = isDarkMode ? 'border-iii-accent/50' : 'border-iii-accent-light/50';
              const badgeClasses = isHovered
                ? `${badgeBorder} ${accentColor} ${accentBgVeryLight}`
                : `${borderColor} ${textSecondary}`;

              return (
                <div
                  key={benefit.title}
                  className={`
                    p-4 md:p-6 rounded-lg md:rounded-xl border transition-all duration-300
                    ${borderColor} ${isHovered ? bgCardHover : bgCard}
                    hover:border-iii-accent/30
                  `}
                  onMouseEnter={() => setHoveredBenefit(index)}
                  onMouseLeave={() => setHoveredBenefit(null)}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full border text-[10px] md:text-xs font-mono ${badgeClasses}`}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <h4 className={`text-sm md:text-lg font-bold ${isHovered ? accentColor : textPrimary}`}>
                          {benefit.title}
                        </h4>
                      </div>

                      <p className={`text-xs md:text-sm leading-relaxed ${textPrimary}`}>
                        {getValueForPersona(benefit)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Footer CTA */}
            <div className={`p-6 rounded-xl border-2 ${accentBorderLight} ${bgCard}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className={`text-sm font-bold mb-1 ${textPrimary}`}>
                    Single integration point
                  </p>
                  <p className={`text-xs font-mono ${textSecondary}`}>
                    Runtime daemon + SDK
                  </p>
                </div>
                <div className={`text-2xl font-black font-mono ${accentColor}`}>
                  iii
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Code, Boxes, Briefcase } from 'lucide-react';

interface PersonaValuePropsProps {
  isDarkMode?: boolean;
}

interface PersonaValue {
  category: string;
  engineerValue: string;
  architectValue: string;
  ctoValue: string;
}

const personaValues: PersonaValue[] = [
  {
    category: 'Stack Unification',
    engineerValue: 'Your entire stack abstracted to triggers and functions. Avoid context overload.',
    architectValue: 'Simplifying and centralizing your dependencies and services.',
    ctoValue: 'Reduce costs with a single view of all your subscriptions and how much you\'re paying for them.',
  },
  {
    category: 'Observability',
    engineerValue: 'Logs and traces everywhere, for free. Instantly pinpoint error origins in your call stack. Record, modify, and replay anything.',
    architectValue: 'Instant observability, trace anything anywhere.',
    ctoValue: 'Operational efficiency, SLAs, TTR, and prioritization with full visibility into how users are actually using your service.',
  },
  {
    category: 'Orchestration',
    engineerValue: 'Focus 100% on your business logic. Stop gluing and architecting inside your application layer.',
    architectValue: 'Avoid lock-in. Freely choose any stack. Single point of integration. Hot deployments with no downtime.',
    ctoValue: 'Avoid unnecessary operational weight. One provider that covers all your orchestration needs.',
  },
  {
    category: 'Context',
    engineerValue: 'Fully informed agents, no sketchy MCP servers running code on your machine, fully sandboxed development if you need it. Frictionless cross-process communication.',
    architectValue: 'Freedom to choose the right language for the task at hand. Function-level migrations, painlessly swap out components of your application without affecting anything else.',
    ctoValue: 'Future proof flexibility. Needs change. Respond quicker than anyone else.',
  },
];

const personas = [
  {
    id: 'engineer',
    name: 'Backend Engineer',
    icon: Code,
    tagline: 'Write logic, not glue code',
    description: 'Focus on building features while iii handles infrastructure complexity',
  },
  {
    id: 'architect',
    name: 'System Architect',
    icon: Boxes,
    tagline: 'Design without constraints',
    description: 'Choose the right tool for each task without lock-in or integration overhead',
  },
  {
    id: 'cto',
    name: 'CTO',
    icon: Briefcase,
    tagline: 'Scale smart, not hard',
    description: 'Reduce operational costs while improving visibility and team velocity',
  },
] as const;

type PersonaId = typeof personas[number]['id'];

export const PersonaValueProps: React.FC<PersonaValuePropsProps> = ({ isDarkMode = true }) => {
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('engineer');

  const textPrimary = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const textSecondary = isDarkMode ? 'text-iii-medium-dark' : 'text-iii-medium-light';
  const accentColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';
  const cardBg = isDarkMode ? 'bg-iii-dark/50' : 'bg-white/50';
  const cardBorder = isDarkMode ? 'border-iii-medium/30' : 'border-iii-medium/20';
  const selectedBg = isDarkMode ? 'bg-iii-dark border-iii-accent' : 'bg-white border-iii-accent-light';
  const hoverBg = isDarkMode ? 'hover:bg-iii-dark/80' : 'hover:bg-white/80';

  const getValueForPersona = (value: PersonaValue): string => {
    switch (selectedPersona) {
      case 'engineer':
        return value.engineerValue;
      case 'architect':
        return value.architectValue;
      case 'cto':
        return value.ctoValue;
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
      {/* Header */}
      <div className="text-center mb-12 md:mb-16">
        <p className="text-[10px] md:text-xs text-iii-medium tracking-[0.2em] uppercase mb-3">
          Choose your fighter
        </p>
        <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter mb-4 ${textPrimary}`}>
          BUILT FOR <span className={accentColor}>YOUR ROLE</span>
        </h2>
        <p className={`text-sm md:text-base ${textSecondary} max-w-2xl mx-auto`}>
          Different problems, one solution. See how iii empowers each role in your organization.
        </p>
      </div>

      {/* Persona Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {personas.map((persona) => {
          const Icon = persona.icon;
          const isSelected = selectedPersona === persona.id;

          return (
            <button
              key={persona.id}
              onClick={() => setSelectedPersona(persona.id)}
              className={`
                relative p-6 rounded-lg border-2 transition-all duration-300 text-left
                ${isSelected ? selectedBg : `${cardBg} ${cardBorder} ${hoverBg}`}
                ${isSelected ? 'scale-105 shadow-lg' : 'hover:scale-102'}
              `}
            >
              <div className={`inline-flex p-3 rounded-lg mb-4 transition-colors ${
                isSelected
                  ? isDarkMode ? 'bg-iii-accent/20' : 'bg-iii-accent-light/20'
                  : isDarkMode ? 'bg-iii-black/50' : 'bg-iii-light/50'
              }`}>
                <Icon className={`w-6 h-6 ${isSelected ? accentColor : textSecondary}`} />
              </div>

              <h3 className={`text-base md:text-lg font-bold mb-2 transition-colors ${
                isSelected ? accentColor : textPrimary
              }`}>
                {persona.name}
              </h3>

              <p className={`text-xs md:text-sm font-semibold mb-2 ${
                isSelected ? textPrimary : textSecondary
              }`}>
                {persona.tagline}
              </p>

              <p className={`text-xs ${isSelected ? textSecondary : `${textSecondary} opacity-70`}`}>
                {persona.description}
              </p>

              {/* Selection indicator */}
              {isSelected && (
                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                  isDarkMode ? 'bg-iii-accent' : 'bg-iii-accent-light'
                } animate-pulse`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Value Propositions for Selected Persona */}
      <div className="space-y-4">
        {personaValues.map((value, index) => (
          <div
            key={value.category}
            className={`
              p-6 rounded-lg border transition-all duration-300
              ${cardBg} ${cardBorder}
              hover:border-iii-accent/50
              animate-fade-in
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isDarkMode ? 'bg-iii-accent/20 text-iii-accent' : 'bg-iii-accent-light/20 text-iii-accent-light'
              }`}>
                {index + 1}
              </div>

              <div className="flex-1">
                <h4 className={`text-sm md:text-base font-bold mb-2 ${accentColor}`}>
                  {value.category}
                </h4>
                <p className={`text-xs md:text-sm leading-relaxed ${textPrimary}`}>
                  {getValueForPersona(value)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Benefits */}
      <div className={`mt-12 p-6 rounded-lg border ${cardBg} ${cardBorder}`}>
        <h4 className={`text-sm md:text-base font-bold mb-4 text-center ${textPrimary}`}>
          Universal Benefits
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs md:text-sm">
          {[
            'Lock-in free. Framework agnostic.',
            'Language agnostic. Stack agnostic.',
            'Cloud agnostic. Protocol agnostic.',
            'Hot deployments. No downtime.',
            'Single point of integration.',
            'Change agnostic. Future proof.',
          ].map((benefit, i) => (
            <div key={i} className={`flex items-center gap-2 ${textSecondary}`}>
              <span className={`text-lg ${accentColor}`}>✓</span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
